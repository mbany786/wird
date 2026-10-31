import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Settings2, MapPin } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { computeDayTimes, findPrayerHabit, formatTime, nextPrayer, PrayerConfig, PrayerKey, PRAYER_LABEL, PRAYER_ORDER, untilLabel } from '../utils/prayerTimes';
import { todayStr } from '../utils/date';

interface PrayerTimesCardProps {
  config: PrayerConfig;
  dateStr: string;
  habits: Habit[];
  logs: HabitLog[]; // logs of this date
  onLogState: (habit: Habit, stateCode: string) => void;
  onOpenSettings: () => void;
}

/** Daily prayer times with one-tap logging from each time. */
export const PrayerTimesCard: React.FC<PrayerTimesCardProps> = ({ config, dateStr, habits, logs, onLogState, onOpenSettings }) => {
  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState<PrayerKey | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const times = useMemo(() => computeDayTimes(config, dateStr), [config, dateStr]);
  const isToday = dateStr === todayStr();
  const next = times && isToday ? nextPrayer(times, now) : null;
  const tz = config.location?.tz;

  if (!config.location || !times) {
    return (
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-slate-100">Prayer times</p>
          <p className="text-[13px] text-slate-400">Set your location to see today's times, calculated offline.</p>
        </div>
        <button type="button" onClick={onOpenSettings} className="h-11 px-4 rounded-xl bg-emerald-600 text-white text-[15px] font-semibold shrink-0">
          Set up
        </button>
      </div>
    );
  }

  const logFor = (h?: Habit) => (h ? logs.find(l => l.habitId === h.id) : undefined);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4" aria-label="Prayer times">
      <div className="flex items-center gap-2 mb-1 px-1">
        <MapPin className="w-4 h-4 text-emerald-400" />
        <span className="text-[13px] text-slate-400 truncate flex-1">{config.location.name}</span>
        <button type="button" onClick={onOpenSettings} className="w-10 h-10 -my-1 -mr-1 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800" aria-label="Prayer time settings">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      <ul className="divide-y divide-slate-800/70">
        {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map(k => {
          const isPrayer = k !== 'sunrise';
          const habit = isPrayer ? findPrayerHabit(habits, k as PrayerKey) : undefined;
          const log = logFor(habit);
          const state = habit?.multiStates?.find(s => s.code === log?.stateCode);
          const isNext = next === k;
          const passed = isToday && isPrayer && times[k].getTime() <= now.getTime();
          return (
            <li key={k}>
              <div className={`flex items-center gap-3 px-1 min-h-[48px] ${isNext ? 'text-emerald-300' : ''}`}>
                <span className={`w-20 text-[15px] ${isPrayer ? 'font-semibold' : 'text-slate-400'}`}>{PRAYER_LABEL[k]}</span>
                <span className="tabular-nums text-[15px] w-20" data-testid={`time-${k}`}>{formatTime(times[k], tz)}</span>
                {isNext && <span className="text-[13px] text-emerald-400/90">in {untilLabel(times[k], now)}</span>}
                <span className="flex-1" />
                {habit && (
                  <button
                    type="button"
                    onClick={() => setOpen(o => (o === k ? null : (k as PrayerKey)))}
                    aria-expanded={open === k}
                    aria-label={state ? `${PRAYER_LABEL[k]}: ${state.label.split(' (')[0]}. Change` : `Log ${PRAYER_LABEL[k]}`}
                    className={`h-9 min-w-[64px] px-3 rounded-xl text-[13px] font-semibold border ${
                      state ? 'border-slate-700 bg-slate-950' : passed ? 'border-amber-700/70 bg-amber-950/40 text-amber-200' : 'border-slate-800 bg-slate-950 text-slate-300'
                    }`}
                  >
                    {state ? <span style={{ color: state.color }} className="text-[15px]">{state.symbol}</span> : 'Log'}
                  </button>
                )}
              </div>
              {habit && open === k && habit.multiStates && (
                <div className="grid grid-cols-4 gap-1.5 pb-3 px-1">
                  {habit.multiStates.map(s => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => { onLogState(habit, s.code); setOpen(null); }}
                      className={`min-h-[48px] rounded-xl border text-[12px] font-medium flex flex-col items-center justify-center gap-0.5 ${
                        log?.stateCode === s.code ? 'border-emerald-500 bg-emerald-950/60' : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      <span style={{ color: s.color }} className="text-[15px] leading-none">{s.symbol}</span>
                      <span>{s.label.split(' (')[0].replace('Takbeer-e-Oola', 'Takbeer').replace('With Jamat', 'Jamat').replace('Qaza / Missed', 'Qaza').replace('Individually', 'Individual')}</span>
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-[13px] text-slate-400 px-1 pt-2 border-t border-slate-800/70">
        Tahajjud from {formatTime(times.tahajjud, tz)} · Ishraq {formatTime(times.ishraq, tz)} · Chasht {formatTime(times.chasht, tz)}
      </p>
    </section>
  );
};

export function templateHasPrayers(habits: Habit[]): boolean {
  return PRAYER_ORDER.some(k => !!findPrayerHabit(habits, k));
}
