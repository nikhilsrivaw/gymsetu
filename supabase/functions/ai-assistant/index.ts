import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const AI_MODEL = "gpt-4o-mini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const prompts: Record<string, (d: any) => string> = {
  announcement: (d) =>
    "You are a gym manager assistant. Write a professional and engaging gym announcement for this topic: " +
    d.topic +
    ". Gym name: " +
    d.gymName +
    ". Keep it under 150 words, friendly and motivating.",

  renewal_message: (d) =>
    "Write a short WhatsApp message to remind a gym member to renew. Member: " +
    d.memberName +
    ". Plan: " +
    d.planName +
    ". Days left: " +
    d.daysLeft +
    ". Gym: " +
    d.gymName +
    ". Under 80 words, friendly, use emojis.",

  dashboard_insights: (d) =>
    "You are a gym business analyst. Give 3 short actionable insights based on: Total members: " +
    d.totalMembers +
    ", Active: " +
    d.activeMembers +
    ", Expiring this week: " +
    d.expiringThisWeek +
    ", Today attendance: " +
    d.todayAttendance +
    ", Monthly revenue: Rs." +
    d.monthRevenue +
    ". Each insight max 20 words. Use bullet points.",

  risk_alert: (d) =>
    "Is this gym member at risk of churning? Last visit: " +
    d.lastAttendance +
    " days ago. Days until expiry: " +
    d.daysUntilExpiry +
    ". Visits this month: " +
    d.monthVisits +
    ". Reply with only HIGH RISK, MEDIUM RISK, or LOW RISK followed by one short reason.",

  // Called by owner Members list (members/index.tsx) with a comma-separated
  // list of at-risk members ("Name (expires in N days)", "Name (expired)").
  risk_scan: (d) =>
    "You are a gym retention analyst. These members are at risk of churning: " +
    d.members +
    ". Give a short, prioritised action plan (max 4 bullet points) telling the " +
    "gym owner exactly who to contact first and what to offer to retain them. " +
    "Keep each bullet under 20 words and practical for an Indian gym.",

  revenue_summary: (d) =>
    "Summarize this gym revenue for the owner in 2-3 friendly sentences: This month: Rs." +
    d.monthRevenue +
    ", Last month: Rs." +
    d.lastMonthRevenue +
    ", Transactions: " +
    d.transactions +
    ", Top payment method: " +
    d.topMethod +
    ".",

  plan_recommender: (d) =>
    "Recommend the best membership plan for this gym member. Goal: " +
    d.goal +
    ". Current plan: " +
    d.currentPlan +
    ". Visits per month: " +
    d.visitFrequency +
    ". Available plans: " +
    d.availablePlans +
    ". Give recommendation in 2-3 sentences.",

  social_post: (d) =>
    "Write an engaging Instagram and WhatsApp caption for a gym. Gym name: " +
    d.gymName +
    ". Topic: " +
    d.topic +
    ". Include emojis and hashtags. Keep it energetic and motivating. Under 150 words.",

  monthly_report: (d) =>
    "Write a friendly monthly performance report for a gym owner. Month: " +
    d.month +
    ". New members: " +
    d.newMembers +
    ". Revenue: Rs." +
    d.revenue +
    ". Attendance days logged: " +
    d.attendanceDays +
    ". Renewals: " +
    d.renewals +
    ". Expired: " +
    d.expired +
    ". Write 3-4 sentences, highlight positives and areas to improve.",

  promo_campaign: (d) =>
    "Create a gym promotional campaign for " +
    d.occasion +
    ". Gym name: " +
    d.gymName +
    ". Suggest: 1) Offer idea 2) Announcement message under 80 words 3) Best time to promote. Keep it practical for a local gym in India.",

  growth_tips: (d) =>
    "You are a gym business consultant. Give 3 specific growth strategies for this gym: Total members: " +
    d.totalMembers +
    ", Active: " +
    d.activeMembers +
    ", Monthly revenue: Rs." +
    d.monthRevenue +
    ", Daily avg attendance: " +
    d.avgAttendance +
    ". Focus on retention, acquisition, and revenue. Each tip max 25 words.",

  workout_plan: (d) =>
    `You are a certified fitness trainer. Create a ${d.days}-day per week workout plan for a ${d.level} level person with goal: "${d.goal}". List each day with 4-5 exercises, sets and reps. Be specific and practical. Format clearly with day headings.`,

  diet_plan: (d) =>
    `You are a certified nutritionist. Create a full day Indian meal plan for someone with goal: "${d.goal}" and preference: "${d.preference}". Include Breakfast, Mid-Morning Snack, Lunch, Evening Snack, Dinner. For each meal list 2-3 specific food items with rough quantities. Keep it practical and achievable.`,

  progress_analysis: (d) =>
    `You are a fitness coach. A gym member's stats: current weight ${d.currentWeight}kg, starting weight ${d.startWeight}kg, current BMI ${d.currentBMI}, goal: "${d.goal}". They have been training for ${d.weeks} weeks. Give a 4-sentence progress analysis covering what's going well, what needs attention, and one specific next-step recommendation.`,

  trainer_workout_plan: (d) =>
    `You are a certified personal trainer. Create a ${d.days}-day per week workout plan for a client named ${d.clientName} with goal: "${d.goal}" and fitness level: "${d.level}". List each day with 4-5 exercises, sets and reps. Format clearly with day headings. Be specific and practical.`,

  client_assessment: (d) =>
    `You are a professional fitness coach. Write a formal client assessment for ${d.clientName}, age ${d.age}, weight ${d.weight}kg, height ${d.height}cm, goal: "${d.goal}", fitness level: "${d.level}". Cover: current fitness status, key strengths, areas to improve, and a 4-week action plan. Be professional and concise.`,

  session_planner: (d) =>
    `You are a gym trainer. Plan an optimal training session schedule for today. Clients: ${d.clients}. For each client give: focus area, recommended exercises (3-4), and session duration. Keep it practical and time-efficient.`,

  // ── Owner "money" features (single member — tiny, cheap prompts) ──────────
  winback: (d) =>
    `Write a short, warm WhatsApp message in Hinglish (Roman Hindi mixed with English) from a gym owner to win back a member who stopped coming. Member: ${d.memberName}. Not seen for ${d.daysSinceVisit} days. Plan: ${d.plan}.` +
    (d.goal ? ` Their goal was: ${d.goal}.` : "") +
    (d.offer ? ` Include this offer: ${d.offer}.` : " You may suggest one small comeback offer.") +
    ` Under 55 words, friendly, first person, 1-2 emojis. Output ONLY the message text.`,

  renewal_script: (d) =>
    `Help a gym owner make a warm renewal phone call. Give 3-4 short talking points as a bullet list, in Hinglish (Roman Hindi mixed with English). Member: ${d.memberName}. Plan: ${d.plan}. Expiring in ${d.daysLeft} days. Member for ${d.monthsActive} months.` +
    (d.goal ? ` Goal: ${d.goal}.` : "") +
    (d.progress ? ` Progress so far: ${d.progress}.` : "") +
    ` Reference their journey, keep it personal, end with a confident renewal ask. Each point one line. Output ONLY the bullet points.`,

  // ── "GymSetu se poochho" — conversational BI over a BOUNDED snapshot. ──────
  // The app pre-computes a small snapshot; we never send raw member lists, so
  // input tokens stay small regardless of gym size.
  ask_gym: (d) =>
    `You are the gym owner's business assistant. Answer using ONLY the data snapshot below — do not invent numbers. Answer in Hinglish (Roman Hindi mixed with English), short and direct, max 55 words, cite concrete numbers from the data. If the snapshot doesn't contain the answer, say so honestly in one line. Question: "${d.question}". Data snapshot (JSON): ${d.snapshot}`,
};

// Per-type output cap — keeps OpenAI cost low. Money features are single-member
// so they need very little; ask_gym a bit more; everything else the old default.
const MAX_TOKENS: Record<string, number> = {
  winback: 170,
  renewal_script: 240,
  ask_gym: 320,
  risk_alert: 60,
  risk_scan: 260,
};
const DEFAULT_MAX_TOKENS = 500;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const promptFn = prompts[type];
    if (!promptFn) {
      return new Response(
        JSON.stringify({ error: "Unknown type: " + type }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const prompt = promptFn(data);
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + openaiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: MAX_TOKENS[type] ?? DEFAULT_MAX_TOKENS,
        temperature: 0.7,
      }),
    });

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Empty response from OpenAI", raw: json }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
