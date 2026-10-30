import { describe, expect, test } from 'bun:test';
import { computeLongTerm, shiftMonth } from '../../src/utils/longTerm';
import { Habit, HabitLog } from '../../src/types';
import { addDays } from '../../src/utils/date';
import { setWeekStart } from '../../src/utils/cadence';

setWeekStart(1);
const states = [
  { code: 'TAKBEER_OOLA', symbol: '✓', label: 'Takbeer-e-Oola', scoreWeight: 1, color: '#10b981', bgClass: '' },
  { code: 'JAMAT', symbol: '•', label: 'With Jamat', scoreWeight: 0.85, color: '#3b82f6', bgClass: '' },
  { code: 'INDIVIDUAL', symbol: '••', label: 'Individually', scoreWeight: 0.6, color: '#f59e0b', bgClass: '' },
  { code: 'QAZA', symbol: '✗', label: 'Qaza', scoreWeight: 0, color: '#ef4444', bgClass: '' }
];
const base = { category: 'POSITIVE' as const, cadence: 'DAILY' as const, sectionId: 's', order: 0 };
const fajr: Habit = { ...base, id: 'fajr', title: 'Fajr', inputType: 'MULTI_STATE', multiStates: states };
const read: Habit = { ...base, id: 'read', title: 'Read', inputType: 'BOOLEAN', order: 1 };
const mulk: Habit = { ...base, id: 'mulk', title: 'Surah Mulk', inputType: 'BOOLEAN', cadence: 'WEEKLY_ONCE', order: 2 };
const kahf: Habit = { ...base, id: 'kahf', title: 'Kahf', inputType: 'BOOLEAN', cadence: 'FRIDAY_ONLY', order: 3 };
const habits = [fajr, read, mulk, kahf];
const done = (habitId: string, date: string, extra: Partial<HabitLog> = {}): HabitLog => ({ habitId, date, status: 'COMPLETED', numericValue: 1, timestamp: 0, ...extra });

describe('long-term analytics', () => {
  test('shiftMonth crosses years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-10', -11)).toBe('2025-11');
  });

  test('daily scores, months, streaks', () => {
    const today = '2026-10-30'; // Friday
    const logs: HabitLog[] = [];
    // read every day for the last 10 days, but not today
    for (let i = 1; i <= 10; i++) logs.push(done('read', addDays(today, -i)));
    // an older run of 15 days in September
    for (let i = 0; i < 15; i++) logs.push(done('read', addDays('2026-09-01', i)));
    // Fajr in Jamat on 20 days
    for (let i = 1; i <= 20; i++) logs.push(done('fajr', addDays(today, -i), { stateCode: i % 2 ? 'JAMAT' : 'QAZA', status: i % 2 ? 'COMPLETED' : 'FAILED', numericValue: 0 }));
    // Mulk once a week for 3 weeks (not this week)
    logs.push(done('mulk', '2026-10-21'), done('mulk', '2026-10-14'), done('mulk', '2026-10-07'));
    const d = computeLongTerm(habits, logs, '2026-10', 3, today);

    expect(d.months.map(m => m.key)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(d.months[0].pct).toBeNull(); // before the first entry
    expect(d.start).toBe('2026-09-01');

    const yesterday = d.days.find(x => x.date === '2026-10-29')!;
    // Thursday: fajr (QAZA? i=1 → JAMAT done), read done, mulk week not done, kahf not applicable
    expect(yesterday.total).toBe(3);
    expect(yesterday.done).toBe(2);
    const friday = d.days.find(x => x.date === '2026-10-23')!;
    expect(friday.total).toBe(4); // Kahf counts on Fridays
    expect(d.days.find(x => x.date === '2026-10-31')!.pct).toBeNull(); // future

    const read10 = d.streaks.find(s => s.habit.id === 'read')!;
    expect(read10.current).toBe(10); // today not done yet doesn't break the streak
    expect(read10.best).toBe(15);
    const mulkS = d.streaks.find(s => s.habit.id === 'mulk')!;
    expect(mulkS.unit).toBe('weeks');
    expect(mulkS.current).toBe(3); // this week still open
    const f = d.prayers.find(p => p.key === 'fajr')!;
    expect(f.parts.find(p => p.label === 'With Jamat')!.count).toBe(10);
    expect(f.parts.find(p => p.label === 'Qaza')!.count).toBe(10);
    expect(d.insights.length).toBeGreaterThan(0);
  });

  test('no entries → nothing to show', () => {
    const d = computeLongTerm(habits, [], '2026-10', 6, '2026-10-30');
    expect(d.days.every(x => x.pct === null)).toBe(true);
    expect(d.streaks).toEqual([]);
  });
});
