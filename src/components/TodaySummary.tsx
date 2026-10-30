import React, { useMemo } from 'react';
import { Habit, HabitLog, HabitSection } from '../types';
import { isDoneLog, weekKeyOf } from '../utils/cadence';
import { parseLocalDate } from '../utils/date';

interface TodaySummaryProps {
  habits: Habit[];
  sections: HabitSection[];
  logs: HabitLog[];
  date: string;
  isToday: boolean;
}

const shortTitle = (t: string) => t.replace(/\s*\(.*\)\s*$/, '').replace(/\s+-\s+[\d,/A-Za-z ]+$/, '').trim();

/** What's done today and what's left; tapping an item scrolls to it. */
export function dayProgress(habits: Habit[], sections: HabitSection[], logs: HabitLog[], date: string) {
  const isFriday = parseLocalDate(date).getDay() === 5;
  const wk = weekKeyOf(date);
  const order = new Map(sections.map((s, i) => [s.id, i]));
  const applicable = habits
    .filter(h => h.category !== 'NEGATIVE_ABSTINENCE')
    .filter(h => h.cadence !== 'FRIDAY_ONLY' || isFriday)
    .sort((a, b) => (order.get(a.sectionId) ?? 0) - (order.get(b.sectionId) ?? 0) || a.order - b.order);
  const done: Habit[] = [];
  const left: Habit[] = [];
  for (const h of applicable) {
    const isDone = h.cadence === 'WEEKLY_ONCE'
      ? logs.some(l => l.habitId === h.id && weekKeyOf(l.date) === wk && isDoneLog(h, l))
      : isDoneLog(h, logs.find(l => l.habitId === h.id && l.date === date));
    (isDone ? done : left).push(h);
  }
  return { done, left, total: applicable.length };
}

export const TodaySummary: React.FC<TodaySummaryProps> = ({ habits, sections, logs, date, isToday }) => {
  const { done, left, total } = useMemo(() => dayProgress(habits, sections, logs, date), [habits, sections, logs, date]);
  if (!total) return null;
  const pct = done.length / total;
  const R = 22, C = 2 * Math.PI * R;
  const allDone = left.length === 0;
  const shown = left.slice(0, 6);

  const jump = (id: string) => {
    const el = document.getElementById(`habit-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-emerald-500');
    setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500'), 1200);
  };

  return (
    <div className="flex items-start gap-3 pt-3 mt-3 border-t border-slate-800" data-testid="today-summary">
      <div className="relative w-14 h-14 shrink-0" role="img" aria-label={`${done.length} of ${total} done`}>
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90" aria-hidden>
          <circle cx="28" cy="28" r={R} fill="none" strokeWidth="6" className="stroke-slate-800" />
          <circle cx="28" cy="28" r={R} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-emerald-500"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset 300ms ease-out' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold tabular-nums">{Math.round(pct * 100)}%</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-slate-100" data-testid="today-count">
          {allDone ? (isToday ? 'All done for today' : 'All done') : `${done.length} of ${total} done`}
        </p>
        {!allDone && (
          <>
            <p className="text-[13px] text-slate-400 mt-0.5">{isToday ? 'Still to do today' : 'Not logged'}</p>
            <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Still to do">
              {shown.map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => jump(h.id)}
                  className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[13px] text-slate-200 hover:border-slate-600 max-w-[11rem] truncate"
                >
                  {shortTitle(h.title)}
                </button>
              ))}
              {left.length > shown.length && (
                <span className="h-8 px-2 flex items-center text-[13px] text-slate-500">+{left.length - shown.length} more</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
