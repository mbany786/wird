/**
 * Local-calendar date helpers.
 *
 * Dates in Wird are stored as `YYYY-MM-DD` strings in the user's local calendar.
 * Never derive them from `toISOString()` (UTC) — in the Americas that rolls over
 * to "tomorrow" in the evening, and in Asia it lags behind in the morning.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Format a Date as a local `YYYY-MM-DD` string. */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's date in the local calendar as `YYYY-MM-DD`. */
export function todayStr(): string {
  return toLocalDateStr(new Date());
}

/** Current month in the local calendar as `YYYY-MM`. */
export function currentMonthStr(): string {
  return todayStr().slice(0, 7);
}

/** Parse `YYYY-MM-DD` as a local-calendar Date (midnight local time). */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Add (or subtract) whole days to a `YYYY-MM-DD` string. */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}
