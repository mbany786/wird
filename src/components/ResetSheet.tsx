import React, { useMemo, useState } from 'react';
import { CalendarX, CalendarRange, Trash2 } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { Sheet } from './Sheet';
import { weekKeyOf } from '../utils/cadence';
import { addDays, parseLocalDate } from '../utils/date';

export type ResetScope = 'day' | 'week' | 'all';

interface ResetSheetProps {
  date: string;              // the day being viewed
  templateName: string;
  habits: Habit[];           // this template's habits
  logs: HabitLog[];          // all entries
  onReset: (scope: ResetScope, toDelete: HabitLog[]) => void;
  onClose: () => void;
}

/** Entries of this template that a reset would remove. */
export function entriesFor(scope: ResetScope, date: string, habits: Habit[], logs: HabitLog[]): HabitLog[] {
  const ids = new Set(habits.map(h => h.id));
  const mine = logs.filter(l => ids.has(l.habitId));
  if (scope === 'all') return mine;
  if (scope === 'day') return mine.filter(l => l.date === date);
  const start = weekKeyOf(date);
  const end = addDays(start, 6);
  return mine.filter(l => l.date >= start && l.date <= end);
}

const fmt = (d: string, o: Intl.DateTimeFormatOptions) => parseLocalDate(d).toLocaleDateString(undefined, o);

export const ResetSheet: React.FC<ResetSheetProps> = ({ date, templateName, habits, logs, onReset, onClose }) => {
  const [confirmAll, setConfirmAll] = useState(false);
  const counts = useMemo(() => ({
    day: entriesFor('day', date, habits, logs),
    week: entriesFor('week', date, habits, logs),
    all: entriesFor('all', date, habits, logs)
  }), [date, habits, logs]);

  const weekStart = weekKeyOf(date);
  const weekLabel = `${fmt(weekStart, { month: 'short', day: 'numeric' })} – ${fmt(addDays(weekStart, 6), { month: 'short', day: 'numeric' })}`;
  const n = (k: number) => `${k} ${k === 1 ? 'entry' : 'entries'}`;

  const Option: React.FC<{ scope: ResetScope; Icon: typeof Trash2; title: string; detail: string; danger?: boolean }> = ({ scope, Icon, title, detail, danger }) => {
    const items = counts[scope];
    return (
      <button
        type="button"
        disabled={!items.length}
        onClick={() => (scope === 'all' && !confirmAll ? setConfirmAll(true) : onReset(scope, items))}
        aria-label={title}
        className={`w-full flex items-center gap-3 min-h-[64px] px-3 rounded-2xl border text-left disabled:opacity-40 ${
          danger ? 'border-rose-900/70 bg-rose-950/20' : 'border-slate-800 bg-slate-950/60'
        }`}
      >
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-rose-950 text-rose-300' : 'bg-slate-800 text-emerald-400'}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className={`block text-[15px] font-semibold ${danger ? 'text-rose-200' : 'text-slate-100'}`}>{title}</span>
          <span className="block text-[13px] text-slate-400">{detail} · {items.length ? n(items.length) : 'nothing logged'}</span>
        </span>
      </button>
    );
  };

  return (
    <Sheet title="Reset entries" subtitle={`${templateName} only. Other templates aren't touched.`} onClose={onClose}>
      <div className="space-y-2.5">
        <Option scope="day" Icon={CalendarX} title="Clear this day" detail={fmt(date, { weekday: 'long', month: 'short', day: 'numeric' })} />
        <Option scope="week" Icon={CalendarRange} title="Clear this week" detail={weekLabel} />
        <Option scope="all" Icon={Trash2} title="Clear all" detail="Every day, every month" danger />
      </div>
      {confirmAll && (
        <div role="alert" className="rounded-2xl border border-rose-800 bg-rose-950/40 p-4">
          <p className="text-[15px] text-rose-100">Clear all {n(counts.all.length)} in {templateName}?</p>
          <p className="text-[13px] text-rose-200/80 mt-1">You can undo right after. For a lasting copy, make a backup first in Settings → Backup & data.</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button type="button" onClick={() => setConfirmAll(false)} className="h-11 rounded-xl bg-slate-800 text-[15px] font-semibold">Cancel</button>
            <button type="button" onClick={() => onReset('all', counts.all)} className="h-11 rounded-xl bg-rose-600 text-white text-[15px] font-semibold">Clear all</button>
          </div>
        </div>
      )}
      <p className="text-[13px] text-slate-500">Habits and templates stay as they are; only logged entries are removed.</p>
    </Sheet>
  );
};
