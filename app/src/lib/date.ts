/**
 * Local calendar dates.
 *
 * `new Date().toISOString().split('T')[0]` gives the **UTC** date, which is not
 * today's date in India for 5.5 hours out of every 24. Before 05:30 IST the UTC
 * date is still yesterday, so a 5 AM gym-goer — and Indian gyms open at 5 —
 * gets their attendance filed on the previous day, while the screen header
 * (built with toLocaleDateString) says today. The two disagree.
 *
 * It also breaks the one-check-in-per-day rule: someone arriving at 05:00 and
 * again at 07:00 IST straddles the UTC midnight, producing two rows for one
 * calendar day. unique (member_id, check_in_date) cannot catch that, because
 * the dates genuinely differ.
 *
 * Use these anywhere the question is "what day is it for this gym?".
 */

/** Today's date in the device's own timezone, as YYYY-MM-DD. */
export function todayLocal(): string {
  return toLocalDate(new Date());
}

/** A Date as YYYY-MM-DD in the device's own timezone (not UTC). */
export function toLocalDate(d: Date): string {
  // Shift by the offset so toISOString's UTC truncation lands on the local day.
  const shifted = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return shifted.toISOString().split('T')[0];
}

/** Current wall-clock time as HH:MM:SS in the device's own timezone. */
export function nowLocalTime(): string {
  return new Date().toTimeString().slice(0, 8);
}

/** N days from today (negative for past), as a local YYYY-MM-DD. */
export function localDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}
