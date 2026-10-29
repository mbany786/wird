import React, { useMemo, useState } from 'react';
import { Habit, HabitSection, HabitLog, TrackerTemplate } from '../types';
import { calculateMonthSummary } from '../utils/analytics';
import { getHijriDate } from '../utils/hijri';
import { PlusCircle, HelpCircle, Trash2, X, AlertTriangle, Sparkles, HeartPulse, Activity } from 'lucide-react';
import { analyzeMenstrualCycle } from '../utils/cycleEngine';

interface MatrixGridProps {
  template: TrackerTemplate;
  habits: Habit[];
  sections: HabitSection[];
  logs: HabitLog[];
  currentMonth: string; // YYYY-MM
  onCellClick: (habit: Habit, date: string, dayNumber: number) => void;
  monthlyRemarks: string;
  onRemarksChange: (val: string) => void;
  onAddCustomHabit: (sectionId: string) => void;
  onRemoveHabit?: (habitId: string) => void;
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
  monthlyRemarks,
  onRemarksChange,
  onAddCustomHabit,
  onRemoveHabit,
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

  // Compute target date for cycle analysis (defaults to today's date or mid-month)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const cycleTargetDate = useMemo(() => {
    if (todayStr.startsWith(currentMonth)) {
      return todayStr;
    }
    return `${currentMonth}-15`;
  }, [currentMonth, todayStr]);

  const cycleAnalysis = useMemo(() => {
    if (!isCycleTemplate) return null;
    return analyzeMenstrualCycle(logs, cycleTargetDate, cycleLength);
  }, [isCycleTemplate, logs, cycleTargetDate, cycleLength]);

  // Determine number of days in selected month
  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const daysArray = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

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

  // Render cell content
  const renderCellContent = (habit: Habit, day: number) => {
    const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
    const log = logMap.get(`${habit.id}:${dateStr}`);
    const isFriday = fridayDays.includes(day);

    if (habit.cadence === 'FRIDAY_ONLY' && !isFriday) {
      return <span className="text-slate-700/40 select-none text-[10px]">•</span>;
    }

    if (!log) {
      return (
        <span className="w-full h-full flex items-center justify-center text-slate-700 hover:text-slate-400 text-xs">
          ·
        </span>
      );
    }

    if (log.status === 'SKIPPED') {
      return <span className="text-[11px] text-slate-500 font-medium">⏸</span>;
    }

    // 0. Negative Habits (Inverse Tracking: 0 incidents = Clean Day)
    if (habit.category === 'NEGATIVE_ABSTINENCE') {
      const incidents = log.numericValue ?? (log.status === 'FAILED' ? 1 : 0);
      if (incidents > 0 || log.status === 'FAILED') {
        const isDuration = habit.inputType === 'DURATION';
        return (
          <span 
            className="px-1 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 shadow-sm"
            title={`${incidents} ${habit.unit || (isDuration ? 'min' : 'incident(s)')} recorded`}
          >
            !{incidents}{isDuration ? 'm' : ''}
          </span>
        );
      } else {
        return (
          <span 
            className="text-[10px] font-bold text-emerald-400"
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
            className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold shadow-sm"
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
        <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-tight">
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
            className="text-[10px] font-bold text-sky-400 font-mono tracking-tight"
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
            className="text-[10px] font-bold text-emerald-400 font-mono tracking-tight"
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
        <span className="text-[10px] font-bold text-sky-400 font-mono">
          {mins}m
        </span>
      );
    }

    // 4. Boolean Checkbox
    if (log.status === 'COMPLETED') {
      return <span className="text-emerald-400 font-bold text-xs">✓</span>;
    } else if (log.status === 'FAILED') {
      return <span className="text-rose-400 font-bold text-xs">✗</span>;
    }

    return <span className="text-slate-700">·</span>;
  };

  return (
    <div className="space-y-6">
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
                <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-700">
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
                <span className="text-slate-500 text-[10px] ml-1">({cycleAnalysis.nextPeriodEstimatedDate})</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-1 rounded-xl text-xs">
                <span className="text-slate-400 text-[11px] pl-1">Avg Cycle:</span>
                <button
                  type="button"
                  onClick={() => setCycleLength(Math.max(21, cycleLength - 1))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-xs"
                  title="Decrease average cycle length"
                >-</button>
                <span className="font-bold text-slate-200 font-mono px-1">{cycleLength}d</span>
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

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
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
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-medium">
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

              <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
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
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Nutrition: </span>
                    <p className="text-slate-300 text-[11px] leading-snug mt-0.5">{cycleAnalysis.phaseInfo.nutritionAdvice}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Movement: </span>
                    <p className="text-slate-300 text-[11px] leading-snug mt-0.5">{cycleAnalysis.phaseInfo.movementAdvice}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                <span className="font-semibold text-purple-300">Best For: </span>
                {cycleAnalysis.phaseInfo.productivityTip}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Matrix Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            {/* Table Header: Day Numbers 1 to 31 + Optional Hijri */}
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-300 text-xs">
                {/* Pinned Habit Name Column */}
                <th className="sticky left-0 z-20 bg-slate-950 px-4 py-3 min-w-[270px] font-bold tracking-wide uppercase text-slate-400 border-r border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span>Tasks & Schedule</span>
                    {isSpiritualTemplate && template.urduTitle && (
                      <span className="text-xs text-emerald-400 font-normal">({template.urduTitle})</span>
                    )}
                  </div>
                </th>

                {/* Days 1 to 31 */}
                {daysArray.map(d => {
                  const isFriday = fridayDays.includes(d);
                  const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
                  const hijriInfo = (isSpiritualTemplate && showHijri) ? getHijriDate(dateStr, hijriOffset) : null;

                  return (
                    <th
                      key={d}
                      className={`text-center py-2 px-1 w-8 min-w-[34px] font-semibold text-[11px] border-r border-slate-800/60 ${
                        isFriday 
                          ? 'bg-emerald-950/70 text-emerald-300 font-bold' 
                          : 'text-slate-400'
                      }`}
                      title={
                        hijriInfo 
                          ? `Day ${d} (${hijriInfo.formatted})` 
                          : `Day ${d}`
                      }
                    >
                      <div className="text-[11px] font-bold">{d}</div>
                      {hijriInfo && (
                        <div className="text-[9px] text-emerald-300 font-mono font-medium -mt-0.5">
                          {hijriInfo.day}h
                        </div>
                      )}
                      {isFriday && (
                        <div className="text-[8px] text-emerald-400 font-normal">
                          Fri
                        </div>
                      )}
                    </th>
                  );
                })}

                {/* Pinned Summary Header */}
                <th className="sticky right-0 z-20 bg-slate-950 px-3 py-3 min-w-[170px] text-center font-bold tracking-wide uppercase text-slate-400 border-l border-slate-800">
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
                    <tr className="bg-slate-950/70 text-slate-200">
                      <td
                        colSpan={daysInMonth + 2}
                        className="px-4 py-2 font-bold tracking-wider uppercase text-[11px] text-emerald-400 bg-slate-950/80 border-y border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span>{section.title}</span>
                          {isSpiritualTemplate && section.urduTitle && (
                            <span className="text-xs font-normal text-emerald-300/80" dir="rtl">
                              • {section.urduTitle}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => onAddCustomHabit(section.id)}
                          className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-emerald-300 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded transition"
                        >
                          <PlusCircle className="w-3 h-3" />
                          <span>Add Task</span>
                        </button>
                      </td>
                    </tr>

                    {/* Section Habits Rows */}
                    {sectionHabits.map(habit => {
                      const habitLogsForMonth = logs.filter(l => l.habitId === habit.id);
                      const summary = calculateMonthSummary(habit, habitLogsForMonth, daysInMonth);

                      return (
                        <tr key={habit.id} className="group hover:bg-slate-800/40 transition-colors">
                          {/* Habit Title Column (Sticky Left) with Easy Remove Button */}
                          <td className="sticky left-0 z-10 bg-slate-900 px-4 py-2 border-r border-slate-800 font-medium text-slate-200">
                            <div className="flex items-center justify-between gap-2">
                              {/* Clicking Task Title triggers quick manage modal */}
                              <div 
                                onClick={() => setTaskToDelete(habit)}
                                className="cursor-pointer hover:text-emerald-300 transition flex items-center gap-1.5 flex-1 select-none"
                                title="Click to manage or remove this task"
                              >
                                <div>
                                  <span className="text-slate-100 font-semibold group-hover:text-emerald-300 transition">
                                    {habit.title}
                                  </span>
                                  {isSpiritualTemplate && habit.urduTitle && (
                                    <span className="text-[11px] text-emerald-400/90 font-normal ml-2" dir="rtl">
                                      {habit.urduTitle}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Unit or Target Badge + Direct Trash Button */}
                              <div className="flex items-center gap-1.5">
                                {habit.unit && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-bold">
                                    {habit.unit}
                                  </span>
                                )}
                                {habit.cadence === 'FRIDAY_ONLY' && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-medium border border-emerald-800">
                                    Fri
                                  </span>
                                )}

                                {/* Easy Remove Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTaskToDelete(habit);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition"
                                  title={`Remove ${habit.title}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Days 1 to 31 Cells */}
                          {daysArray.map(d => {
                            const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
                            const isFriday = fridayDays.includes(d);

                            return (
                              <td
                                key={d}
                                onClick={() => onCellClick(habit, dateStr, d)}
                                className={`text-center p-0.5 border-r border-slate-800/50 cursor-pointer select-none transition-colors ${
                                  isFriday 
                                    ? 'bg-emerald-950/20 hover:bg-emerald-900/40' 
                                    : 'hover:bg-slate-800/70'
                                }`}
                              >
                                <div className="w-full h-7 flex items-center justify-center">
                                  {renderCellContent(habit, d)}
                                </div>
                              </td>
                            );
                          })}

                          {/* Summary Column */}
                          <td className="sticky right-0 z-10 bg-slate-900 px-3 py-1.5 border-l border-slate-800 text-center font-mono">
                            {/* 0. Negative Habits (Inverse Tracking: 0 incidents = 100% Clean) */}
                            {habit.category === 'NEGATIVE_ABSTINENCE' ? (
                              <div className="text-[11px] font-bold">
                                {summary.totalVolume === 0 ? (
                                  <div>
                                    <span className="text-emerald-400 font-bold">100% Clean</span>
                                    <span className="text-[9px] text-emerald-400/80 font-normal block">0 incidents</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-rose-400 font-bold">
                                      {summary.totalVolume} {habit.unit || 'slips'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-normal block">
                                      {summary.completionRate}% clean days
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                {/* 1. Multi-State Summary */}
                                {habit.inputType === 'MULTI_STATE' && summary.multiStateCounts && (
                                  <div className="flex items-center justify-center gap-1.5 text-[10px]">
                                    {habit.multiStates?.map(st => (
                                      <span key={st.code} className="font-bold" style={{ color: st.color }} title={st.label}>
                                        {st.symbol}{summary.multiStateCounts?.[st.code] ?? 0}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* 2. Quantity Volume Summary */}
                                {habit.inputType === 'QUANTITY' && (
                                  <div className="text-[11px] font-bold text-slate-200">
                                    <span className="text-emerald-400">{summary.totalVolume.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                                      {habit.unit}
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-normal block">
                                      avg: {summary.dailyAverage}/d
                                    </span>
                                  </div>
                                )}

                                {/* 2b. Lataif Dual Summary */}
                                {habit.inputType === 'LATAIF' && (
                                  <div className="text-[11px] font-bold text-slate-200">
                                    <span className="text-emerald-400">{summary.totalVolume.toLocaleString()}</span>
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">reps</span>
                                    <span className="text-[9px] text-sky-400 font-normal block">
                                      ≈ {Math.round(((summary.totalVolume * 30) / 5000 / 60) * 10) / 10} hrs
                                    </span>
                                  </div>
                                )}

                                {/* 3. Duration Summary */}
                                {habit.inputType === 'DURATION' && (
                                  <div className="text-[11px] font-bold text-slate-200">
                                    <span className="text-sky-400">{summary.totalVolume}</span>
                                    <span className="text-[10px] text-slate-400 font-normal ml-1">min</span>
                                    <span className="text-[9px] text-slate-500 font-normal block">
                                      {Math.round((summary.totalVolume / 60) * 10) / 10} hrs
                                    </span>
                                  </div>
                                )}

                                {/* 4. Boolean / Standard Check Summary */}
                                {habit.inputType === 'BOOLEAN' && (
                                  <div className="flex items-center justify-center gap-2 text-xs">
                                    <span className="text-emerald-400 font-bold">
                                      {summary.totalLoggedDays}
                                    </span>
                                    <span className="text-slate-500">/</span>
                                    <span className="text-slate-400">
                                      {habit.cadence === 'FRIDAY_ONLY' ? fridayDays.length : daysInMonth}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                      ({summary.completionRate}%)
                                    </span>
                                  </div>
                                )}

                                {/* 5. Slot Summary */}
                                {habit.inputType === 'SLOT' && (
                                  <div className="text-[10px] text-slate-300">
                                    <span className="text-emerald-400 font-bold">{summary.totalLoggedDays}</span>
                                    <span className="text-slate-500"> / {fridayDays.length} sessions</span>
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
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  For Obligatory Prayers (فرائض نمازوں کے لئے):
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
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  For Jore Participation (جوڑ میں شرکت):
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
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Negative Actions & Vices (تزکیہ و ترکِ معاصی):
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
                <p className="text-[10px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800">
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
                    <span className="text-emerald-400 text-[10px] font-bold">100% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span className="text-slate-200 font-medium">1 Small Deviation</span>
                    </div>
                    <span className="text-amber-400 text-[10px] font-bold">70% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">✗</span>
                      <span className="text-slate-200 font-medium">Junk Food / Cheat Day</span>
                    </div>
                    <span className="text-rose-400 text-[10px] font-bold">0% Score</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Daily Vital Benchmarks:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Hydration</div>
                    <div className="text-emerald-400 font-bold mt-0.5">3,000 ml</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Movement</div>
                    <div className="text-sky-400 font-bold mt-0.5">10,000 steps</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Gym Training</div>
                    <div className="text-amber-400 font-bold mt-0.5">45 min</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Sleep Recovery</div>
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
                    <span className="text-emerald-400 text-[10px] font-bold">Streak +1</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">✗</span>
                      <span className="text-slate-200 font-medium">Relapse / Distraction Trap</span>
                    </div>
                    <span className="text-rose-400 text-[10px] font-bold">Penalty</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">⏸</span>
                      <span className="text-slate-200 font-medium">Excused / Vacation Freeze</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">Protected</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Cognitive Focus Targets:
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Deep Focus Block</div>
                    <div className="text-emerald-400 font-bold mt-0.5">180 min</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Book Reading</div>
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
                    <div className="text-slate-400 text-[10px]">Primary Study</div>
                    <div className="text-emerald-400 font-bold mt-0.5">25 pages</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Technical Text</div>
                    <div className="text-sky-400 font-bold mt-0.5">20 pages</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Classical Works</div>
                    <div className="text-amber-400 font-bold mt-0.5">15 pages</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Fiction / Novels</div>
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
                    <span className="text-emerald-400 text-[10px] font-bold">100% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-sky-400 font-bold">•</span>
                      <span className="text-slate-200">2 Meals + Healthy Snacks</span>
                    </div>
                    <span className="text-sky-400 text-[10px] font-bold">75% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">••</span>
                      <span className="text-slate-200">Picky / Partial Eating</span>
                    </div>
                    <span className="text-amber-400 text-[10px] font-bold">50% Score</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">✗</span>
                      <span className="text-slate-200">Refused Meals / Fussy</span>
                    </div>
                    <span className="text-rose-400 text-[10px] font-bold">0% Score</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Daily Childcare Benchmarks:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Milk / Formula</div>
                    <div className="text-emerald-400 font-bold mt-0.5">24 oz daily</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Night Sleep</div>
                    <div className="text-sky-400 font-bold mt-0.5">10 - 11 hrs</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Daytime Nap</div>
                    <div className="text-purple-400 font-bold mt-0.5">90 min target</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Storytime Books</div>
                    <div className="text-amber-400 font-bold mt-0.5">3 books daily</div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  Teeth Brushing & Tantrum Tracking:
                </p>
                <div className="space-y-1 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px]">
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
                    <span className="text-slate-400 text-[10px]">Comfortable</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-sky-400 font-bold">• Mild Cramps</span>
                    <span className="text-slate-400 text-[10px]">Light ache</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-amber-400 font-bold">•• Moderate</span>
                    <span className="text-slate-400 text-[10px]">Pressure</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-rose-400 font-bold">✗ Severe Pain</span>
                    <span className="text-slate-400 text-[10px]">Rest needed</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wide">
                  PMS Meltdown & Rage Tracking (Inverse):
                </p>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] space-y-1">
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Monthly Remarks & Notes {isSpiritualTemplate && '(سالک کے احوال / تاثرات)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Review progress, monthly adjustments, and reading reflections for {currentMonth}.
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              Auto-saved
            </span>
          </div>

          <textarea
            value={monthlyRemarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            placeholder="Write your monthly reflections, insights, areas needing improvement..."
            rows={5}
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-sans"
          />
        </div>
      </div>
    </div>
  );
};
