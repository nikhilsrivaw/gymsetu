import { supabase } from './supabase';

// ── Valid AI action types ──────────────────────────────────────
export type AIActionType =
  | 'dashboard_insights'
  | 'growth_tips'
  | 'risk_scan'
  | 'renewal_message'
  | 'plan_recommender'
  | 'announcement'
  | 'social_post'
  | 'promo_campaign'
  | 'monthly_report'
  | 'revenue_summary'
  | 'workout_plan'
  | 'diet_plan'
  | 'progress_analysis'
  | 'trainer_workout_plan'
  | 'client_assessment'
  | 'session_planner';

// ── Retry helper ──────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delayMs = 1000,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise(res => setTimeout(res, delayMs));
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

// ── User-friendly error messages ──────────────────────────────
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('timeout') || msg.includes('abort'))
    return 'AI request timed out. Please try again.';
  if (msg.includes('NetworkError') || msg.includes('fetch'))
    return 'No internet connection. Please check your network.';
  if (msg.includes('rate') || msg.includes('429'))
    return 'Too many requests. Please wait a moment and try again.';
  if (msg.includes('Function error'))
    return 'AI service is temporarily unavailable. Please try again.';
  return 'Could not generate AI response. Please try again.';
}

// ── Main AI call (free — no token cost) ───────────────────────
export async function askAI(
  type: AIActionType,
  data: Record<string, any>,
): Promise<string> {
  if (!type) throw new Error('AI action type is required');
  if (!data || typeof data !== 'object') throw new Error('AI data payload is required');

  try {
    const result = await withRetry(async () => {
      const { data: res, error } = await supabase.functions.invoke('ai-assistant', {
        body: { type, data },
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      if (!res?.text || typeof res.text !== 'string' || res.text.trim() === '') {
        throw new Error('AI returned an empty response');
      }

      return res.text as string;
    }, 1, 1000);

    return result;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}
