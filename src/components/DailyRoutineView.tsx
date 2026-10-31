import { TodaySummary } from './TodaySummary';
import { isTasbihHabit } from '../utils/tasbih';
import React, { useState } from 'react';
import { Habit, HabitSection, HabitLog, TrackerTemplate } from '../types';
import { getHijriDate } from '../utils/hijri';
import { todayStr, addDays, parseLocalDate } from '../utils/date';
import { AmountEntry } from './AmountEntry';
import { PrayerTimesCard, templateHasPrayers } from './PrayerTimesCard';
import { PrayerConfig } from '../utils/prayerTimes';
import { isDoneLog, weekKeyOf } from '../utils/cadence';
import { allowsCustomAmount } from '../utils/amount';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  CircleDot,
  Eye,
  EyeOff
} from 'lucide-react';
import { analyzeMenstrualCycle } from '../utils/cycleEngine';

interface DailyRoutineViewProps {
  template: TrackerTemplate;
  habits: Habit[];
  sections: HabitSection[];
  logs: HabitLog[];
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (d: string) => void;
  onUpdateLog: (habitId: string, logData: Partial<HabitLog>) => void;
  onRemoveHabit?: (habitId: string) => void;
  showHijri?: boolean;
  hijriOffset?: number;
  prayerConfig?: PrayerConfig;
  onOpenPrayerSettings?: () => void;
  onOpenTasbih?: (habit: Habit) => void;
  onOpenReset?: () => void;
}

