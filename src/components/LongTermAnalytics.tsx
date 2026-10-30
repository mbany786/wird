import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Flame, CalendarRange, Moon } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { computeLongTerm, DayScore } from '../utils/longTerm';
import { getWeekStart } from '../utils/cadence';
import { parseLocalDate } from '../utils/date';

interface LongTermAnalyticsProps {
  habits: Habit[];
  logs: HabitLog[];       // all logs (any month)
  currentMonth: string;   // range ends here
}

const RANGES = [3, 6, 12] as const;
// Sequential ramp (emerald), light → dark, readable on the dark surface
const RAMP = ['#1e293b', '#064e3b', '#047857', '#10b981', '#6ee7b7'];
const cellColor = (pct: number | null) => (pct === null ? 'rgba(30,41,59,0.35)' : pct === 0 ? RAMP[0] : RAMP[Math.min(4, 1 + Math.floor(pct * 3.999))]);
const shortTitle = (t: string) => t.replace(/\s*\(.*\)\s*$/, '').replace(/\s+-\s+\d+$/, '').trim();

const Card: React.FC<{ title: string; Icon: typeof Flame; children: React.ReactNode; right?: React.ReactNode }> = ({ title, Icon, children, right }) => (
  <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-emerald-400" />
      <h3 className="text-[15px] font-semibold text-slate-100 flex-1">{title}</h3>
      {right}
    </div>
    {children}
  </section>
);

