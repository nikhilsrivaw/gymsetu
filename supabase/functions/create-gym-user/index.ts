import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Random ID and password generators ────────────────────────────
// Excludes confusing chars (0/O, 1/I/l) for easier WhatsApp sharing
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number): string {
  let result = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    result += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return result;
}

function generateLoginCode(role: "member" | "trainer"): string {
  const prefix = role === "member" ? "GSM-" : "GST-";
  return prefix + randomCode(6);
}

function generatePassword(): string {
  return randomCode(8);
}

interface CreateGymUserBody {
  role: "member" | "trainer";
  gymId: string;
  fullName: string;
  extraData?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as CreateGymUserBody;
    const { role, gymId, fullName, extraData = {} } = body;

    if (!role || !["member", "trainer"].includes(role)) {
      return jsonError("role must be 'member' or 'trainer'", 400);
    }
    if (!gymId) return jsonError("gymId is required", 400);
    if (!fullName?.trim()) return jsonError("fullName is required", 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Generate credentials (retry once if code collision)
    let code = generateLoginCode(role);
    let password = generatePassword();
    let email = `${code.toLowerCase()}@gymsetu.app`;

    // Check collision against existing profiles/members/trainers codes
    const codeField = role === "member" ? "member_code" : "trainer_code";
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq(codeField, code)
      .maybeSingle();
    if (existing) {
      code = generateLoginCode(role);
      password = generatePassword();
      email = `${code.toLowerCase()}@gymsetu.app`;
    }

    // Create Supabase auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role, gym_id: gymId, full_name: fullName.trim() },
      });

    if (authError || !authData.user) {
      return jsonError(
        `Failed to create auth user: ${authError?.message ?? "unknown"}`,
        500,
      );
    }

    const userId = authData.user.id;

    // Build profile insert
    const profileRow: Record<string, unknown> = {
      id: userId,
      gym_id: gymId,
      role,
      full_name: fullName.trim(),
      email,
      status: "active",
      join_date: new Date().toISOString().split("T")[0],
      created_by: extraData.created_by ?? null,
    };

    // Common optional fields
    const passthrough = [
      "phone",
      "gender",
      "date_of_birth",
      "height_cm",
      "weight_kg",
      "goal",
      "emergency_contact_name",
      "emergency_contact_phone",
      "notes",
    ];
    for (const k of passthrough) {
      if (k in extraData) profileRow[k] = extraData[k];
    }

    if (role === "member") {
      profileRow.member_code = code;
      profileRow.member_password = password;
    } else {
      profileRow.trainer_code = code;
      profileRow.trainer_password = password;
      if ("specialization" in extraData)
        profileRow.specialization = extraData.specialization;
      if ("experience_years" in extraData)
        profileRow.experience_years = extraData.experience_years;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert(profileRow);

    if (profileError) {
      // Roll back auth user on profile insert failure
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
      return jsonError(
        `Failed to create profile: ${profileError.message}`,
        500,
      );
    }

    // Insert into role-specific table
    if (role === "member") {
      const memberRow: Record<string, unknown> = {
        gym_id: gymId,
        user_id: userId,
        full_name: fullName.trim(),
        member_code: code,
        member_password: password,
        status: "active",
        join_date: new Date().toISOString().split("T")[0],
        created_by: extraData.created_by ?? null,
      };
      for (const k of [
        "phone",
        "email",
        "gender",
        "date_of_birth",
        "address",
        "height_cm",
        "weight_kg",
        "goal",
        "emergency_contact_name",
        "emergency_contact_phone",
        "notes",
      ]) {
        if (k in extraData) memberRow[k] = extraData[k];
      }
      if (!memberRow.email) memberRow.email = email;

      const { error: memberError } = await supabase
        .from("members")
        .insert(memberRow);
      if (memberError) {
        console.error(
          "[create-gym-user] members insert failed:",
          memberError.message,
        );
        // Don't roll back here — profile exists which is the main auth anchor
      }
    } else {
      const trainerRow: Record<string, unknown> = {
        gym_id: gymId,
        user_id: userId,
        full_name: fullName.trim(),
        trainer_code: code,
        trainer_password: password,
        status: "active",
      };
      if ("phone" in extraData) trainerRow.phone = extraData.phone;
      if ("specialization" in extraData)
        trainerRow.specialization = extraData.specialization;

      const { error: trainerError } = await supabase
        .from("trainers")
        .insert(trainerRow);
      if (trainerError) {
        console.error(
          "[create-gym-user] trainers insert failed:",
          trainerError.message,
        );
      }
    }

    return new Response(
      JSON.stringify({ userId, code, password, email }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return jsonError(String(err), 500);
  }
});

function jsonError(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
