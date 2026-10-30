import { Habit, HabitLog } from '../types';
import { isDoneLog, weekKeyOf } from './cadence';
import { addDays, parseLocalDate, todayStr } from './date';
import { findPrayerHabit, PrayerKey, PRAYER_LABEL, PRAYER_ORDER } from './prayerTimes';

/** Analytics across months: daily scores, monthly trend, streaks, prayer quality, insights. */

export interface DayScore { date: string; done: number; total: number; pct: number | null }

export interface LongTermData {
  start: string;              // first day considered (first entry, clipped to range)
  end: string;                // today or end of range
  days: DayScore[];           // every day in [rangeStart, rangeEnd]; pct null = outside data
  months: { key: string; label: string; pct: number | null; days: number }[];
  streaks: { habit: Habit; current: number; best: number; unit: string }[];
  prayers: { key: PrayerKey; label: string; habit: Habit; parts: { label: string; color: string; count: number }[]; notLogged: number; days: number }[];
  weekday: { day: number; pct: number | null }[];
  insights: string[];
}

const monthKeyOf = (d: string) => d.slice(0, 7);
const monthLabel = (key: string, opts: Intl.DateTimeFormatOptions = { month: 'short' }) =>
  parseLocalDate(`${key}-01`).toLocaleDateString(undefined, opts);
const shortTitle = (t: string) => t.replace(/\s*\(.*\)\s*$/, '').replace(/\s+-\s+\d+$/, '').trim();

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function computeLongTerm(habits: Habit[], logs: HabitLog[], endMonth: string, monthsBack: number, today = todayStr()): LongTermData {
  const ids = new Set(habits.map(h => h.id));
  const mine = logs.filter(l => ids.has(l.habitId));
  const byDate = new Map<string, Map<string, HabitLog>>();
  const weekDone = new Map<string, Set<string>>();
  const byId = new Map(habits.map(h => [h.id, h]));
  let first: string | null = null;
  for (const l of mine) {
    if (!byDate.has(l.date)) byDate.set(l.date, new Map());
    byDate.get(l.date)!.set(l.habitId, l);
    const h = byId.get(l.habitId)!;
    if (isDoneLog(h, l)) {
      if (!weekDone.has(h.id)) weekDone.set(h.id, new Set());
      weekDone.get(h.id)!.add(weekKeyOf(l.date));
    }
    if (!first || l.date < first) first = l.date;
  }

  const startMonth = shiftMonth(endMonth, -(monthsBack - 1));
  const rangeStart = `${startMonth}-01`;
  const [ey, em] = endMonth.split('-').map(Number);
  const rangeEnd = `${endMonth}-${String(new Date(ey, em, 0).getDate()).padStart(2, '0')}`;
  const end = rangeEnd < today ? rangeEnd : today;
  const start = first && first > rangeStart ? first : rangeStart;

  const positive = habits.filter(h => h.category !== 'NEGATIVE_ABSTINENCE');
  const isDone = (h: Habit, date: string) =>
    h.cadence === 'WEEKLY_ONCE' ? !!weekDone.get(h.id)?.has(weekKeyOf(date)) : isDoneLog(h, byDate.get(date)?.get(h.id));

  const score = (date: string): DayScore => {
    if (!first || date < start || date > end) return { date, done: 0, total: 0, pct: null };
    const friday = parseLocalDate(date).getDay() === 5;
    let done = 0, total = 0;
    for (const h of positive) {
      if (h.cadence === 'FRIDAY_ONLY' && !friday) continue;
      total++;
      if (isDone(h, date)) done++;
    }
    return { date, done, total, pct: total ? done / total : null };
  };

  const days: DayScore[] = [];
  for (let d = rangeStart; d <= rangeEnd; d = addDays(d, 1)) days.push(score(d));

  // months
  const months: LongTermData['months'] = [];
  for (let i = 0; i < monthsBack; i++) {
    const key = shiftMonth(startMonth, i);
    const ds = days.filter(d => d.pct !== null && monthKeyOf(d.date) === key);
    months.push({ key, label: monthLabel(key), days: ds.length, pct: ds.length ? ds.reduce((a, d) => a + (d.pct ?? 0), 0) / ds.length : null });
  }

  // weekday consistency
  const weekday = [0, 1, 2, 3, 4, 5, 6].map(day => {
    const ds = days.filter(d => d.pct !== null && parseLocalDate(d.date).getDay() === day);
    return { day, pct: ds.length ? ds.reduce((a, d) => a + (d.pct ?? 0), 0) / ds.length : null };
  });

  // streaks over all history up to today (not just the range)
  const streaks = positive.map(h => {
    let current = 0, best = 0, run = 0;
    if (!first) return { habit: h, current: 0, best: 0, unit: 'days' };
    if (h.cadence === 'WEEKLY_ONCE') {
      const done = weekDone.get(h.id) ?? new Set<string>();
      const weeks: string[] = [];
      for (let d = weekKeyOf(first); d <= today; d = addDays(d, 7)) weeks.push(d);
      for (const w of weeks) { run = done.has(w) ? run + 1 : 0; best = Math.max(best, run); }
      const thisWeek = weekKeyOf(today);
      let i = weeks.length - 1;
      if (weeks[i] === thisWeek && !done.has(thisWeek)) i--; // this week isn't over yet
      for (; i >= 0 && done.has(weeks[i]); i--) current++;
      return { habit: h, current, best, unit: 'weeks' };
    }
    const step = h.cadence === 'FRIDAY_ONLY' ? 7 : 1;
    let d = first;
    if (step === 7) while (parseLocalDate(d).getDay() !== 5) d = addDays(d, 1);
    const seq: string[] = [];
    for (; d <= today; d = addDays(d, step)) seq.push(d);
    for (const x of seq) { run = isDone(h, x) ? run + 1 : 0; best = Math.max(best, run); }
    let i = seq.length - 1;
    if (seq[i] === today && !isDone(h, today)) i--; // today isn't over yet
    for (; i >= 0 && isDone(h, seq[i]); i--) current++;
    return { habit: h, current, best, unit: step === 7 ? 'Fridays' : 'days' };
  }).filter(s => s.best > 0).sort((a, b) => b.current - a.current || b.best - a.best);

  // prayer quality
  const inRange = days.filter(d => d.pct !== null).map(d => d.date);
  const prayers: LongTermData['prayers'] = [];
  for (const key of PRAYER_ORDER) {
    const h = findPrayerHabit(habits, key);
    if (!h?.multiStates?.length) continue;
    const counts = new Map<string, number>();
    let notLogged = 0;
    for (const date of inRange) {
      const code = byDate.get(date)?.get(h.id)?.stateCode;
      if (code) counts.set(code, (counts.get(code) ?? 0) + 1); else notLogged++;
    }
    prayers.push({
      key, label: PRAYER_LABEL[key], habit: h, notLogged, days: inRange.length,
      parts: h.multiStates.map(s => ({ label: s.label.replace(/\s*\(.*\)\s*$/, ''), color: s.color, count: counts.get(s.code) ?? 0 }))
    });
  }

  const data: LongTermData = { start, end, days, months, streaks, prayers, weekday, insights: [] };
  data.insights = buildInsights(data, byDate, today);
  return data;
}