export const LongTermAnalytics: React.FC<LongTermAnalyticsProps> = ({ habits, logs, currentMonth }) => {
  // Start with the shortest range that covers the history
  const [range, setRange] = useState<number>(() => {
    const ids = new Set(habits.map(h => h.id));
    let first = '';
    for (const l of logs) if (ids.has(l.habitId) && (!first || l.date < first)) first = l.date;
    if (!first) return 3;
    const [y, m] = currentMonth.split('-').map(Number);
    const [fy, fm] = first.split('-').map(Number);
    const span = (y - fy) * 12 + (m - fm) + 1;
    return RANGES.find(r => r >= span) ?? 12;
  });
  const [picked, setPicked] = useState<DayScore | null>(null);
  const data = useMemo(() => computeLongTerm(habits, logs, currentMonth, range), [habits, logs, currentMonth, range]);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ left: scroller.current.scrollWidth }); }, [data]);

  // heatmap columns (weeks), rows ordered from the configured week start
  const ws = getWeekStart();
  const columns = useMemo(() => {
    const cols: (DayScore | null)[][] = [];
    if (!data.days.length) return cols;
    const lead = (parseLocalDate(data.days[0].date).getDay() - ws + 7) % 7;
    const cells: (DayScore | null)[] = [...Array(lead).fill(null), ...data.days];
    for (let i = 0; i < cells.length; i += 7) cols.push(cells.slice(i, i + 7));
    return cols;
  }, [data.days, ws]);
  const monthMarks = columns.map((c, i) => {
    const firstOfMonth = c.find(d => d && d.date.endsWith('-01'));
    return firstOfMonth ? { i, label: parseLocalDate(firstOfMonth.date).toLocaleDateString(undefined, { month: 'short' }) } : null;
  });

  const hasData = data.days.some(d => d.pct !== null);
  const maxBar = 1;

  const rangePicker = (
    <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5" role="radiogroup" aria-label="Time range">
      {RANGES.map(r => (
        <button key={r} type="button" role="radio" aria-checked={range === r} onClick={() => { setRange(r); setPicked(null); }}
          className={`h-8 px-2.5 rounded-lg text-[13px] font-semibold ${range === r ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
          {r === 12 ? '1 yr' : `${r} mo`}
        </button>
      ))}
    </div>
  );

  if (!hasData) {
    return (
      <Card title="Over time" Icon={CalendarRange} right={rangePicker}>
        <p className="text-[15px] text-slate-400">Log a few days and your trends across months will appear here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="long-term">
      {data.insights.length > 0 && (
        <Card title="Insights" Icon={Sparkles}>
          <ul className="space-y-2" aria-label="Insights">
            {data.insights.map((t, i) => (
              <li key={i} className="text-[15px] text-slate-200 leading-snug flex gap-2"><span className="text-emerald-400">•</span><span>{t}</span></li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Over time" Icon={CalendarRange} right={rangePicker}>
        {/* Month-over-month */}
        <div className="flex items-end gap-1.5 h-36" role="list" aria-label="Monthly completion">
          {data.months.map(m => (
            <div key={m.key} role="listitem" className="flex-1 min-w-0 flex flex-col items-center justify-end h-full" aria-label={`${m.label}: ${m.pct === null ? 'no entries' : Math.round(m.pct * 100) + '%'}`}>
              <span className="text-[11px] text-slate-300 tabular-nums mb-1">{m.pct === null ? '' : `${Math.round(m.pct * 100)}%`}</span>
              <div className="w-full max-w-[36px] rounded-t-md bg-emerald-500" style={{ height: `${m.pct === null ? 0 : Math.max(2, (m.pct / maxBar) * 100)}%`, opacity: m.key === currentMonth ? 1 : 0.7 }} />
              <span className="text-[11px] text-slate-400 mt-1">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Day heatmap */}
        <div className="mt-5">
          <div ref={scroller} className="overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            <div className="inline-block">
              <div className="flex gap-[3px] h-4 text-[11px] text-slate-500">
                {monthMarks.map((m, i) => <span key={i} className="w-3 shrink-0 overflow-visible whitespace-nowrap">{m?.label ?? ''}</span>)}
              </div>
              <div className="flex gap-[3px]" role="grid" aria-label="Daily completion">
                {columns.map((col, i) => (
                  <div key={i} className="flex flex-col gap-[3px]">
                    {Array.from({ length: 7 }).map((_, r) => {
                      const d = col[r];
                      if (!d) return <span key={r} className="w-3 h-3" />;
                      const label = d.pct === null ? d.date : `${d.date}: ${d.done} of ${d.total}`;
                      return (
                        <button key={r} type="button" aria-label={label} onClick={() => setPicked(d)}
                          className={`w-3 h-3 rounded-[3px] ${picked?.date === d.date ? 'ring-1 ring-white' : ''}`}
                          style={{ backgroundColor: cellColor(d.pct) }} />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 text-[12px] text-slate-400 min-h-[20px]">
            <span data-testid="heat-picked">
              {picked
                ? `${parseLocalDate(picked.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${picked.pct === null ? 'no entries' : `${picked.done} of ${picked.total} (${Math.round(picked.pct * 100)}%)`}`
                : 'Tap a day for details'}
            </span>
            <span className="flex items-center gap-1">Less {RAMP.map(c => <span key={c} className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: c }} />)} More</span>
          </div>
        </div>
      </Card>

      {data.prayers.length > 0 && (
        <Card title="Prayer quality" Icon={Moon}>
          <div className="space-y-2.5" aria-label="Prayer quality">
            {data.prayers.map(p => (
              <div key={p.key} className="flex items-center gap-3">
                <span className="w-16 text-[13px] text-slate-300 shrink-0">{p.label}</span>
                <div className="flex-1 h-4 rounded-md overflow-hidden flex bg-slate-800" role="img"
                  aria-label={`${p.label}: ${p.parts.map(x => `${x.label} ${x.count}`).join(', ')}, not logged ${p.notLogged}`}>
                  {p.parts.map(x => x.count > 0 && (
                    <span key={x.label} style={{ width: `${(x.count / p.days) * 100}%`, backgroundColor: x.color }} className="h-full border-r border-slate-900 last:border-r-0" />
                  ))}
                </div>
                <span className="w-10 text-right text-[12px] text-slate-400 tabular-nums">
                  {Math.round(((p.days - p.notLogged) / Math.max(1, p.days)) * 100)}%
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[12px] text-slate-400">
            {data.prayers[0].parts.map(x => (
              <span key={x.label} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: x.color }} />{x.label}</span>
            ))}
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-800" />Not logged</span>
          </div>
          <p className="text-[12px] text-slate-500 mt-2">Right column: share of days logged in this range.</p>
        </Card>
      )}

      {data.streaks.length > 0 && (
        <Card title="Streaks" Icon={Flame}>
          <ul className="divide-y divide-slate-800" aria-label="Streaks">
            {data.streaks.slice(0, 6).map(s => (
              <li key={s.habit.id} className="flex items-center justify-between gap-3 min-h-[44px]">
                <span className="text-[15px] text-slate-200 truncate">{shortTitle(s.habit.title)}</span>
                <span className="text-[13px] text-slate-400 tabular-nums shrink-0">
                  <span className={`font-semibold ${s.current ? 'text-amber-300' : 'text-slate-500'}`}>{s.current}</span> now · best {s.best} {s.unit}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
