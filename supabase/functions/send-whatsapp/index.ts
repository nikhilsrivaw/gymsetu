import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET =
  Deno.env.get("WEBHOOK_SECRET") ?? "gymsetu_webhook_2026";

const META_API = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Phone formatting ───────────────────────────────────────────
function formatPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 13 && digits.startsWith("+91")) return digits.slice(1);
  return null;
}

// ── Token deduction (1 token per message) ──────────────────────
// Does NOT block if tokens are exhausted — message still sends.
async function deductToken(gymId: string, count = 1): Promise<void> {
  try {
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const { data: row } = await supabase
      .from("subscription_tokens")
      .select("id, tokens_used, tokens_total")
      .eq("gym_id", gymId)
      .eq("month_year", monthYear)
      .maybeSingle();

    if (row) {
      await supabase
        .from("subscription_tokens")
        .update({ tokens_used: row.tokens_used + count })
        .eq("id", row.id);
    } else {
      await supabase.from("subscription_tokens").insert({
        gym_id: gymId,
        month_year: monthYear,
        tokens_total: 500,
        tokens_used: count,
      });
    }
  } catch (err) {
    console.error("[send-whatsapp] token deduction failed:", err);
  }
}

// ── Send template message via Meta API ─────────────────────────
async function sendTemplate(
  to: string,
  templateName: string,
  params: string[]
): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components:
        params.length > 0
          ? [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text })),
              },
            ]
          : [],
    },
  };

  const res = await fetch(META_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Meta API error:", JSON.stringify(err));
    return { ok: false, error: err?.error?.message ?? `HTTP ${res.status}` };
  }

  return { ok: true };
}

// ── Map message type → template name + parameters ──────────────
// Template names must match what you create in Meta WhatsApp Manager
function getTemplateInfo(
  type: string,
  data: Record<string, any>
): { template: string; params: string[] } | null {
  switch (type) {
    case "welcome":
      return {
        template: "gymsetu_welcome_members",
        // {{1}} member_name, {{2}} gym_name
        // NOTE: login credentials are intentionally NOT sent over WhatsApp —
        // Meta rejects templates that share passwords. The gym owner shares the
        // member's login ID + password directly (shown to them in the app).
        params: [
          data.member_name ?? "",
          data.gym_name ?? "",
        ],
      };

    case "payment_confirm":
      return {
        template: "gymsetu_payment_confirmation",
        // {{1}} member_name, {{2}} amount, {{3}} plan_name, {{4}} gym_name, {{5}} expiry_date
        params: [
          data.member_name ?? "",
          String(data.amount ?? ""),
          data.plan_name ?? "",
          data.gym_name ?? "",
          data.expiry_date ?? "",
        ],
      };

    case "expiry_reminder":
      return {
        template: "gymsetu_expiry_reminder",
        // {{1}} member_name, {{2}} gym_name, {{3}} days_left, {{4}} expiry_date
        params: [
          data.member_name ?? "",
          data.gym_name ?? "",
          String(data.days_left ?? ""),
          data.expiry_date ?? "",
        ],
      };

    case "membership_expired":
      return {
        template: "gymsetu_membership_expired",
        // {{1}} member_name, {{2}} gym_name, {{3}} expiry_date
        params: [
          data.member_name ?? "",
          data.gym_name ?? "",
          data.expiry_date ?? "",
        ],
      };

    case "inactive_nudge":
      return {
        template: "gymsetu_inactive_nudge",
        // {{1}} member_name, {{2}} gym_name, {{3}} days_inactive
        params: [
          data.member_name ?? "",
          data.gym_name ?? "",
          String(data.days_inactive ?? ""),
        ],
      };

    case "announcement":
      return {
        template: "gymsetu_announcement",
        // {{1}} member_name, {{2}} gym_name, {{3}} message
        params: [
          data.member_name ?? "",
          data.gym_name ?? "",
          data.message ?? "",
        ],
      };

    default:
      return null;
  }
}

// ── Main handler ─────────���─────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  // ── Auth check — allow webhook secret OR bearer token ────────
  const webhookSecret = req.headers.get("x-webhook-secret");
  const authHeader = req.headers.get("authorization");
  if (webhookSecret !== WEBHOOK_SECRET && !authHeader?.includes("Bearer")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const body = await req.json();
    const { type, phone, data, gym_id } = body;

    if (!type || !data) {
      return new Response(
        JSON.stringify({ error: "Missing type or data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Bulk announcement ─────────────────────────────────────
    // Token deduction for broadcasts is handled app-side (announcements.tsx)
    if (type === "announcement" && gym_id && !phone) {
      const { data: members } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("gym_id", gym_id)
        .eq("role", "member")
        .not("phone", "is", null);

      const validMembers = (members ?? []).filter((m) => m.phone);
      let sent = 0;
      let failed = 0;

      for (const m of validMembers) {
        const to = formatPhone(m.phone);
        if (!to) {
          failed++;
          continue;
        }

        const info = getTemplateInfo("announcement", {
          ...data,
          member_name: m.full_name,
        });
        if (!info) {
          failed++;
          continue;
        }

        const result = await sendTemplate(to, info.template, info.params);
        if (result.ok) {
          sent++;
        } else {
          failed++;
        }
      }

      return new Response(JSON.stringify({ sent, failed }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ��─ Single message ────────────────────────────────────────
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Missing phone" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const to = formatPhone(phone);
    if (!to) {
      return new Response(
        JSON.stringify({ error: `Invalid phone number: ${phone}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const info = getTemplateInfo(type, data);
    if (!info) {
      return new Response(
        JSON.stringify({ error: `Unknown message type: ${type}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await sendTemplate(to, info.template, info.params);

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Deduct 1 token for single message ─────────────────────
    if (gym_id) {
      await deductToken(gym_id, 1);
    }

    return new Response(JSON.stringify({ sent: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[send-whatsapp] error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
