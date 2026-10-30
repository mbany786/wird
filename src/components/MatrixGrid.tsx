import { isTasbihHabit } from '../utils/tasbih';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { todayStr } from '../utils/date';
import { shortExtraAmount, formatExtraAmount, allowsCustomAmount } from '../utils/amount';
import { completedWeekKeys, weekKeyOf, weeksInMonth } from '../utils/cadence';
import { AmountEntry } from './AmountEntry';
import { Habit, HabitSection, HabitLog, TrackerTemplate } from '../types';
import { calculateMonthSummary } from '../utils/analytics';
import { getHijriDate } from '../utils/hijri';
import { 
  PlusCircle, 
  HelpCircle, 
  Trash2, 
  X, 
  AlertTriangle, 
  Sparkles, 
  HeartPulse, 
  Activity,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Check,
  ExternalLink,
  ShieldCheck,
  Pencil,
  CircleDot
} from 'lucide-react';
import { analyzeMenstrualCycle } from '../utils/cycleEngine';

interface MatrixGridProps {
  template: TrackerTemplate;
  habits: Habit[];
  sections: HabitSection[];
  logs: HabitLog[];
  currentMonth: string; // YYYY-MM
  onCellClick: (habit: Habit, date: string, dayNumber: number) => void;
  onUpdateLog?: (habitId: string, logData: Partial<HabitLog>) => void;
  monthlyRemarks: string;
  onRemarksChange: (val: string) => void;
  onAddCustomHabit: (sectionId: string) => void;
  onRemoveHabit?: (habitId: string) => void;
  onEditHabit?: (habit: Habit) => void;
  onOpenTasbih?: (habit: Habit, date: string) => void;
  showHijri?: boolean;
  hijriOffset?: number;
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  template,
  habits,
  sections,
  logs,
  currentMonth,
  onCellClick,
  onUpdateLog,
  monthlyRemarks,
  onRemarksChange,
  onAddCustomHabit,
  onRemoveHabit,
  onEditHabit,
  onOpenTasbih,
  showHijri = false,
  hijriOffset = 0
}) => {
  const isSpiritualTemplate = template.id === 'daily_spiritual_schedule';
  const isHealthTemplate = template.id === 'complete_health_fitness';
  const isDeepWorkTemplate = template.id === 'deep_work_digital_detox';
  const isReadingTemplate = template.id === 'multi_book_reading_tracker';
  const isBabyTemplate = template.id === 'baby_child_routine_tracker';
  const isCycleTemplate = template.id === 'cycle_health_tracker';
  const isBlankTemplate = template.id === 'blank_custom_tracker' || template.id.startsWith('custom_tracker_');

  const [taskToDelete, setTaskToDelete] = useState<Habit | null>(null);
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [selectedCell, setSelectedCell] = useState<{
    habit: Habit;
    day: number;
    date: string;
  } | null>(null);
  // Active edit day defaults to today when viewing the current month, otherwise day 1
  const defaultActiveDay = (monthKey: string) => {
    const today = todayStr();
    return today.startsWith(monthKey) ? Number(today.slice(8, 10)) : 1;
  };
  const [activeDay, setActiveDay] = useState<number>(() => defaultActiveDay(currentMonth));
  useEffect(() => {
    setActiveDay(defaultActiveDay(currentMonth));
    setSelectedCell(null);
  }, [currentMonth]);


  // Compute target date for cycle analysis (defaults to today's date or mid-month)
  const today = useMemo(() => todayStr(), []);
  const cycleTargetDate = useMemo(() => {
    if (today.startsWith(currentMonth)) {
      return today;
    }
    return `${currentMonth}-15`;
  }, [currentMonth, today]);

  const cycleAnalysis = useMemo(() => {
    if (!isCycleTemplate) return null;
    return analyzeMenstrualCycle(logs, cycleTargetDate, cycleLength);
  }, [isCycleTemplate, logs, cycleTargetDate, cycleLength]);

  // Determine number of days in selected month
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  // Ensure activeDay stays within valid range for month
  const safeActiveDay = Math.min(Math.max(1, activeDay), daysInMonth);
  const activeDateStr = `${currentMonth}-${String(safeActiveDay).padStart(2, '0')}`;
  const todayDayInMonth = today.startsWith(currentMonth) ? Number(today.slice(8, 10)) : 0;
  const isViewingToday = todayDayInMonth === safeActiveDay;
  const activeDayLabel = useMemo(() => {
    const d = new Date(year, month - 1, safeActiveDay);
    const label = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    return isViewingToday ? `Today · ${d.getDate()}` : label;
  }, [year, month, safeActiveDay, isViewingToday]);

  // One-time usage hint (remembered per device)
  const [showHint, setShowHint] = useState<boolean>(() => {
    try { return localStorage.getItem('wird.matrixHintSeen') !== '1'; } catch { return true; }
  });
  const dismissHint = () => {
    setShowHint(false);
    try { localStorage.setItem('wird.matrixHintSeen', '1'); } catch { /* storage unavailable */ }
  };

  // Keep the active day column in view inside the horizontally scrolling matrix
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const th = el.querySelector<HTMLElement>(`[data-day="${safeActiveDay}"]`);
    const sticky = el.querySelector<HTMLElement>('[data-sticky-col]');
    if (!th) return;
    const stickyW = sticky?.offsetWidth ?? 0;
    const left = th.offsetLeft - stickyW - 2 * th.offsetWidth;
    el.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
  }, [safeActiveDay, currentMonth]);

  const handleQuickUpdate = (logData: Partial<HabitLog>) => {
    if (!selectedCell || !onUpdateLog) return;
    onUpdateLog(selectedCell.habit.id, {
      ...logData,
      date: selectedCell.date
    });
  };

  const handleSelectDay = (targetDay: number) => {
    if (targetDay < 1 || targetDay > daysInMonth) return;
    setActiveDay(targetDay);
    if (!selectedCell) return;
    const nextDate = `${currentMonth}-${String(targetDay).padStart(2, '0')}`;
    setSelectedCell({
      habit: selectedCell.habit,
      day: targetDay,
      date: nextDate
    });
  };

  // Determine which days are Fridays in this month
  const fridayDays = useMemo(() => {
    const fridays: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month - 1, d);
      if (dt.getDay() === 5) { // 5 = Friday
        fridays.push(d);
      }
    }
    return fridays;
  }, [year, month, daysInMonth]);

  // Fast log map: `habitId:date` -> HabitLog
  const logMap = useMemo(() => {
    const map = new Map<string, HabitLog>();
    for (const log of logs) {
      map.set(`${log.habitId}:${log.date}`, log);
    }
    return map;
  }, [logs]);

  // Derived active log for currently selected cell
  const activeLog = selectedCell ? logMap.get(`${selectedCell.habit.id}:${selectedCell.date}`) : undefined;

  // Adjust monthly completed days count directly for BOOLEAN / SLOT habits
  const handleAdjustBooleanCount = (habit: Habit, delta: 1 | -1) => {
    if (!onUpdateLog) return;
    const candidateDays = habit.cadence === 'FRIDAY_ONLY' ? fridayDays : daysArray;
    if (delta === 1 && habit.cadence === 'WEEKLY_ONCE') {
      // One completed day per week: the active day if its week is open, else the next open week
      const doneWeeks = completedWeekKeys(habit, logs.filter(l => l.habitId === habit.id));
      const pick = !doneWeeks.has(weekKeyOf(activeDateStr))
        ? safeActiveDay
        : weeksInMonth(currentMonth).find(w => !doneWeeks.has(w.key))?.days[0];
      if (pick === undefined) return;
      const dStr = `${currentMonth}-${String(pick).padStart(2, '0')}`;
      onUpdateLog(habit.id, { status: 'COMPLETED', numericValue: 1, date: dStr });
      setActiveDay(pick);
      setSelectedCell({ habit, day: pick, date: dStr });
      return;
    }
    if (delta === 1) {
      const activeValid = habit.cadence !== 'FRIDAY_ONLY' || fridayDays.includes(safeActiveDay);
      const activeEntry = logMap.get(`${habit.id}:${activeDateStr}`);
      if (activeValid && activeEntry?.status !== 'COMPLETED') {
        onUpdateLog(habit.id, { status: 'COMPLETED', numericValue: 1, date: activeDateStr });
        setSelectedCell({ habit, day: safeActiveDay, date: activeDateStr });
        return;
      }
      for (const d of candidateDays) {
        const dStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
        const l = logMap.get(`${habit.id}:${dStr}`);
        if (l?.status !== 'COMPLETED') {
          onUpdateLog(habit.id, { status: 'COMPLETED', numericValue: 1, date: dStr });
          setActiveDay(d);
          setSelectedCell({ habit, day: d, date: dStr });
          return;
        }
      }
    } else {
      const activeEntry = logMap.get(`${habit.id}:${activeDateStr}`);
      if (activeEntry?.status === 'COMPLETED') {
        onUpdateLog(habit.id, { status: 'FAILED', numericValue: 0, date: activeDateStr });
        setSelectedCell({ habit, day: safeActiveDay, date: activeDateStr });
        return;
      }
      for (let i = candidateDays.length - 1; i >= 0; i--) {
        const d = candidateDays[i];
        const dStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
        const l = logMap.get(`${habit.id}:${dStr}`);
        if (l?.status === 'COMPLETED') {
          onUpdateLog(habit.id, { status: 'FAILED', numericValue: 0, date: dStr });
          setActiveDay(d);
          setSelectedCell({ habit, day: d, date: dStr });
          return;
        }
      }
    }
  };

  // Adjust multi-state count or set state on activeDay
  const handleAdjustMultiStateCount = (habit: Habit, stateCode: string, delta: 1 | -1) => {
    if (!onUpdateLog || !habit.multiStates) return;
    const stateObj = habit.multiStates.find(s => s.code === stateCode);
    if (!stateObj) return;

    if (delta === 1) {
      // Prefer the active edit day (today by default) when it has no entry yet
      const activeEntryFirst = logMap.get(`${habit.id}:${activeDateStr}`);
      if (!activeEntryFirst || !activeEntryFirst.stateCode || activeEntryFirst.status === 'SKIPPED') {
        onUpdateLog(habit.id, {
          status: stateObj.scoreWeight > 0 ? 'COMPLETED' : 'FAILED',
          stateCode: stateObj.code,
          numericValue: stateObj.scoreWeight,
          date: activeDateStr
        });
        setSelectedCell({ habit, day: safeActiveDay, date: activeDateStr });
        return;
      }
      // Otherwise look for an unlogged day in the month so adding +1 increases that state's count without overwriting another state
      for (const d of daysArray) {
        const dStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
        const l = logMap.get(`${habit.id}:${dStr}`);
        if (!l || !l.stateCode || l.status === 'SKIPPED') {
          onUpdateLog(habit.id, {
            status: stateObj.scoreWeight > 0 ? 'COMPLETED' : 'FAILED',
            stateCode: stateObj.code,
            numericValue: stateObj.scoreWeight,
            date: dStr
          });
          setActiveDay(d);
          setSelectedCell({ habit, day: d, date: dStr });
          return;
        }
      }
      // If all days are logged, update activeDay if different, else first day with different state
      const activeEntry = logMap.get(`${habit.id}:${activeDateStr}`);
      if (activeEntry?.stateCode !== stateCode) {
        onUpdateLog(habit.id, {
          status: stateObj.scoreWeight > 0 ? 'COMPLETED' : 'FAILED',
          stateCode: stateObj.code,
          numericValue: stateObj.scoreWeight,
          date: activeDateStr
        });
        setSelectedCell({ habit, day: safeActiveDay, date: activeDateStr });
        return;
      }
      for (const d of daysArray) {
        const dStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
        const l = logMap.get(`${habit.id}:${dStr}`);
        if (l?.stateCode !== stateCode) {
          onUpdateLog(habit.id, {
            status: stateObj.scoreWeight > 0 ? 'COMPLETED' : 'FAILED',
            stateCode: stateObj.code,
            numericValue: stateObj.scoreWeight,
            date: dStr
          });
          setActiveDay(d);
          setSelectedCell({ habit, day: d, date: dStr });
          return;
        }
      }
    } else {
      for (let i = daysArray.length - 1; i >= 0; i--) {
        const d = daysArray[i];
        const dStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
        const l = logMap.get(`${habit.id}:${dStr}`);
        if (l?.stateCode === stateCode) {
          onUpdateLog(habit.id, {
            status: 'SKIPPED',
            stateCode: undefined,
            numericValue: 0,
            date: dStr
          });
          setActiveDay(d);
          setSelectedCell({ habit, day: d, date: dStr });
          return;
        }
      }
    }
  };

  // Inline stepper for numeric / quantity / duration / lataif / negative habits on activeDay
  const handleInlineQuantityEdit = (habit: Habit, deltaSteps: number, explicitValue?: number) => {
    if (!onUpdateLog) return;
    const dStr = activeDateStr;
    const currentEntry = logMap.get(`${habit.id}:${dStr}`);
    const currentVal = currentEntry?.numericValue || 0;

    setSelectedCell({ habit, day: safeActiveDay, date: dStr });

    if (habit.category === 'NEGATIVE_ABSTINENCE') {
      const next = explicitValue !== undefined ? Math.max(0, explicitValue) : Math.max(0, currentVal + deltaSteps);
      onUpdateLog(habit.id, {
        status: next === 0 ? 'COMPLETED' : 'FAILED',
        numericValue: next,
        date: dStr
      });
      return;
    }

    if (habit.inputType === 'LATAIF') {
      const isMin = currentEntry?.unitUsed === 'min';
      const stepSize = isMin ? 5 : 500;
      const target = isMin ? 30 : 5000;
      const next = explicitValue !== undefined ? Math.max(0, explicitValue) : Math.max(0, currentVal + deltaSteps * stepSize);
      onUpdateLog(habit.id, {
        status: next >= target ? 'COMPLETED' : (next > 0 ? 'PARTIAL' : 'FAILED'),
        numericValue: next,
        unitUsed: isMin ? 'min' : 'count',
        date: dStr
      });
      return;
    }

    const stepSize = habit.inputType === 'DURATION' ? (habit.step || 5) : (habit.step || 1);
    const target = habit.targetValue || (habit.inputType === 'DURATION' ? 20 : 1);
    const next = explicitValue !== undefined ? Math.max(0, explicitValue) : Math.max(0, currentVal + deltaSteps * stepSize);
    onUpdateLog(habit.id, {
      status: next >= target ? 'COMPLETED' : (next > 0 ? 'PARTIAL' : 'FAILED'),
      numericValue: next,
      date: dStr
    });
  };

  // Short monthly summary shown under each task on iPhone
  const mobileSummaryLabel = (habit: Habit, summary: ReturnType<typeof calculateMonthSummary>) => {
    const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
    if (habit.category === 'NEGATIVE_ABSTINENCE') return `${fmt(summary.totalVolume)} ${habit.unit || 'slips'}`;
    if (habit.inputType === 'QUANTITY' || habit.inputType === 'LATAIF') return `Σ ${fmt(summary.totalVolume)}`;
    if (habit.inputType === 'DURATION') return `${fmt(summary.totalVolume)}m`;
    return `${summary.periodsDone}/${summary.possible}${habit.cadence === 'WEEKLY_ONCE' ? ' wk' : ''}`;
  };

  // Group habits by section
  const sectionHabitsMap = useMemo(() => {
    const map = new Map<string, Habit[]>();
    for (const s of sections) {
      map.set(s.id, []);
    }
    for (const h of habits) {
      const list = map.get(h.sectionId);
      if (list) list.push(h);
      else {
        const first = sections[0]?.id;
        if (first) {
          const l = map.get(first) || [];
          l.push(h);
          map.set(first, l);
        }
      }
    }
    return map;
  }, [sections, habits]);

  // Render cell content: core symbol/value plus any custom count/minutes underneath
  const renderCellContent = (habit: Habit, day: number) => {
    const log = logMap.get(`${habit.id}:${currentMonth}-${String(day).padStart(2, '0')}`);
    const extra = allowsCustomAmount(habit, sections) ? shortExtraAmount(log) : undefined;
    const core = renderCellCore(habit, day);
    if (!extra) return core;
    return (
      <span className="flex flex-col items-center leading-none" title={formatExtraAmount(log)}>
        {log?.status === 'SKIPPED' && !log.stateCode ? null : core}
        <span className="text-[11px] font-semibold text-slate-300 tabular-nums mt-0.5">{extra}</span>
      </span>
    );
  };

  const renderCellCore = (habit: Habit, day: number) => {
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    const log = logMap.get(`${habit.id}:${dateStr}`);
    const isFriday = fridayDays.includes(day);

    if (habit.cadence === 'FRIDAY_ONLY' && !isFriday) {
      return <span className="text-slate-700/40 select-none text-[11px]">•</span>;
    }

    if (!log) {
      return (
        <span className="w-full h-full flex items-center justify-center text-slate-700 hover:text-slate-400 text-[15px]">
          ·
        </span>
      );
    }

    if (log.status === 'SKIPPED') {
      return <span className="text-[15px] text-slate-600" title="Cleared / skipped">–</span>;
    }

    // 0. Negative Habits (Inverse Tracking: 0 incidents = Clean Day)
    if (habit.category === 'NEGATIVE_ABSTINENCE') {
      const incidents = log.numericValue ?? (log.status === 'FAILED' ? 1 : 0);
      if (incidents > 0 || log.status === 'FAILED') {
        const isDuration = habit.inputType === 'DURATION';
        return (
          <span 
            className="px-1 py-0.5 rounded text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800 shadow-sm"
            title={`${incidents} ${habit.unit || (isDuration ? 'min' : 'incident(s)')} recorded`}
          >
            !{incidents}{isDuration ? 'm' : ''}
          </span>
        );
      } else {
        return (
          <span 
            className="text-[11px] font-bold text-emerald-400"
            title="Clean Day (0 Incidents - Abstinence intact)"
          >
            ✓
          </span>
        );
      }
    }

    // 1. Multi-State / Prayer / Slot
    if ((habit.inputType === 'MULTI_STATE' || habit.inputType === 'SLOT') && habit.multiStates) {
      const state = habit.multiStates.find(s => s.code === log.stateCode);
      if (state) {
        return (
          <span 
            className="w-6 h-6 flex items-center justify-center rounded text-[15px] font-bold"
            style={{ color: state.color }}
            title={state.label}
          >
            {state.symbol}
          </span>
        );
      }
    }

    // 2. Quantity (Pages / Counts / ML / Papers / Quotes)
    if (habit.inputType === 'QUANTITY') {
      const val = log.numericValue ?? 0;
      if (val === 0) return <span className="text-slate-700">·</span>;
      const displayVal = val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val;
      return (
        <span className="text-[11px] font-bold text-emerald-400 tabular-nums tracking-tight">
          {displayVal}
        </span>
      );
    }

    // 2b. Lataif Dual Tracking (Count or Min)
    if (habit.inputType === 'LATAIF') {
      const val = log.numericValue ?? 0;
      if (val === 0) return <span className="text-slate-700">·</span>;
      if (log.unitUsed === 'min') {
        const equivCount = Math.round((val * 5000) / 30);
        return (
          <span 
            className="text-[11px] font-bold text-sky-400 tabular-nums tracking-tight"
            title={`${val} min ≈ ${equivCount.toLocaleString()} count`}
          >
            {val}m
          </span>
        );
      } else {
        const equivMin = Math.round((val * 30) / 5000);
        const displayVal = val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val;
        return (
          <span 
            className="text-[11px] font-bold text-emerald-400 tabular-nums tracking-tight"
            title={`${val.toLocaleString()} count ≈ ${equivMin} min`}
          >
            {displayVal}
          </span>
        );
      }
    }

    // 3. Duration (Minutes)
    if (habit.inputType === 'DURATION') {
      const mins = log.numericValue ?? 0;
      if (mins === 0) return <span className="text-slate-700">·</span>;
      return (
        <span className="text-[11px] font-bold text-sky-400 tabular-nums">
          {mins}m
        </span>
      );
    }

    // 4. Boolean Checkbox
    if (log.status === 'COMPLETED') {
      return <span className="text-emerald-400 font-bold text-[15px]">✓</span>;
    } else if (log.status === 'FAILED') {
      return <span className="text-rose-400 font-bold text-[15px]">✗</span>;
    }

    return <span className="text-slate-700">·</span>;
  };

  return (
    <div className={`space-y-6 ${selectedCell ? 'pb-[380px] sm:pb-56' : 'pb-4 sm:pb-12'}`}>
      {/* Blank / Custom Template Welcoming Banner */}
      {isBlankTemplate && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-sky-950/60 border border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-700/80 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Custom Tracker Canvas</h3>
                <span className="text-[11px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full tabular-nums border border-emerald-700">
                  Fully Editable
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize tasks, create new sections, define quantitative units (pages, minutes, reps), or use the routine generator to build a routine in seconds.
              </p>
            </div>
          </div>

          <button
            onClick={() => onAddCustomHabit(sections[0]?.id || '')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customize & Generate Tasks</span>
          </button>
        </div>
      )}

      {/* Intelligent Cycle Intelligence & Phase Guidance Banner */}
      {isCycleTemplate && cycleAnalysis && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          {/* Header Row: Stage Badge, Day Counter, Countdown & Cycle Length */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${cycleAnalysis.phaseInfo.bgClass} border ${cycleAnalysis.phaseInfo.borderClass} ${cycleAnalysis.phaseInfo.textClass} shadow-lg`}>
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-400">Biological Stage</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${cycleAnalysis.phaseInfo.bgClass} ${cycleAnalysis.phaseInfo.textClass} ${cycleAnalysis.phaseInfo.borderClass}`}>
                    {cycleAnalysis.phaseInfo.phaseName}
                  </span>
                  {cycleAnalysis.phaseInfo.isPmsWindow && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      PMS Active
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                  Cycle Day {cycleAnalysis.currentCycleDay} of {cycleAnalysis.totalCycleLength} • <span className={cycleAnalysis.phaseInfo.textClass}>{cycleAnalysis.phaseInfo.subPhase}</span>
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-400">Next Period in: </span>
                <span className="text-rose-400 font-bold">~{cycleAnalysis.daysUntilNextPeriod} days</span>
                <span className="text-slate-500 text-[11px] ml-1">({cycleAnalysis.nextPeriodEstimatedDate})</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-1 rounded-xl text-xs">
                <span className="text-slate-400 text-[11px] pl-1">Avg Cycle:</span>
                <button
                  type="button"
                  onClick={() => setCycleLength(Math.max(21, cycleLength - 1))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs"
                  title="Decrease average cycle length"
                >-</button>
                <span className="font-bold text-slate-200 tabular-nums px-1">{cycleLength}d</span>
                <button
                  type="button"
                  onClick={() => setCycleLength(Math.min(38, cycleLength + 1))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs"
                  title="Increase average cycle length"
                >+</button>
              </div>
            </div>
          </div>

          {/* Segmented Cycle Progression Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
              <span className="text-rose-400 font-semibold">Menstrual (Days 1–5)</span>
              <span className="text-emerald-400 font-semibold">Follicular (Days 6–13)</span>
              <span className="text-amber-400 font-semibold">Ovulation (Days 14–16)</span>
              <span className="text-purple-400 font-semibold">Luteal (Days 17–{cycleLength})</span>
            </div>

            <div className="relative w-full h-3 bg-slate-950 rounded-full border border-slate-800 flex overflow-hidden">
              <div style={{ width: `${(5 / cycleLength) * 100}%` }} className="bg-rose-500/80 h-full border-r border-rose-700" title="Menstrual: Days 1-5" />
              <div style={{ width: `${(8 / cycleLength) * 100}%` }} className="bg-emerald-500/80 h-full border-r border-emerald-700" title="Follicular: Days 6-13" />
              <div style={{ width: `${(3 / cycleLength) * 100}%` }} className="bg-amber-500/80 h-full border-r border-amber-700" title="Ovulatory: Days 14-16" />
              <div style={{ width: `${((cycleLength - 16) / cycleLength) * 100}%` }} className="bg-purple-500/80 h-full" title={`Luteal: Days 17-${cycleLength}`} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums px-1">
              <span>Day 1</span>
              <span className="text-white font-bold bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                Today is Cycle Day {cycleAnalysis.currentCycleDay}
              </span>
              <span>Day {cycleLength}</span>
            </div>
          </div>

          {/* 3 Actionable Cards: Mood State, Things to Watch Out For, Cycle-Synced Advice */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* 1. Expected Mood & Emotional Mindset */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Predicted Mood & Mindset</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {cycleAnalysis.phaseInfo.moodSummary}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-3 mt-2 border-t border-slate-800/80">
                {cycleAnalysis.phaseInfo.moodTraits.map((trait, i) => (
                  <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-medium">
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. Things to Watch Out For (Biological Vulnerabilities) */}
            <div className="bg-slate-950 border border-rose-900/40 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Things to Watch Out For</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 leading-snug">
                  {cycleAnalysis.phaseInfo.thingsToWatchOutFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Hormones: </span>
                {cycleAnalysis.phaseInfo.hormoneProfile}
              </div>
            </div>

            {/* 3. Cycle-Synced Daily Action Advice */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Cycle-Synced Care & Advice</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider">Nutrition: </span>
                    <p className="text-slate-300 text-[11px] leading-snug mt-0.5">{cycleAnalysis.phaseInfo.nutritionAdvice}</p>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase font-bold text-sky-400 tracking-wider">Movement: </span>
                    <p className="text-slate-300 text-[11px] leading-snug mt-0.5">{cycleAnalysis.phaseInfo.movementAdvice}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span className="font-semibold text-purple-300">Best For: </span>
                {cycleAnalysis.phaseInfo.productivityTip}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Matrix Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Matrix Quick-Edit Active Day Bar */}
        <div className="bg-slate-950/95 border-b border-slate-800 px-3 sm:px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-slate-400">Editing</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-emerald-700/60 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => handleSelectDay(safeActiveDay - 1)}
                disabled={safeActiveDay <= 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-200 transition"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1.5 min-w-[96px] text-center text-[15px] font-semibold text-emerald-300 tabular-nums">
                {activeDayLabel}
              </span>
              <button
                type="button"
                onClick={() => handleSelectDay(safeActiveDay + 1)}
                disabled={safeActiveDay >= daysInMonth}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-200 transition"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {!isViewingToday && todayDayInMonth ? (
              <button
                type="button"
                onClick={() => handleSelectDay(todayDayInMonth)}
                className="text-[13px] font-semibold text-emerald-400 px-2 min-h-[36px]"
              >
                Today
              </button>
            ) : (
              <span className="w-[52px]" aria-hidden />
            )}
          </div>
          {showHint && (
            <div className="mt-2 flex items-start justify-between gap-2 text-[13px] text-slate-400">
              <span>Tap a task to log counts for this day, or tap any day cell to change it.</span>
              <button
                type="button"
                onClick={dismissHint}
                className="shrink-0 text-emerald-400 font-semibold min-h-[28px]"
              >
                Got it
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto" ref={scrollRef}>
          <table className="w-full text-left border-collapse min-w-[980px]">
            {/* Table Header: Day Numbers 1 to 31 + Optional Hijri */}
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-300 text-xs">
                {/* Pinned Habit Name & Inline Counter Column */}
                <th data-sticky-col className="sticky left-0 z-20 bg-slate-950 px-3 sm:px-4 py-2 w-[132px] min-w-[132px] max-w-[132px] sm:w-[250px] sm:min-w-[250px] sm:max-w-none border-r border-slate-800 shadow-[2px_0_8px_rgba(0,0,0,0.4)]">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="font-semibold text-slate-400 text-[13px]">Tasks</span>
                    {isSpiritualTemplate && template.urduTitle && (
                      <span className="hidden sm:inline text-[13px] text-emerald-400 font-normal font-arabic" dir="rtl">({template.urduTitle})</span>
                    )}
                  </div>
                </th>

                {/* Days 1 to 31 */}
                {daysArray.map(d => {
                  const isFriday = fridayDays.includes(d);
                  const isActiveDayCol = d === safeActiveDay;
                  const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
                  const hijriInfo = (isSpiritualTemplate && showHijri) ? getHijriDate(dateStr, hijriOffset) : null;

                  return (
                    <th
                      key={d}
                      data-day={d}
                      onClick={() => handleSelectDay(d)}
                      className={`text-center py-1.5 px-0.5 w-10 min-w-[40px] font-semibold border-r border-slate-800/60 cursor-pointer select-none transition ${
                        isActiveDayCol
                          ? 'bg-emerald-900/60 text-emerald-200 ring-1 ring-inset ring-emerald-400 font-bold'
                          : isFriday 
                            ? 'bg-emerald-950/70 text-emerald-300 font-bold hover:bg-emerald-900/50' 
                            : 'text-slate-400 hover:bg-slate-800/60'
                      }`}
                      title={
                        hijriInfo 
                          ? `Day ${d} (${hijriInfo.formatted}) — Tap to set active edit day` 
                          : `Day ${d} — Tap to set active edit day`
                      }
                    >
                      <div className="text-[13px] font-semibold tabular-nums">{d}</div>
                      {hijriInfo && (
                        <div className="text-[11px] text-emerald-400/80 font-medium tabular-nums leading-tight">
                          {hijriInfo.day}
                        </div>
                      )}
                      {isFriday && (
                        <div className="hidden sm:block text-[11px] text-emerald-400 font-normal leading-tight">
                          Fri
                        </div>
                      )}
                    </th>
                  );
                })}

                {/* Summary Header (Sticky only on XL desktop so mobile shows Day 1..31 columns clearly) */}
                <th className="xl:sticky xl:right-0 z-20 bg-slate-950 px-3 py-3 min-w-[155px] text-center font-bold tracking-wide uppercase text-slate-400 border-l border-slate-800">
                  Summary
                </th>
              </tr>
            </thead>

            {/* Table Body: Sections and Rows */}
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sections.map(section => {
                const sectionHabits = sectionHabitsMap.get(section.id) || [];
                return (
                  <React.Fragment key={section.id}>
                    {/* Section Header Row */}
                    <tr className="bg-slate-950/80 text-slate-200">
                      <td
                        colSpan={daysInMonth + 2}
                        className="p-0 bg-slate-950/90 border-y border-slate-800"
                      >
                        <div className="sticky left-0 w-[calc(100vw-34px)] max-w-[520px] pl-3 pr-1 sm:px-4 py-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-2 min-w-0">
                            <span className="font-semibold text-[13px] text-emerald-400 truncate">{section.title}</span>
                            {isSpiritualTemplate && section.urduTitle && (
                              <span className="text-[13px] font-normal text-emerald-300/70 font-arabic shrink-0" dir="rtl">
                                {section.urduTitle}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => onAddCustomHabit(section.id)}
                            className="flex items-center justify-center gap-1 min-w-[36px] h-9 sm:h-8 text-[13px] font-medium text-slate-400 hover:text-emerald-300 sm:bg-slate-800 hover:bg-slate-800 sm:px-2.5 rounded-lg sm:border border-slate-700 transition shrink-0"
                            aria-label={`Add task to ${section.title}`}
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Task</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Section Habits Rows */}
                    {sectionHabits.map(habit => {
                      const habitLogsForMonth = logs.filter(l => l.habitId === habit.id);
                      const summary = calculateMonthSummary(habit, habitLogsForMonth, daysInMonth, currentMonth);
                      const doneWeeks = habit.cadence === 'WEEKLY_ONCE' ? completedWeekKeys(habit, habitLogsForMonth) : null;
                      const activeDayLog = logMap.get(`${habit.id}:${activeDateStr}`);
                      const isHabitSelected = selectedCell?.habit.id === habit.id;

                      return (
                        <tr key={habit.id} className={`group transition-colors ${isHabitSelected ? 'bg-emerald-950/20' : 'hover:bg-slate-800/40'}`}>
                          {/* Habit Title & Inline Count Editor Column (Sticky Left) */}
                          <td className="sticky left-0 z-10 bg-slate-900 px-3 sm:px-3.5 py-2 w-[132px] min-w-[132px] max-w-[132px] sm:w-[250px] sm:min-w-[250px] sm:max-w-none border-r border-slate-800 font-medium text-slate-200 shadow-[2px_0_8px_rgba(0,0,0,0.35)]">
                            <div className="flex flex-col gap-1.5">
                              {/* Top Line: Habit Title + Delete Icon */}
                              <div className="flex items-start justify-between gap-1">
                                <div 
                                  onClick={() => setSelectedCell({ habit, day: safeActiveDay, date: activeDateStr })}
                                  className="cursor-pointer hover:text-emerald-300 transition flex-1 select-none min-w-0"
                                  title="Tap to open quick count editor"
                                >
                                  <span className="text-slate-100 font-semibold group-hover:text-emerald-300 transition text-[15px] leading-tight block truncate">
                                    {habit.title}
                                  </span>
                                  <div className="flex items-baseline justify-between gap-1.5 mt-0.5">
                                    {isSpiritualTemplate && habit.urduTitle ? (
                                      <span className="text-[13px] text-emerald-400/80 font-normal font-arabic leading-snug truncate" dir="rtl">
                                        {habit.urduTitle}
                                      </span>
                                    ) : <span />}
                                    {/* iPhone: one compact monthly summary instead of inline steppers */}
                                    <span className="sm:hidden text-[13px] text-slate-400 tabular-nums shrink-0">
                                      {mobileSummaryLabel(habit, summary)}
                                    </span>
                                  </div>
                                </div>

                                {/* Direct Trash Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTaskToDelete(habit);
                                  }}
                                  className="hidden sm:block sm:opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition shrink-0"
                                  title={`Remove ${habit.title}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Bottom Line: Interactive Inline Count Stepper (iPad / desktop) */}
                              <div className="hidden sm:flex items-center justify-between gap-1 pt-0.5">
                                {/* A. NEGATIVE ABSTINENCE Inline Stepper */}
                                {habit.category === 'NEGATIVE_ABSTINENCE' ? (
                                  <div className="flex items-center gap-1 w-full justify-between">
                                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-1 py-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleInlineQuantityEdit(habit, -1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95"
                                        title="Decrease slips"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className={`text-[11px] tabular-nums font-bold px-1 ${
                                        (activeDayLog?.numericValue || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                                      }`}>
                                        {activeDayLog?.numericValue || 0} {habit.unit || 'slips'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleInlineQuantityEdit(habit, 1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/70 active:scale-95"
                                        title="Record +1 slip"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="text-[11px] tabular-nums text-slate-400">
                                      Σ{summary.totalVolume}
                                    </span>
                                  </div>
                                ) : habit.inputType === 'MULTI_STATE' && habit.multiStates ? (
                                  /* B. MULTI_STATE Inline Interactive Pills (e.g. Prayers) */
                                  <div className="flex items-center gap-1 flex-wrap w-full">
                                    {habit.multiStates.map(st => {
                                      const count = summary.multiStateCounts?.[st.code] ?? 0;
                                      const isCurrentDayState = activeDayLog?.stateCode === st.code;
                                      return (
                                        <button
                                          key={st.code}
                                          type="button"
                                          onClick={() => handleAdjustMultiStateCount(habit, st.code, 1)}
                                          className={`px-1.5 py-0.5 rounded text-[11px] tabular-nums font-bold border transition active:scale-95 flex items-center gap-0.5 ${
                                            isCurrentDayState
                                              ? 'bg-emerald-950/90 border-emerald-400 ring-1 ring-emerald-400/50'
                                              : 'bg-slate-950 border-slate-800 hover:bg-slate-800'
                                          }`}
                                          style={{ color: st.color }}
                                          title={`Tap to log ${st.label} (Day ${safeActiveDay})`}
                                        >
                                          <span>{st.symbol}</span>
                                          <span>{count}</span>
                                        </button>
                                      );
                                    })}
                                    {activeDayLog?.stateCode && (
                                      <button
                                        type="button"
                                        onClick={() => handleAdjustMultiStateCount(habit, activeDayLog.stateCode!, -1)}
                                        className="w-4 h-4 flex items-center justify-center rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-[11px]"
                                        title={`Clear Day ${safeActiveDay}`}
                                      >
                                        −
                                      </button>
                                    )}
                                  </div>
                                ) : (habit.inputType === 'QUANTITY' || habit.inputType === 'DURATION' || habit.inputType === 'LATAIF') ? (
                                  /* C. QUANTITY / DURATION / LATAIF Inline Count Editor */
                                  <div className="flex items-center justify-between gap-1 w-full">
                                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-1 py-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleInlineQuantityEdit(habit, -1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95"
                                        title={`Decrease Day ${safeActiveDay} count`}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        value={activeDayLog?.numericValue ?? 0}
                                        onChange={(e) => {
                                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                                          handleInlineQuantityEdit(habit, 0, val);
                                        }}
                                        className="w-11 bg-transparent text-center tabular-nums font-bold text-[11px] text-emerald-400 focus:outline-none"
                                        title={`Day ${safeActiveDay} count`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleInlineQuantityEdit(habit, 1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 active:scale-95"
                                        title={`Increase Day ${safeActiveDay} count`}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="text-[11px] tabular-nums text-slate-400 truncate" title="Monthly Total">
                                      Σ{summary.totalVolume >= 1000 ? `${(summary.totalVolume / 1000).toFixed(1)}k` : summary.totalVolume}
                                    </span>
                                  </div>
                                ) : (
                                  /* D. BOOLEAN / SLOT Inline Count Stepper (e.g. 15 / 31) */
                                  <div className="flex items-center justify-between gap-1 w-full">
                                    <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-1 py-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleAdjustBooleanCount(habit, -1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95"
                                        title="Decrease completed count"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="text-[11px] tabular-nums font-bold text-emerald-400 px-1">
                                        {summary.periodsDone}
                                        <span className="text-slate-500 font-normal">/{summary.possible}{habit.cadence === 'WEEKLY_ONCE' ? ' wk' : ''}</span>
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleAdjustBooleanCount(habit, 1)}
                                        className="w-5 h-5 flex items-center justify-center rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 active:scale-95"
                                        title="Increase completed count"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <span className="text-[11px] tabular-nums text-slate-400">
                                      {summary.completionRate}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Days 1 to 31 Cells */}
                          {daysArray.map(d => {
                            const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
                            const isFriday = fridayDays.includes(d);
                            const isSelected = selectedCell?.habit.id === habit.id && selectedCell?.day === d;
                            const isActiveDayCol = d === safeActiveDay;
                            const cellLog = logMap.get(`${habit.id}:${dateStr}`);

                            return (
                              <td
                                key={d}
                                onClick={() => {
                                  setActiveDay(d);
                                  if (onUpdateLog) {
                                    if (habit.inputType === 'BOOLEAN') {
                                      const newStatus = cellLog?.status === 'COMPLETED' ? 'FAILED' : 'COMPLETED';
                                      onUpdateLog(habit.id, {
                                        status: newStatus,
                                        numericValue: newStatus === 'COMPLETED' ? 1 : 0,
                                        date: dateStr
                                      });
                                      setSelectedCell({ habit, day: d, date: dateStr });
                                      return;
                                    }

                                    if ((habit.inputType === 'MULTI_STATE' || habit.inputType === 'SLOT') && habit.multiStates && habit.multiStates.length > 0) {
                                      const currentIdx = habit.multiStates.findIndex(s => s.code === cellLog?.stateCode);
                                      const nextState = habit.multiStates[(currentIdx + 1) % habit.multiStates.length];
                                      onUpdateLog(habit.id, {
                                        status: nextState.scoreWeight > 0 ? 'COMPLETED' : 'FAILED',
                                        stateCode: nextState.code,
                                        numericValue: nextState.scoreWeight,
                                        date: dateStr
                                      });
                                      setSelectedCell({ habit, day: d, date: dateStr });
                                      return;
                                    }

                                    // If already selected, clicking again acts as quick increment
                                    if (isSelected) {
                                      if (habit.inputType === 'QUANTITY') {
                                        const current = cellLog?.numericValue || 0;
                                        const next = current + (habit.step || 1);
                                        onUpdateLog(habit.id, {
                                          status: next >= (habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                                          numericValue: next,
                                          date: dateStr
                                        });
                                        return;
                                      } else if (habit.inputType === 'LATAIF') {
                                        const current = cellLog?.numericValue || 0;
                                        const next = current + 500;
                                        onUpdateLog(habit.id, {
                                          status: next >= 5000 ? 'COMPLETED' : 'PARTIAL',
                                          numericValue: next,
                                          unitUsed: cellLog?.unitUsed || 'count',
                                          date: dateStr
                                        });
                                        return;
                                      } else if (habit.inputType === 'DURATION') {
                                        const current = cellLog?.numericValue || 0;
                                        const next = current + 5;
                                        onUpdateLog(habit.id, {
                                          status: next >= (habit.targetValue || 20) ? 'COMPLETED' : 'PARTIAL',
                                          numericValue: next,
                                          date: dateStr
                                        });
                                        return;
                                      }
                                    }

                                    // Open quick count dock
                                    setSelectedCell({ habit, day: d, date: dateStr });
                                  } else {
                                    onCellClick(habit, dateStr, d);
                                  }
                                }}
                                onDoubleClick={() => onCellClick(habit, dateStr, d)}
                                className={`text-center p-0.5 border-r border-slate-800/50 cursor-pointer select-none transition-all relative ${
                                  isSelected 
                                    ? 'ring-2 ring-emerald-400 bg-emerald-950/90 z-20 font-bold scale-105 shadow-md shadow-emerald-950' 
                                    : isActiveDayCol
                                      ? 'bg-emerald-950/25 hover:bg-emerald-900/40'
                                      : isFriday 
                                        ? 'bg-emerald-950/15 hover:bg-emerald-900/35' 
                                        : 'hover:bg-slate-800/70'
                                }`}
                                title={`Day ${d}: Tap to edit count`}
                              >
                                <div className="w-full min-h-[28px] flex items-center justify-center">
                                  {!cellLog && doneWeeks?.has(weekKeyOf(dateStr)) ? (
                                    <span className="text-[13px] text-emerald-700" title="Done this week">✓</span>
                                  ) : (
                                    renderCellContent(habit, d)
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* Summary Column (Interactive + Sticky only on XL screens) */}
                          <td 
                            onClick={() => setSelectedCell({ habit, day: safeActiveDay, date: activeDateStr })}
                            className="xl:sticky xl:right-0 z-10 bg-slate-900 px-2.5 py-1.5 border-l border-slate-800 text-center tabular-nums cursor-pointer hover:bg-slate-800/70 transition"
                            title="Tap to edit counts"
                          >
                            {/* 0. Negative Habits (Inverse Tracking: 0 incidents = 100% Clean) */}
                            {habit.category === 'NEGATIVE_ABSTINENCE' ? (
                              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleInlineQuantityEdit(habit, -1); }}
                                  className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                                >
                                  −
                                </button>
                                {summary.totalVolume === 0 ? (
                                  <div>
                                    <span className="text-emerald-400 font-bold">100% Clean</span>
                                    <span className="text-[11px] text-emerald-400/80 font-normal block">0 incidents</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-rose-400 font-bold">
                                      {summary.totalVolume} {habit.unit || 'slips'}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-normal block">
                                      {summary.completionRate}% clean
                                    </span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleInlineQuantityEdit(habit, 1); }}
                                  className="w-5 h-5 flex items-center justify-center rounded bg-rose-950 hover:bg-rose-900 text-rose-300"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <>
                                {/* 1. Multi-State Summary */}
                                {habit.inputType === 'MULTI_STATE' && summary.multiStateCounts && (
                                  <div className="flex items-center justify-center gap-1 text-[11px]">
                                    {habit.multiStates?.map(st => (
                                      <button
                                        key={st.code}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAdjustMultiStateCount(habit, st.code, 1);
                                        }}
                                        className="px-1 py-0.5 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 font-bold"
                                        style={{ color: st.color }}
                                        title={`Tap to add ${st.label}`}
                                      >
                                        {st.symbol}{summary.multiStateCounts?.[st.code] ?? 0}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {/* 2. Quantity Volume Summary */}
                                {habit.inputType === 'QUANTITY' && (
                                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-200">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleInlineQuantityEdit(habit, -1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                                    >
                                      −
                                    </button>
                                    <div>
                                      <span className="text-emerald-400">{summary.totalVolume.toLocaleString()}</span>
                                      <span className="text-[11px] text-slate-400 font-normal ml-1">
                                        {habit.unit}
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-normal block">
                                        avg: {summary.dailyAverage}/d
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleInlineQuantityEdit(habit, 1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}

                                {/* 2b. Lataif Dual Summary */}
                                {habit.inputType === 'LATAIF' && (
                                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-200">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleInlineQuantityEdit(habit, -1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                                    >
                                      −
                                    </button>
                                    <div>
                                      <span className="text-emerald-400">{summary.totalVolume.toLocaleString()}</span>
                                      <span className="text-[11px] text-slate-400 font-normal ml-1">reps</span>
                                      <span className="text-[11px] text-sky-400 font-normal block">
                                        ≈ {Math.round(((summary.totalVolume * 30) / 5000 / 60) * 10) / 10} hrs
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleInlineQuantityEdit(habit, 1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}

                                {/* 3. Duration Summary */}
                                {habit.inputType === 'DURATION' && (
                                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-200">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleInlineQuantityEdit(habit, -1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                                    >
                                      −
                                    </button>
                                    <div>
                                      <span className="text-sky-400">{summary.totalVolume}</span>
                                      <span className="text-[11px] text-slate-400 font-normal ml-1">min</span>
                                      <span className="text-[11px] text-slate-500 font-normal block">
                                        {Math.round((summary.totalVolume / 60) * 10) / 10} hrs
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleInlineQuantityEdit(habit, 1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-sky-900/80 hover:bg-sky-800 text-sky-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}

                                {/* 4. Boolean / Standard Check Summary */}
                                {habit.inputType === 'BOOLEAN' && (
                                  <div className="flex items-center justify-center gap-1.5 text-xs">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleAdjustBooleanCount(habit, -1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                                    >
                                      −
                                    </button>
                                    <div>
                                      <span className="text-emerald-400 font-bold">
                                        {summary.periodsDone}
                                      </span>
                                      <span className="text-slate-500">/</span>
                                      <span className="text-slate-400">
                                        {summary.possible}{habit.cadence === 'WEEKLY_ONCE' ? ' wk' : ''}
                                      </span>
                                      <span className="text-[11px] text-slate-500 ml-1">
                                        ({summary.completionRate}%)
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleAdjustBooleanCount(habit, 1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}

                                {/* 5. Slot Summary */}
                                {habit.inputType === 'SLOT' && (
                                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleAdjustBooleanCount(habit, -1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                                    >
                                      −
                                    </button>
                                    <div>
                                      <span className="text-emerald-400 font-bold">{summary.totalLoggedDays}</span>
                                      <span className="text-slate-500"> / {fridayDays.length}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleAdjustBooleanCount(habit, 1); }}
                                      className="w-5 h-5 flex items-center justify-center rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Easy Task Removal Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative text-slate-100">
            <button
              onClick={() => setTaskToDelete(null)}
              className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-800 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Remove Task?</h3>
                <p className="text-xs text-slate-400">Manage habit tracker list</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
              Are you sure you want to remove <span className="font-bold text-white">"{taskToDelete.title}"</span> from this tracker?
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRemoveHabit) {
                    onRemoveHabit(taskToDelete.id);
                  }
                  setTaskToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template-Specific Meaningful Legend & Monthly Remarks Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dynamic Legend Box */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>
              {isSpiritualTemplate && 'Schedule Symbols & Legends'}
              {isHealthTemplate && 'Health & Vitality Guide'}
              {isDeepWorkTemplate && 'Performance & Detox Standards'}
              {isReadingTemplate && 'Multi-Book Reading Standards'}
              {isBabyTemplate && 'Baby & Childcare Routine Standards'}
              {!isSpiritualTemplate && !isHealthTemplate && !isDeepWorkTemplate && !isReadingTemplate && !isBabyTemplate && 'Template Legends'}
            </span>
          </div>

          {/* 1. Daily Spiritual Schedule Legend */}
          {isSpiritualTemplate && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
                  <span className="uppercase tracking-wide">For Obligatory Prayers</span>
                  <span className="text-emerald-400 font-arabic font-normal" dir="rtl">(فرائض نمازوں کے لئے)</span>:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="text-slate-300">Takbeer-e-Oola</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-sky-400 font-bold">•</span>
                    <span className="text-slate-300">With Jamat</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold">••</span>
                    <span className="text-slate-300">Individually</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-rose-400 font-bold">✗</span>
                    <span className="text-slate-300">Qaza / Missed</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <p className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
                  <span className="uppercase tracking-wide">For Jore Participation</span>
                  <span className="text-emerald-400 font-arabic font-normal" dir="rtl">(جوڑ میں شرکت)</span>:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">1</span>
                    <span className="text-slate-300">Asar to Ishraq</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-sky-400 font-bold">2</span>
                    <span className="text-slate-300">Asar to Isha</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold">3</span>
                    <span className="text-slate-300">Magrib to Isha</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-rose-400 font-bold">✗</span>
                    <span className="text-slate-300">Not participated</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg">
                <span className="text-emerald-400 font-semibold">Lataif Conversion:</span> 5,000 count = 30 minutes of presence.
              </div>

              {/* Negative Actions / Vices (Inverse Habit Mechanics) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <p className="font-semibold text-slate-300 text-[11px] flex items-center gap-1.5">
                  <span className="uppercase tracking-wide">Negative Actions & Vices</span>
                  <span className="text-emerald-400 font-arabic font-normal" dir="rtl">(تزکیہ و ترکِ معاصی)</span>:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="text-slate-300">Clean Day (0 incidents)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    <span className="text-rose-400 font-bold">!1</span>
                    <span className="text-slate-300">Incident Logged</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-emerald-400 font-semibold">Inverse Tracking:</span> 0 incidents = 100% clean score and maintains clean streak. Logged incidents track triggers and penalize score.
                </p>
              </div>
            </div>
          )}

          {/* 2. Peak Health & Biohacking Legend (No Urdu) */}
          {isHealthTemplate && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Nutrition Quality Scoring:
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="text-slate-200 font-medium">Clean Whole Foods</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">100% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span className="text-slate-200 font-medium">1 Small Deviation</span>
                    </div>
                    <span className="text-amber-400 text-[11px] font-bold">70% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">✗</span>
                      <span className="text-slate-200 font-medium">Junk Food / Cheat Day</span>
                    </div>
                    <span className="text-rose-400 text-[11px] font-bold">0% Score</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Daily Vital Benchmarks:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Hydration</div>
                    <div className="text-emerald-400 font-bold mt-0.5">3,000 ml</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Movement</div>
                    <div className="text-sky-400 font-bold mt-0.5">10,000 steps</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Gym Training</div>
                    <div className="text-amber-400 font-bold mt-0.5">45 min</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Sleep Recovery</div>
                    <div className="text-purple-400 font-bold mt-0.5">8.0 hrs</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Deep Work & Digital Detox Legend (No Urdu) */}
          {isDeepWorkTemplate && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Abstinence & Detox Rules:
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="text-slate-200 font-medium">Clean Abstinence Maintained</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">Streak +1</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">✗</span>
                      <span className="text-slate-200 font-medium">Relapse / Distraction Trap</span>
                    </div>
                    <span className="text-rose-400 text-[11px] font-bold">Penalty</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">⏸</span>
                      <span className="text-slate-200 font-medium">Excused / Vacation Freeze</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">Protected</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Cognitive Focus Targets:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Deep Focus Block</div>
                    <div className="text-emerald-400 font-bold mt-0.5">180 min</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Book Reading</div>
                    <div className="text-sky-400 font-bold mt-0.5">20 pages</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Multi-Book Reading Tracker Legend */}
          {isReadingTemplate && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Daily Book Allocation Targets:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Primary Study</div>
                    <div className="text-emerald-400 font-bold mt-0.5">25 pages</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Technical Text</div>
                    <div className="text-sky-400 font-bold mt-0.5">20 pages</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Classical Works</div>
                    <div className="text-amber-400 font-bold mt-0.5">15 pages</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Fiction / Novels</div>
                    <div className="text-purple-400 font-bold mt-0.5">30 pages</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Synthesis & Notes Markers:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-200">Marginalia / Summaries</span>
                    <span className="text-emerald-400 font-bold">✓ Done / ✗ Missed</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-200">Key Quotes Logged</span>
                    <span className="text-sky-400 font-bold">Target: 5 quotes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Baby & Child Daily Tracker Legend */}
          {isBabyTemplate && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Solid Meals & Nutrition Quality:
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="text-slate-200">3 Balanced Meals + Fruits</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-bold">100% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sky-400 font-bold">•</span>
                      <span className="text-slate-200">2 Meals + Healthy Snacks</span>
                    </div>
                    <span className="text-sky-400 text-[11px] font-bold">75% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">••</span>
                      <span className="text-slate-200">Picky / Partial Eating</span>
                    </div>
                    <span className="text-amber-400 text-[11px] font-bold">50% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">✗</span>
                      <span className="text-slate-200">Refused Meals / Fussy</span>
                    </div>
                    <span className="text-rose-400 text-[11px] font-bold">0% Score</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Daily Childcare Benchmarks:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Milk / Formula</div>
                    <div className="text-emerald-400 font-bold mt-0.5">24 oz daily</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Night Sleep</div>
                    <div className="text-sky-400 font-bold mt-0.5">10 - 11 hrs</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Daytime Nap</div>
                    <div className="text-purple-400 font-bold mt-0.5">90 min target</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Storytime Books</div>
                    <div className="text-amber-400 font-bold mt-0.5">3 books daily</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Teeth Brushing & Tantrum Tracking:
                </p>
                <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
                  <p className="text-slate-300">
                    <span className="text-emerald-400 font-bold">✓ 2x</span> Morning & Night • <span className="text-amber-400 font-bold">• 1x</span> Once today
                  </p>
                  <p className="text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="text-emerald-400 font-semibold">Tantrums (Inverse):</span> 0 incidents = Peaceful day. Slips track tiredness/hunger triggers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Intelligent Menstrual & Cycle Health Legend */}
          {isCycleTemplate && (
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Menstrual Flow Intensity Markers:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">✓</span>
                      <span className="text-slate-200">Heavy Flow (Peak)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-pink-400 font-bold">•</span>
                      <span className="text-slate-200">Medium Flow</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-pink-300 font-bold">••</span>
                      <span className="text-slate-200">Light Flow</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-fuchsia-400 font-bold">•••</span>
                      <span className="text-slate-200">Spotting / Taper</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Pelvic Pain & Dysmenorrhea Scale:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">✓ Pain-Free</span>
                    <span className="text-slate-400 text-[11px]">Comfortable</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-sky-400 font-bold">• Mild Cramps</span>
                    <span className="text-slate-400 text-[11px]">Light ache</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-amber-400 font-bold">•• Moderate</span>
                    <span className="text-slate-400 text-[11px]">Pressure</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-rose-400 font-bold">✗ Severe Pain</span>
                    <span className="text-slate-400 text-[11px]">Rest needed</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  PMS Meltdown & Rage Tracking (Inverse):
                </p>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] space-y-1">
                  <p className="text-slate-300">
                    <span className="text-emerald-400 font-bold">0 incidents:</span> 100% serene day • Emotional regulation intact.
                  </p>
                  <p className="text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="text-rose-400 font-semibold">1+ incidents:</span> Flags sudden luteal progesterone drops and cortisol sensitivity.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7. Fallback for custom user templates */}
          {!isSpiritualTemplate && !isHealthTemplate && !isDeepWorkTemplate && !isReadingTemplate && !isBabyTemplate && !isCycleTemplate && (
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>✓</span>
                  <span className="text-slate-300 font-normal">Completed</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <span>✗</span>
                  <span className="text-slate-300 font-normal">Missed / Failed</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-bold">
                  <span>⏸</span>
                  <span className="text-slate-300 font-normal">Skipped (Score Frozen)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Remarks Area */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span className="uppercase tracking-wider">Monthly Remarks & Notes</span>
                {isSpiritualTemplate && (
                  <span className="text-emerald-400 font-normal font-arabic" dir="rtl">(سالک کے احوال / تاثرات)</span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Review progress, monthly adjustments, and reading reflections for {currentMonth}.
              </p>
            </div>
            <span className="text-[11px] text-emerald-400 tabular-nums">
              Auto-saved
            </span>
          </div>

          <textarea
            value={monthlyRemarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            placeholder="Write your monthly reflections, insights, areas needing improvement..."
            rows={5}
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-sans font-arabic leading-relaxed"
          />
        </div>
      </div>

      {/* Floating Matrix Quick-Count Dock */}
      {selectedCell && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+49px+8px)] sm:bottom-[max(env(safe-area-inset-bottom),16px)] left-1/2 -translate-x-1/2 z-40 w-[calc(100%-16px)] max-w-2xl max-h-[70vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3 sm:p-4 shadow-2xl ring-1 ring-white/10 text-slate-100 animate-fade-in">
          {/* Dock Top Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-semibold text-white text-[17px] truncate">
                  {selectedCell.habit.title}
                </span>
                {isSpiritualTemplate && selectedCell.habit.urduTitle && (
                  <span className="text-emerald-400 text-[15px] font-arabic shrink-0" dir="rtl">
                    {selectedCell.habit.urduTitle}
                  </span>
                )}
              </div>
              <p className="text-[13px] text-slate-400 mt-0.5 truncate">
                {new Date(year, month - 1, selectedCell.day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                {showHijri && isSpiritualTemplate && (
                  <span className="text-emerald-400/80"> · {getHijriDate(selectedCell.date, hijriOffset).formatted}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenTasbih && isTasbihHabit(selectedCell.habit) && (
                <button
                  onClick={() => onOpenTasbih(selectedCell.habit, selectedCell.date)}
                  className="h-10 px-2.5 flex items-center justify-center gap-1 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-[13px] font-semibold transition"
                  aria-label="Open tasbih counter"
                >
                  <CircleDot className="w-4 h-4" /> Tasbih
                </button>
              )}
              {onEditHabit && (
                <button
                  onClick={() => onEditHabit(selectedCell.habit)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  aria-label="Edit habit"
                  title="Edit habit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onCellClick(selectedCell.habit, selectedCell.date, selectedCell.day)}
                className="flex items-center justify-center gap-1 min-w-[40px] h-10 px-2 sm:px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[13px] font-semibold transition"
                title="Open full modal for notes and stopwatch"
                aria-label="Details and notes"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Details & Notes</span>
              </button>
              <button
                onClick={() => setSelectedCell(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick-Edit Body based on habit type */}
          {/* 1. QUANTITY (Quran Pages, Zikr, Pushups, etc.) */}
          {selectedCell.habit.inputType === 'QUANTITY' && (
            <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              {/* Stepper + Direct numeric input */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                <button
                  onClick={() => {
                    const current = activeLog?.numericValue || 0;
                    const next = Math.max(0, current - (selectedCell.habit.step || 1));
                    handleQuickUpdate({
                      status: next >= (selectedCell.habit.targetValue || 1) ? 'COMPLETED' : (next > 0 ? 'PARTIAL' : 'FAILED'),
                      numericValue: next
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition active:scale-95"
                  title="Decrease"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded-xl">
                  <input
                    type="number"
                    min="0"
                    value={activeLog?.numericValue ?? 0}
                    onChange={(e) => {
                      const next = Math.max(0, parseFloat(e.target.value) || 0);
                      handleQuickUpdate({
                        status: next >= (selectedCell.habit.targetValue || 1) ? 'COMPLETED' : (next > 0 ? 'PARTIAL' : 'FAILED'),
                        numericValue: next
                      });
                    }}
                    className="w-16 bg-transparent text-center tabular-nums font-bold text-lg text-emerald-400 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    {selectedCell.habit.unit || 'units'}
                  </span>
                </div>

                <button
                  onClick={() => {
                    const current = activeLog?.numericValue || 0;
                    const next = current + (selectedCell.habit.step || 1);
                    handleQuickUpdate({
                      status: next >= (selectedCell.habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                      numericValue: next
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition active:scale-95"
                  title="Increase"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {((selectedCell.habit.step && selectedCell.habit.step >= 100) || (selectedCell.habit.targetValue && selectedCell.habit.targetValue >= 100)) ? (
                  <>
                    {[100, 500, 1000].map(addVal => (
                      <button
                        key={addVal}
                        onClick={() => {
                          const current = activeLog?.numericValue || 0;
                          const next = current + addVal;
                          handleQuickUpdate({
                            status: next >= (selectedCell.habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                            numericValue: next
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs transition active:scale-95"
                      >
                        +{addVal}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[1, 5, 10].map(addVal => (
                      <button
                        key={addVal}
                        onClick={() => {
                          const current = activeLog?.numericValue || 0;
                          const next = current + addVal;
                          handleQuickUpdate({
                            status: next >= (selectedCell.habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                            numericValue: next
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-xs transition active:scale-95"
                      >
                        +{addVal}
                      </button>
                    ))}
                  </>
                )}

                {selectedCell.habit.targetValue && (
                  <button
                    onClick={() => {
                      const target = selectedCell.habit.targetValue || 1;
                      handleQuickUpdate({
                        status: 'COMPLETED',
                        numericValue: target
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1 active:scale-95"
                  >
                    <Check className="w-3 h-3" />
                    <span>Target ({selectedCell.habit.targetValue})</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    handleQuickUpdate({
                      status: 'FAILED',
                      numericValue: 0
                    });
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
                >
                  Clear (0)
                </button>
              </div>
            </div>
          )}

          {/* 2. LATAIF DUAL TRACKING (Count or Time: 5000 count = 30 min) */}
          {selectedCell.habit.inputType === 'LATAIF' && (
            <div className="mt-2.5 space-y-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                {/* Mode Switcher */}
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => {
                      const currentVal = activeLog?.numericValue || 0;
                      const convertedVal = activeLog?.unitUsed === 'min' ? Math.round((currentVal * 5000) / 30) : currentVal;
                      handleQuickUpdate({
                        unitUsed: 'count',
                        numericValue: convertedVal,
                        status: convertedVal >= 5000 ? 'COMPLETED' : (convertedVal > 0 ? 'PARTIAL' : 'FAILED')
                      });
                    }}
                    className={`px-3 py-1 rounded-md transition ${
                      activeLog?.unitUsed !== 'min' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Count Mode
                  </button>
                  <button
                    onClick={() => {
                      const currentVal = activeLog?.numericValue || 0;
                      const convertedVal = activeLog?.unitUsed !== 'min' ? Math.round((currentVal * 30) / 5000) : currentVal;
                      handleQuickUpdate({
                        unitUsed: 'min',
                        numericValue: convertedVal,
                        status: convertedVal >= 30 ? 'COMPLETED' : (convertedVal > 0 ? 'PARTIAL' : 'FAILED')
                      });
                    }}
                    className={`px-3 py-1 rounded-md transition ${
                      activeLog?.unitUsed === 'min' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Minutes Mode (30m)
                  </button>
                </div>

                {/* Conversion Display */}
                <div className="text-[11px] tabular-nums text-slate-400">
                  {activeLog?.unitUsed === 'min' ? (
                    <span className="text-sky-300">
                      ≈ {Math.round(((activeLog?.numericValue || 0) * 5000) / 30).toLocaleString()} count
                    </span>
                  ) : (
                    <span className="text-emerald-300">
                      ≈ {Math.round(((activeLog?.numericValue || 0) * 30) / 5000)} min
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                {activeLog?.unitUsed === 'min' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const current = activeLog?.numericValue || 0;
                          const next = Math.max(0, current - 5);
                          handleQuickUpdate({
                            unitUsed: 'min',
                            status: next >= 30 ? 'COMPLETED' : (next > 0 ? 'PARTIAL' : 'FAILED'),
                            numericValue: next
                          });
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-base font-bold text-sky-400 tabular-nums px-2">
                        {activeLog?.numericValue || 0} min
                      </span>
                      <button
                        onClick={() => {
                          const current = activeLog?.numericValue || 0;
                          const next = current + 5;
                          handleQuickUpdate({
                            unitUsed: 'min',
                            status: next >= 30 ? 'COMPLETED' : 'PARTIAL',
                            numericValue: next
                          });
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[5, 15].map(m => (
                        <button
                          key={m}
                          onClick={() => {
                            const next = (activeLog?.numericValue || 0) + m;
                            handleQuickUpdate({
                              unitUsed: 'min',
                              status: next >= 30 ? 'COMPLETED' : 'PARTIAL',
                              numericValue: next
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                        >
                          +{m}m
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          handleQuickUpdate({ unitUsed: 'min', status: 'COMPLETED', numericValue: 30 });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow"
                      >
                        30m Target ✓
                      </button>
                      <button
                        onClick={() => handleQuickUpdate({ unitUsed: 'min', status: 'FAILED', numericValue: 0 })}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                      >
                        0
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const current = activeLog?.numericValue || 0;
                          const next = Math.max(0, current - 500);
                          handleQuickUpdate({
                            unitUsed: 'count',
                            status: next >= 5000 ? 'COMPLETED' : (next > 0 ? 'PARTIAL' : 'FAILED'),
                            numericValue: next
                          });
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-base font-bold text-emerald-400 tabular-nums px-2">
                        {(activeLog?.numericValue || 0).toLocaleString()} count
                      </span>
                      <button
                        onClick={() => {
                          const current = activeLog?.numericValue || 0;
                          const next = current + 500;
                          handleQuickUpdate({
                            unitUsed: 'count',
                            status: next >= 5000 ? 'COMPLETED' : 'PARTIAL',
                            numericValue: next
                          });
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[500, 1000].map(cnt => (
                        <button
                          key={cnt}
                          onClick={() => {
                            const next = (activeLog?.numericValue || 0) + cnt;
                            handleQuickUpdate({
                              unitUsed: 'count',
                              status: next >= 5000 ? 'COMPLETED' : 'PARTIAL',
                              numericValue: next
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold"
                        >
                          +{cnt}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          handleQuickUpdate({ unitUsed: 'count', status: 'COMPLETED', numericValue: 5000 });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
                      >
                        5,000 Target ✓
                      </button>
                      <button
                        onClick={() => handleQuickUpdate({ unitUsed: 'count', status: 'FAILED', numericValue: 0 })}
                        className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                      >
                        0
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 3. DURATION (Minutes) */}
          {selectedCell.habit.inputType === 'DURATION' && (
            <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const current = activeLog?.numericValue || 0;
                    const next = Math.max(0, current - 5);
                    handleQuickUpdate({
                      status: next >= (selectedCell.habit.targetValue || 20) ? 'COMPLETED' : (next > 0 ? 'PARTIAL' : 'FAILED'),
                      numericValue: next
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 px-3 py-1 bg-slate-900 border border-slate-700 rounded-xl">
                  <input
                    type="number"
                    min="0"
                    value={activeLog?.numericValue ?? 0}
                    onChange={(e) => {
                      const next = Math.max(0, parseFloat(e.target.value) || 0);
                      handleQuickUpdate({
                        status: next >= (selectedCell.habit.targetValue || 20) ? 'COMPLETED' : (next > 0 ? 'PARTIAL' : 'FAILED'),
                        numericValue: next
                      });
                    }}
                    className="w-14 bg-transparent text-center tabular-nums font-bold text-lg text-sky-400 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400 font-medium">min</span>
                </div>
                <button
                  onClick={() => {
                    const current = activeLog?.numericValue || 0;
                    const next = current + 5;
                    handleQuickUpdate({
                      status: next >= (selectedCell.habit.targetValue || 20) ? 'COMPLETED' : 'PARTIAL',
                      numericValue: next
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[5, 15, 30].map(mins => (
                  <button
                    key={mins}
                    onClick={() => {
                      const current = activeLog?.numericValue || 0;
                      const next = current + mins;
                      handleQuickUpdate({
                        status: next >= (selectedCell.habit.targetValue || 20) ? 'COMPLETED' : 'PARTIAL',
                        numericValue: next
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-300 font-bold text-xs transition"
                  >
                    +{mins}m
                  </button>
                ))}
                <button
                  onClick={() => {
                    const target = selectedCell.habit.targetValue || 20;
                    handleQuickUpdate({
                      status: 'COMPLETED',
                      numericValue: target
                    });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow"
                >
                  Target ({selectedCell.habit.targetValue || 20}m)
                </button>
                <button
                  onClick={() => handleQuickUpdate({ status: 'FAILED', numericValue: 0 })}
                  className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  Clear (0)
                </button>
              </div>
            </div>
          )}

          {/* 4. NEGATIVE_ABSTINENCE (Inverse Tracking: 0 Incidents = Clean) */}
          {selectedCell.habit.category === 'NEGATIVE_ABSTINENCE' && (
            <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-semibold">
                  Recorded Slips:
                </span>
                <span className={`tabular-nums font-bold text-base px-2.5 py-0.5 rounded-lg ${
                  (activeLog?.numericValue || 0) === 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {activeLog?.numericValue || 0} {selectedCell.habit.unit || 'slips'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleQuickUpdate({
                      status: 'COMPLETED',
                      numericValue: 0
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 flex items-center gap-1.5 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mark Clean Day (0 Slips)</span>
                </button>

                <button
                  onClick={() => {
                    const current = activeLog?.numericValue || 0;
                    const next = current + 1;
                    handleQuickUpdate({
                      status: 'FAILED',
                      numericValue: next
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-200 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>+1 Slip</span>
                </button>

                {(activeLog?.numericValue || 0) > 0 && (
                  <button
                    onClick={() => {
                      const current = activeLog?.numericValue || 0;
                      const next = Math.max(0, current - 1);
                      handleQuickUpdate({
                        status: next === 0 ? 'COMPLETED' : 'FAILED',
                        numericValue: next
                      });
                    }}
                    className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    title="Decrease slip count"
                  >
                    -1
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 5. MULTI_STATE / SLOT (e.g. 5 Daily Prayers) */}
          {(selectedCell.habit.inputType === 'MULTI_STATE' || selectedCell.habit.inputType === 'SLOT') && selectedCell.habit.multiStates && (
            <div className="mt-2.5 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {selectedCell.habit.multiStates.map(state => {
                  const isSelected = activeLog?.stateCode === state.code;
                  const stateCount = logs.filter(l => l.habitId === selectedCell.habit.id && l.stateCode === state.code).length;
                  const englishLabel = state.label.split(' (')[0];
                  return (
                    <div
                      key={state.code}
                      className={`pl-3 pr-1.5 min-h-[52px] rounded-xl border font-semibold transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? `${state.bgClass} ring-1 ring-emerald-400 shadow-md`
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleQuickUpdate({
                            status: state.scoreWeight > 0 ? 'COMPLETED' : 'FAILED',
                            stateCode: state.code,
                            numericValue: state.scoreWeight
                          });
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left min-h-[48px]"
                        title={`Set ${englishLabel} for this day`}
                      >
                        <span className="text-[17px] w-5 text-center shrink-0" style={{ color: state.color }}>{state.symbol}</span>
                        <span className="text-[15px] leading-tight">{englishLabel}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 bg-slate-950/90 border border-slate-800 rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => handleAdjustMultiStateCount(selectedCell.habit, state.code, -1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[17px] active:scale-95"
                          aria-label={`Decrease ${englishLabel} count`}
                        >
                          −
                        </button>
                        <span className="text-[15px] font-semibold tabular-nums text-emerald-300 min-w-[28px] text-center">
                          {stateCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustMultiStateCount(selectedCell.habit, state.code, 1)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-[17px] active:scale-95"
                          aria-label={`Increase ${englishLabel} count`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. BOOLEAN (Simple Checkbox + Monthly Count Stepper) */}
          {selectedCell.habit.inputType === 'BOOLEAN' && (
            <div className="mt-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Month Count:</span>
                <button
                  type="button"
                  onClick={() => handleAdjustBooleanCount(selectedCell.habit, -1)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base tabular-nums font-bold text-emerald-400 px-2">
                  {(() => {
                    const sum = calculateMonthSummary(selectedCell.habit, logs.filter(l => l.habitId === selectedCell.habit.id), daysInMonth, currentMonth);
                    return `${sum.periodsDone} / ${sum.possible}${selectedCell.habit.cadence === 'WEEKLY_ONCE' ? ' weeks' : ''}`;
                  })()}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdjustBooleanCount(selectedCell.habit, 1)}
                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => {
                    handleQuickUpdate({ status: 'COMPLETED', numericValue: 1 });
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                    activeLog?.status === 'COMPLETED' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-emerald-950 hover:text-emerald-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Day {selectedCell.day} Done</span>
                </button>
                <button
                  onClick={() => handleQuickUpdate({ status: 'FAILED', numericValue: 0 })}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                    activeLog?.status === 'FAILED' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-rose-950 hover:text-rose-300'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Missed</span>
                </button>
              </div>
            </div>
          )}

          {/* Custom count / minutes (pages & minutes habits already have a typed field above) */}
          {selectedCell.habit.inputType !== 'QUANTITY' && selectedCell.habit.inputType !== 'DURATION' && allowsCustomAmount(selectedCell.habit, sections) && (
            <AmountEntry
              variant="inline"
              habit={selectedCell.habit}
              log={activeLog}
              onSave={(update) => handleQuickUpdate(update)}
            />
          )}

          {/* Dock Bottom Day Stepper Navigation */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[15px]">
            <button
              onClick={() => handleSelectDay(selectedCell.day - 1)}
              disabled={selectedCell.day <= 1}
              className="flex items-center gap-1 px-3 min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 font-semibold transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{selectedCell.day > 1 ? `Day ${selectedCell.day - 1}` : 'Prev Day'}</span>
            </button>


            <button
              onClick={() => handleSelectDay(selectedCell.day + 1)}
              disabled={selectedCell.day >= daysInMonth}
              className="flex items-center gap-1 px-3 min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 font-semibold transition"
            >
              <span>{selectedCell.day < daysInMonth ? `Day ${selectedCell.day + 1}` : 'Next Day'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
