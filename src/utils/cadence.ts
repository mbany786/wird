import { Habit, HabitLog } from '../types';
import { parseLocalDate, toLocalDateStr } from './date';

/**
 * Cadence helpers: how many "chances" a habit has in a month and which of them were met.
 *
 * - DAILY        → every day of the month
 * - FRIDAY_ONLY  → each Friday of the month (4 or 5)
 * - WEEKLY_ONCE  → each week that overlaps the month; one completed day covers the whole week
 */

/** 0 = Sunday … 6 = Saturday. Weeks start on Monday unless the user changes it in Settings. */
let weekStartsOn = 1;
export function setWeekStart(day: number) {
  weekStartsOn = ((day % 7) + 7) % 7;
}
export function getWeekStart(): number {
  return weekStartsOn;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function daysInMonthOf(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/** First day (YYYY-MM-DD) of the week containing `dateStr`. */
export function weekKeyOf(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toLocalDateStr(d);
}

export interface MonthWeek {
  key: string;      // first day of the (full) week, may fall in the previous month
  days: number[];   // day numbers of this month inside the week
}

/** Weeks overlapping the month, each with the month's days that fall inside it. */
export function weeksInMonth(monthKey: string): MonthWeek[] {
  const n = daysInMonthOf(monthKey);
  const weeks: MonthWeek[] = [];
  for (let d = 1; d <= n; d++) {
    const key = weekKeyOf(`${monthKey}-${pad(d)}`);
    const last = weeks[weeks.length - 1];
    if (last && last.key === key) last.days.push(d);
    else weeks.push({ key, days: [d] });
  }
  return weeks;
}

export function fridaysInMonth(monthKey: string): number[] {
  const [y, m] = monthKey.split('-').map(Number);
  const out: number[] = [];
  for (let d = 1; d <= daysInMonthOf(monthKey); d++) if (new Date(y, m - 1, d).getDay() === 5) out.push(d);
  return out;
}

/** Number of chances a habit has in this month (days, Fridays or weeks). */
export function possibleInMonth(habit: Habit, monthKey: string): number {
  if (habit.cadence === 'FRIDAY_ONLY') return fridaysInMonth(monthKey).length;
  if (habit.cadence === 'WEEKLY_ONCE') return weeksInMonth(monthKey).length;
  return daysInMonthOf(monthKey);
}

export function cadenceUnit(habit: Habit, count = 2): string {
  if (habit.cadence === 'FRIDAY_ONLY') return count === 1 ? 'Friday' : 'Fridays';
  if (habit.cadence === 'WEEKLY_ONCE') return count === 1 ? 'week' : 'weeks';
  return count === 1 ? 'day' : 'days';
}

/** A log that counts as "done" for completion purposes. */
export function isDoneLog(habit: Habit, log?: HabitLog): boolean {
  if (!log || log.status === 'SKIPPED') return false;
  if (log.status === 'COMPLETED') return true;
  return Boolean(log.numericValue && log.numericValue >= (habit.targetValue || 1));
}

/** For weekly habits: week keys (in this month) that already have a completed day. */
export function completedWeekKeys(habit: Habit, logsForMonth: HabitLog[]): Set<string> {
  const keys = new Set<string>();
  for (const l of logsForMonth) if (isDoneLog(habit, l)) keys.add(weekKeyOf(l.date));
  return keys;
}