const pctText = (p: number) => `${Math.round(p * 100)}%`;
const DAY_NAMES = (d: number) => new Date(2024, 0, 7 + d).toLocaleDateString(undefined, { weekday: 'long' });

function buildInsights(d: LongTermData, byDate: Map<string, Map<string, HabitLog>>, today: string): string[] {
  const out: string[] = [];
  const withData = d.months.filter(m => m.pct !== null && m.days >= 5);
  if (withData.length >= 2) {
    const last = withData[withData.length - 1], prev = withData[withData.length - 2];
    const diff = Math.round(((last.pct ?? 0) - (prev.pct ?? 0)) * 100);
    if (Math.abs(diff) >= 3) {
      out.push(`${monthLabel(last.key, { month: 'long' })} is ${diff > 0 ? 'up' : 'down'} ${Math.abs(diff)} points on ${monthLabel(prev.key, { month: 'long' })} (${pctText(last.pct!)} vs ${pctText(prev.pct!)}).`);
    } else {
      out.push(`${monthLabel(last.key, { month: 'long' })} is holding steady with ${monthLabel(prev.key, { month: 'long' })} at about ${pctText(last.pct!)}.`);
    }
    const best = withData.reduce((a, b) => ((b.pct ?? 0) > (a.pct ?? 0) ? b : a));
    if (withData.length >= 3 && best.key !== last.key) out.push(`Your strongest month was ${monthLabel(best.key, { month: 'long', year: 'numeric' })} at ${pctText(best.pct!)}.`);
  }
  const wd = d.weekday.filter(w => w.pct !== null);
  if (wd.length === 7) {
    const hi = wd.reduce((a, b) => ((b.pct ?? 0) > (a.pct ?? 0) ? b : a));
    const lo = wd.reduce((a, b) => ((b.pct ?? 0) < (a.pct ?? 0) ? b : a));
    if ((hi.pct ?? 0) - (lo.pct ?? 0) >= 0.08) out.push(`${DAY_NAMES(hi.day)}s are your most consistent day (${pctText(hi.pct!)}); ${DAY_NAMES(lo.day)}s are the hardest (${pctText(lo.pct!)}).`);
  }
  const s = d.streaks[0];
  if (s && s.current >= 3) {
    out.push(s.current >= s.best
      ? `${shortTitle(s.habit.title)}: ${s.current} ${s.unit} in a row, your longest yet.`
      : `${shortTitle(s.habit.title)}: ${s.current} ${s.unit} in a row (best ${s.best}).`);
  }
  // prayer in congregation trend: last 30 days vs the 30 before
  const p = d.prayers.find(x => x.key === 'fajr') ?? d.prayers[0];
  if (p) {
    const good = new Set((p.habit.multiStates ?? []).filter(m => m.scoreWeight >= 0.75).map(m => m.code));
    const rate = (from: string, to: string) => {
      let n = 0, g = 0;
      for (let x = from; x <= to; x = addDays(x, 1)) { const c = byDate.get(x)?.get(p.habit.id)?.stateCode; if (c) { n++; if (good.has(c)) g++; } }
      return n >= 5 ? g / n : null;
    };
    const a = rate(addDays(today, -29), today), b = rate(addDays(today, -59), addDays(today, -30));
    if (a !== null && b !== null && Math.abs(a - b) >= 0.05) {
      out.push(`${p.label} in congregation ${a > b ? 'rose' : 'fell'} from ${pctText(b)} to ${pctText(a)} over the last 30 days.`);
    }
  }
  return out.slice(0, 4);
}