export const DailyRoutineView: React.FC<DailyRoutineViewProps> = ({
  template,
  habits,
  sections,
  logs,
  selectedDate,
  onDateChange,
  onUpdateLog,
  onRemoveHabit,
  showHijri = false,
  hijriOffset = 0,
  prayerConfig,
  onOpenPrayerSettings,
  onOpenTasbih,
  onOpenReset
}) => {
  const isSpiritualTemplate = template.id === 'daily_spiritual_schedule';
  const isCycleTemplate = template.id === 'cycle_health_tracker';
  const hijriDate = isSpiritualTemplate && showHijri ? getHijriDate(selectedDate, hijriOffset) : null;

  const [hideDone, setHideDone] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const toggleCollapsed = (id: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const cycleDailyInfo = React.useMemo(() => {
    if (!isCycleTemplate) return null;
    return analyzeMenstrualCycle(logs, selectedDate);
  }, [isCycleTemplate, logs, selectedDate]);

  // Fast log map by habitId
  const dailyLogsMap = new Map<string, HabitLog>();
  logs.filter(l => l.date === selectedDate).forEach(l => dailyLogsMap.set(l.habitId, l));

  // Determine if selected date is a Friday
  const isFriday = parseLocalDate(selectedDate).getDay() === 5;
  const isToday = selectedDate === todayStr();

  const handlePrevDay = () => onDateChange(addDays(selectedDate, -1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleToday = () => onDateChange(todayStr());

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Date Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 px-2 py-3 rounded-2xl shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handlePrevDay}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Previous Day"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold text-slate-100">
            {parseLocalDate(selectedDate).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </h2>
          {hijriDate && (
            <div className="mt-0.5 leading-snug">
              <p className="text-[13px] text-emerald-400 font-medium" dir="ltr">
                {hijriDate.formatted}
              </p>
              <p className="text-[13px] text-emerald-400/80 font-arabic" dir="rtl" lang="ar">
                {hijriDate.formattedArabic}
              </p>
            </div>
          )}
          {isFriday && (
            <span className="text-[13px] text-emerald-400 font-medium block mt-0.5">
              ★ Friday{isSpiritualTemplate && ' · جمعہ مبارک'}
            </span>
          )}
          {!isToday && (
            <button
              onClick={handleToday}
              className="mt-1.5 text-[13px] px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800 hover:bg-emerald-900 transition"
            >
              Back to Today
            </button>
          )}
        </div>

        <button
          onClick={handleNextDay}
          className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Next Day"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="px-1">
        <TodaySummary habits={habits} sections={sections} logs={logs} date={selectedDate} isToday={isToday} />
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={() => setHideDone(v => !v)}
            aria-pressed={hideDone}
            aria-label={hideDone ? 'Show done items' : 'Hide done items'}
            className={`h-8 px-3 rounded-full text-[12px] font-semibold border flex items-center gap-1.5 transition ${
              hideDone ? 'bg-emerald-950 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {hideDone ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hideDone ? 'Show done' : 'Hide done'}
          </button>
          {onOpenReset && (
            <button type="button" onClick={onOpenReset} className="h-8 px-3 rounded-xl text-[12px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>
      </div>
      </div>

      {/* Prayer times with one-tap logging */}
      {prayerConfig && templateHasPrayers(habits) && (
        <PrayerTimesCard
          config={prayerConfig}
          dateStr={selectedDate}
          habits={habits}
          logs={logs.filter(l => l.date === selectedDate)}
          onLogState={(habit, code) => {
            const st = habit.multiStates?.find(s => s.code === code);
            if (!st) return;
            onUpdateLog(habit.id, { status: st.scoreWeight > 0 ? 'COMPLETED' : 'FAILED', stateCode: code, numericValue: st.scoreWeight, date: selectedDate });
          }}
          onOpenSettings={() => onOpenPrayerSettings?.()}
        />
      )}

      {/* Daily Cycle Stage Card */}
      {isCycleTemplate && cycleDailyInfo && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${cycleDailyInfo.phaseInfo.bgClass} border ${cycleDailyInfo.phaseInfo.borderClass} ${cycleDailyInfo.phaseInfo.textClass}`}>
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${cycleDailyInfo.phaseInfo.bgClass} ${cycleDailyInfo.phaseInfo.textClass} ${cycleDailyInfo.phaseInfo.borderClass}`}>
                    {cycleDailyInfo.phaseInfo.phaseName}
                  </span>
                  {cycleDailyInfo.phaseInfo.isPmsWindow && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      PMS Alert Window
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-100 mt-0.5">
                  Cycle Day {cycleDailyInfo.currentCycleDay} of {cycleDailyInfo.totalCycleLength} • {cycleDailyInfo.phaseInfo.subPhase}
                </h3>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Estimated Next Period: <span className="text-rose-400 font-bold">~{cycleDailyInfo.daysUntilNextPeriod} days</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Predicted Mood & Mindset:</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {cycleDailyInfo.phaseInfo.moodSummary}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/40 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Things to Watch Out For Today:</span>
              </div>
              <ul className="text-slate-300 text-[11px] space-y-1">
                {cycleDailyInfo.phaseInfo.thingsToWatchOutFor.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Routine sections: one flat grouped list per section, divider rows inside */}
      <div className="space-y-4">
        {sections.map(section => {
          const sectionHabits = habits.filter(h => h.sectionId === section.id && (h.cadence !== 'FRIDAY_ONLY' || isFriday));
          if (sectionHabits.length === 0) return null;

          // Precompute done-ness for every habit in this section once, so the header count
          // and the Hide-done filter agree with what each row itself renders.
          const rowData = sectionHabits.map(habit => {
            const log = dailyLogsMap.get(habit.id);
            const doneThisWeekOn = habit.cadence === 'WEEKLY_ONCE'
              ? (() => {
                  const wk = weekKeyOf(selectedDate);
                  const other = logs.find(l => l.habitId === habit.id && l.date !== selectedDate && weekKeyOf(l.date) === wk && isDoneLog(habit, l));
                  return other ? parseLocalDate(other.date).toLocaleDateString(undefined, { weekday: 'short' }) : null;
                })()
              : null;
            const isNegative = habit.category === 'NEGATIVE_ABSTINENCE';
            const incidents = log?.numericValue ?? (log?.status === 'FAILED' ? 1 : 0);
            const isClean = isNegative ? (!log || (log.status !== 'FAILED' && incidents === 0)) : false;
            const isDone = isNegative
              ? isClean
              : Boolean(log?.status === 'COMPLETED' || (log?.numericValue && log.numericValue >= (habit.targetValue || 1)));
            return { habit, log, doneThisWeekOn, isNegative, incidents, isClean, isDone };
          });

          const doneCount = rowData.filter(r => r.isDone).length;
          const visibleRows = hideDone ? rowData.filter(r => !r.isDone) : rowData;
          const isCollapsed = collapsed.has(section.id);

          return (
            <div key={section.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <button
                type="button"
                onClick={() => toggleCollapsed(section.id)}
                aria-expanded={!isCollapsed}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wide text-emerald-400/90">
                    {section.title}
                  </h3>
                  {isSpiritualTemplate && section.urduTitle && (
                    <span className="text-[12px] text-emerald-400/60 font-normal font-arabic shrink-0" dir="rtl">
                      • {section.urduTitle}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 text-[12px] text-slate-500 shrink-0">
                  <span className="tabular-nums">{doneCount}/{sectionHabits.length}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </span>
              </button>

              {!isCollapsed && (
                visibleRows.length === 0 ? (
                  <p className="px-4 pb-4 text-[13px] text-slate-500 border-t border-slate-800/70 pt-3">All done here.</p>
                ) : (
                  <div>
                    {visibleRows.map(({ habit, log, doneThisWeekOn, isNegative, incidents, isClean, isDone }) => (
                      <div
                        key={habit.id}
                        id={`habit-${habit.id}`}
                        className={`px-4 py-3 border-t border-slate-800/70 first:border-t-0 ${
                          isNegative ? (isClean ? 'bg-emerald-950/10' : 'bg-rose-950/10') : ''
                        }`}
                      >
                        {/* Title row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-[16px] font-medium text-slate-100 truncate block">{habit.title}</span>
                            {isSpiritualTemplate && habit.urduTitle && (
                              <span className="block text-left text-[12px] text-slate-500 font-arabic mt-0.5" dir="rtl">{habit.urduTitle}</span>
                            )}
                            {habit.cadence === 'WEEKLY_ONCE' && !isDone && (
                              <span className="block text-[12px] text-sky-400/90 mt-0.5">
                                {doneThisWeekOn ? `Done this week (${doneThisWeekOn})` : 'Once this week'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {habit.cadence === 'WEEKLY_ONCE' && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800/60 font-medium">Weekly</span>
                            )}
                            {isNegative && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 tabular-nums font-semibold border border-emerald-800/60">
                                Inverse
                              </span>
                            )}
                            {!isNegative && habit.unit && !(onOpenTasbih && isTasbihHabit(habit)) && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 tabular-nums font-medium">
                                {habit.unit}
                              </span>
                            )}
                            {onOpenTasbih && isTasbihHabit(habit) && (
                              <button
                                type="button"
                                onClick={() => onOpenTasbih(habit)}
                                aria-label={`Tasbih for ${habit.title}`}
                                className="h-8 px-2.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-[12px] font-semibold flex items-center gap-1"
                              >
                                <CircleDot className="w-3.5 h-3.5" /> Tasbih
                              </button>
                            )}

                            {/* Boolean: compact circular check, right where the badges are */}
                            {habit.inputType === 'BOOLEAN' && (
                              <button
                                onClick={() => {
                                  const newStatus = isDone ? 'FAILED' : 'COMPLETED';
                                  onUpdateLog(habit.id, {
                                    status: newStatus,
                                    numericValue: newStatus === 'COMPLETED' ? 1 : 0,
                                    date: selectedDate
                                  });
                                }}
                                aria-label={isDone ? `Mark ${habit.title} not done` : `Mark ${habit.title} done`}
                                aria-pressed={isDone}
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition ${
                                  isDone ? 'border-emerald-500 bg-emerald-500 text-slate-950' : 'border-slate-600 text-transparent hover:border-slate-400'
                                }`}
                              >
                                <Check className="w-4 h-4" strokeWidth={3} />
                              </button>
                            )}

                            {onRemoveHabit && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove "${habit.title}" from this tracker?`)) {
                                    onRemoveHabit(habit.id);
                                  }
                                }}
                                className="hidden sm:block p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition"
                                title={`Remove ${habit.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Control row, below the title, for every type except the plain boolean check above */}
                        {isNegative ? (
                          <div className="mt-2.5">
                            {isClean ? (
                              <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-800/50 p-2.5 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                  <div>
                                    <p className="text-xs font-semibold text-emerald-300">Clean day · 0 incidents</p>
                                    <p className="text-[11px] text-slate-400">Abstinence intact (100% score)</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    onUpdateLog(habit.id, {
                                      status: 'FAILED',
                                      numericValue: habit.inputType === 'DURATION' ? 15 : 1,
                                      date: selectedDate
                                    });
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition flex items-center gap-1"
                                  title="Record slip / incident"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>+1 Incident</span>
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-2 bg-rose-950/20 border border-rose-900/50 p-2.5 rounded-xl">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                                    <div>
                                      <p className="text-xs font-semibold text-rose-300">
                                        {incidents} {habit.inputType === 'DURATION' ? 'min' : (habit.unit || 'Incident(s)')} logged
                                      </p>
                                      <p className="text-[11px] text-slate-400">Inverse tracking penalizes score</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        const step = habit.inputType === 'DURATION' ? 15 : 1;
                                        onUpdateLog(habit.id, {
                                          status: 'FAILED',
                                          numericValue: incidents + step,
                                          date: selectedDate
                                        });
                                      }}
                                      className="h-9 px-3 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-200 text-[13px] font-semibold border border-rose-700 transition"
                                    >
                                      +{habit.inputType === 'DURATION' ? '15m' : '1 More'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        onUpdateLog(habit.id, {
                                          status: 'COMPLETED',
                                          numericValue: 0,
                                          date: selectedDate
                                        });
                                      }}
                                      className="h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[13px] font-medium transition"
                                      title="Reset to 0 incidents"
                                    >
                                      Reset to 0
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            {/* Multi-state (e.g. the four prayer states) */}
                            {(habit.inputType === 'MULTI_STATE' || habit.inputType === 'SLOT') && habit.multiStates && (
                              <div className="grid grid-cols-4 gap-1.5 mt-2.5">
                                {habit.multiStates.map(state => {
                                  const isSelected = log?.stateCode === state.code;
                                  return (
                                    <button
                                      key={state.code}
                                      onClick={() => {
                                        onUpdateLog(habit.id, {
                                          status: state.scoreWeight > 0 ? 'COMPLETED' : 'FAILED',
                                          stateCode: state.code,
                                          numericValue: state.scoreWeight,
                                          date: selectedDate
                                        });
                                      }}
                                      className={`flex flex-col items-center justify-center min-h-[48px] px-1 py-1.5 rounded-xl border font-medium transition ${
                                        isSelected
                                          ? `${state.bgClass} ring-1 ring-emerald-400`
                                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                      }`}
                                      title={state.label}
                                    >
                                      <span className="text-[14px] leading-none">{state.symbol}</span>
                                      <span className="text-[11px] mt-1 font-medium leading-none">
                                        {(() => { const w = state.code.split('_')[0].toLowerCase(); return w.charAt(0).toUpperCase() + w.slice(1); })()}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Quantity counter */}
                            {habit.inputType === 'QUANTITY' && (
                              <div className="flex items-center justify-between mt-2.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      const current = log?.numericValue || 0;
                                      const next = Math.max(0, current - (habit.step || 1));
                                      onUpdateLog(habit.id, {
                                        status: next >= (habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                                        numericValue: next,
                                        date: selectedDate
                                      });
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>

                                  <span className="text-base font-semibold text-emerald-400 tabular-nums px-2 min-w-[2.5rem] text-center">
                                    {log?.numericValue || 0}
                                  </span>

                                  <button
                                    onClick={() => {
                                      const current = log?.numericValue || 0;
                                      const next = current + (habit.step || 1);
                                      onUpdateLog(habit.id, {
                                        status: next >= (habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                                        numericValue: next,
                                        date: selectedDate
                                      });
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>

                                {habit.step && habit.step >= 100 ? (
                                  <button
                                    onClick={() => {
                                      const current = log?.numericValue || 0;
                                      const next = current + 100;
                                      onUpdateLog(habit.id, {
                                        status: next >= (habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                                        numericValue: next,
                                        date: selectedDate
                                      });
                                    }}
                                    className="h-9 px-3 rounded-lg bg-emerald-950 text-emerald-300 font-semibold text-[13px] border border-emerald-800 hover:bg-emerald-900"
                                  >
                                    +100
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      const current = log?.numericValue || 0;
                                      const next = current + 5;
                                      onUpdateLog(habit.id, {
                                        status: next >= (habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                                        numericValue: next,
                                        date: selectedDate
                                      });
                                    }}
                                    className="h-9 px-3 rounded-lg bg-emerald-950 text-emerald-300 font-semibold text-[13px] border border-emerald-800 hover:bg-emerald-900"
                                  >
                                    +5
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Lataif dual tracking (count vs time: 5000 count = 30m) */}
                            {habit.inputType === 'LATAIF' && (
                              <div className="space-y-2 mt-2.5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    {log?.unitUsed === 'min' ? (
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="text-base font-semibold text-sky-400 tabular-nums">
                                          {log.numericValue || 0} min
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                          ≈ {Math.round(((log.numericValue || 0) * 5000) / 30).toLocaleString()} count
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-baseline gap-1.5">
                                        <span className="text-base font-semibold text-emerald-400 tabular-nums">
                                          {(log?.numericValue || 0).toLocaleString()} count
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                          ≈ {Math.round(((log?.numericValue || 0) * 30) / 5000)} min
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 tabular-nums">
                                    5k = 30m
                                  </span>
                                </div>

                                <div className="grid grid-cols-4 gap-1">
                                  <button
                                    onClick={() => onUpdateLog(habit.id, { status: 'PARTIAL', numericValue: 2500, unitUsed: 'count', date: selectedDate })}
                                    className="h-9 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[13px] font-medium text-slate-300 transition"
                                  >
                                    2.5k (15m)
                                  </button>
                                  <button
                                    onClick={() => onUpdateLog(habit.id, { status: 'COMPLETED', numericValue: 5000, unitUsed: 'count', date: selectedDate })}
                                    className="h-9 px-2.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-[13px] font-semibold text-emerald-300 transition"
                                  >
                                    5k (30m) ✓
                                  </button>
                                  <button
                                    onClick={() => onUpdateLog(habit.id, { status: 'COMPLETED', numericValue: 7500, unitUsed: 'count', date: selectedDate })}
                                    className="h-9 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[13px] font-medium text-slate-300 transition"
                                  >
                                    7.5k (45m)
                                  </button>
                                  <button
                                    onClick={() => onUpdateLog(habit.id, { status: 'COMPLETED', numericValue: 10000, unitUsed: 'count', date: selectedDate })}
                                    className="h-9 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[13px] font-medium text-slate-300 transition"
                                  >
                                    10k (60m)
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Duration & timer */}
                            {habit.inputType === 'DURATION' && (
                              <div className="flex items-center justify-between mt-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm tabular-nums font-semibold text-sky-400">
                                    {log?.numericValue || 0} min
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    / {habit.targetValue || 20}m target
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {[10, 20, 30].map(mins => (
                                    <button
                                      key={mins}
                                      onClick={() => {
                                        onUpdateLog(habit.id, {
                                          status: mins >= (habit.targetValue || 1) ? 'COMPLETED' : 'PARTIAL',
                                          numericValue: mins,
                                          date: selectedDate
                                        });
                                      }}
                                      className="h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[13px] font-medium"
                                    >
                                      {mins}m
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {/* Custom count / minutes (not offered for prayer sections) */}
                        {allowsCustomAmount(habit, sections) && (
                          <div className="mt-2.5">
                            <AmountEntry
                              habit={habit}
                              log={log}
                              onSave={(update) => onUpdateLog(habit.id, { ...update, date: selectedDate })}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
