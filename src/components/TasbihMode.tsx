import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Undo2, RotateCcw } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { haptic } from '../utils/haptics';
import { countLog, currentCount, isTasbihHabit } from '../utils/tasbih';

interface TasbihModeProps {
  habits: Habit[];
  /** Logs for `date` */
  logs: HabitLog[];
  date: string;
  initialHabitId?: string;
  onSave: (habitId: string, data: Partial<HabitLog>) => void;
  onClose: () => void;
}

const FREE = '__free__';
const CYCLES = [33, 100, 0] as const;

/** Full-screen tap counter. Every tap adds to the day's count for the chosen dhikr. */
export const TasbihMode: React.FC<TasbihModeProps> = ({ habits, logs, date, initialHabitId, onSave, onClose }) => {
  const eligible = useMemo(() => habits.filter(isTasbihHabit), [habits]);
  const [habitId, setHabitId] = useState<string>(initialHabitId ?? eligible[0]?.id ?? FREE);
  const habit = eligible.find(h => h.id === habitId);
  const startFor = useCallback(
    (id: string) => { const h = eligible.find(x => x.id === id); return h ? currentCount(h, logs.find(l => l.habitId === id)) : 0; },
    [eligible, logs]
  );

  const [base, setBase] = useState(() => startFor(habitId));
  const [session, setSession] = useState(0);
  const [cycle, setCycle] = useState<number>(() => (habit?.targetValue && habit.targetValue <= 100 ? 33 : 100));
  const [pulse, setPulse] = useState(0);
  const total = base + session;
  const target = habit?.targetValue || 0;

  // ---- persistence: debounce while tapping, flush on switch/close/background ----
  const pending = useRef<{ id: string; total: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const eligibleRef = useRef(eligible);
  eligibleRef.current = eligible;
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const p = pending.current;
    pending.current = null;
    if (!p) return;
    const h = eligibleRef.current.find(x => x.id === p.id);
    if (h) saveRef.current(h.id, { ...countLog(h, p.total), date });
  }, [date]);
  const queue = (t: number) => {
    if (!habit) return;
    pending.current = { id: habit.id, total: t };
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 600);
  };
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => { document.removeEventListener('visibilitychange', onHide); flush(); };
  }, [flush]);

  // keep the screen on while counting, where supported
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then(l => { lock = l; }).catch(() => {});
    return () => { lock?.release().catch(() => {}); };
  }, []);

  const count = () => {
    const next = session + 1;
    const t = base + next;
    setSession(next);
    setPulse(p => p + 1);
    queue(t);
    if (target && t === target) haptic.success();
    else if (cycle && next % cycle === 0) haptic.medium();
    else haptic.tap();
  };
  const undo = () => {
    if (session <= 0) return;
    const next = session - 1;
    setSession(next);
    queue(base + next);
    haptic.tap();
  };
  const resetSession = () => {
    if (!session) return;
    if (!confirm(`Remove the ${session} counted this session?`)) return;
    setSession(0);
    queue(base);
    haptic.warning();
  };
  const switchHabit = (id: string) => {
    flush();
    setHabitId(id);
    setBase(startFor(id));
    setSession(0);
    const h = eligible.find(x => x.id === id);
    setCycle(h?.targetValue && h.targetValue <= 100 ? 33 : 100);
  };
  const close = () => { flush(); onClose(); };

  // Esc closes on desktop; Space / Enter count
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if ((e.key === ' ' || e.key === 'Enter') && (e.target as HTMLElement)?.tagName !== 'SELECT') { e.preventDefault(); count(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const inRound = cycle ? session % cycle : session;
  const rounds = cycle ? Math.floor(session / cycle) : 0;
  const progress = target ? Math.min(1, total / target) : cycle ? inRound / cycle : 0;
  const R = 112, C = 2 * Math.PI * R;
  const reached = !!target && total >= target;

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950 text-slate-100 flex flex-col select-none" role="dialog" aria-modal="true" aria-label="Tasbih"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center gap-2 px-3 pt-2">
        <button type="button" onClick={close} aria-label="Close tasbih" className="w-11 h-11 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
        <select
          aria-label="Dhikr"
          value={habitId}
          onChange={e => switchHabit(e.target.value)}
          className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[15px] font-semibold truncate"
        >
          {eligible.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}
          <option value={FREE}>Free count (not saved)</option>
        </select>
        <select
          aria-label="Round size"
          value={cycle}
          onChange={e => setCycle(Number(e.target.value))}
          className="h-11 px-2 rounded-xl bg-slate-900 border border-slate-800 text-[15px] tabular-nums"
        >
          {CYCLES.map(c => <option key={c} value={c}>{c ? `${c} / round` : 'No rounds'}</option>)}
        </select>
      </div>

      {habit?.urduTitle && <p className="text-center text-[17px] text-emerald-300/90 font-arabic mt-3" dir="rtl">{habit.urduTitle}</p>}

      <button
        type="button"
        onClick={count}
        aria-label="Count"
        className="flex-1 flex flex-col items-center justify-center outline-none active:bg-slate-900/40 transition-colors"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="relative w-64 h-64 flex items-center justify-center">
          <svg viewBox="0 0 256 256" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="128" cy="128" r={R} fill="none" strokeWidth="10" className="stroke-slate-800" />
            <circle cx="128" cy="128" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
              className={reached ? 'stroke-amber-400' : 'stroke-emerald-500'}
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)} style={{ transition: 'stroke-dashoffset 120ms ease-out' }} />
          </svg>
          <span key={pulse} className="flex flex-col items-center animate-[tasbih-pop_140ms_ease-out]">
            <span className="text-[64px] leading-none font-bold tabular-nums" data-testid="tasbih-total">{total.toLocaleString()}</span>
            {target > 0 && <span className="text-[15px] text-slate-400 mt-2 tabular-nums">of {target.toLocaleString()}</span>}
          </span>
        </span>
        <span className="mt-6 text-[15px] text-slate-400 tabular-nums" data-testid="tasbih-session">
          {cycle ? <>Round {rounds + 1} · {inRound}/{cycle}</> : <>This session {session}</>}
          {cycle > 0 && session > 0 && <> · +{session} now</>}
        </span>
        {reached && <span className="mt-2 text-[15px] font-semibold text-amber-300">Target reached · keep going if you like</span>}
        {!habit && <span className="mt-2 text-[13px] text-slate-500">Free count isn't saved to your tracker.</span>}
        <span className="mt-8 text-[13px] text-slate-600">Tap anywhere to count</span>
      </button>

      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <button type="button" onClick={undo} disabled={!session} className="h-12 rounded-xl bg-slate-900 border border-slate-800 text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
          <Undo2 className="w-4 h-4" /> Undo one
        </button>
        <button type="button" onClick={resetSession} disabled={!session} className="h-12 rounded-xl bg-slate-900 border border-slate-800 text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
          <RotateCcw className="w-4 h-4" /> Reset session
        </button>
      </div>
    </div>
  );
};
