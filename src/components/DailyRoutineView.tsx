import React, { useState } from 'react';
import { Habit, HabitSection, HabitLog, TrackerTemplate } from '../types';
import { getHijriDate } from '../utils/hijri';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Minus, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  HeartPulse
} from 'lucide-react';
import confetti from 'canvas-confetti';
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
  hijriOffset = 0
}) => {
  const isSpiritualTemplate = template.id === 'daily_spiritual_schedule';
  const isCycleTemplate = template.id === 'cycle_health_tracker';
  const hijriDate = isSpiritualTemplate && showHijri ? getHijriDate(selectedDate, hijriOffset) : null;

  const cycleDailyInfo = React.useMemo(() => {
    if (!isCycleTemplate) return null;
    return analyzeMenstrualCycle(logs, selectedDate);
  }, [isCycleTemplate, logs, selectedDate]);

  // Fast log map by habitId
  const dailyLogsMap = new Map<string, HabitLog>();
  logs.filter(l => l.date === selectedDate).forEach(l => dailyLogsMap.set(l.habitId, l));

  // Determine if selected date is a Friday
  const selectedDateObj = new Date(selectedDate);
  const isFriday = selectedDateObj.getDay() === 5;

  const handlePrevDay = () => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() - 1);
    onDateChange(dt.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + 1);
    onDateChange(dt.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.85 }
      });
    } catch (e) {
      // Ignore in environments where canvas is restricted
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Date Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-xl">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Previous Day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToday}
            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800 hover:bg-emerald-900 transition"
          >
            Today
          </button>
          <div className="text-center">
            <h2 className="text-base font-bold text-white tracking-wide">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </h2>
            {hijriDate && (
              <p className="text-xs text-emerald-400 font-medium mt-0.5" dir="rtl">
                {hijriDate.formattedArabic} ({hijriDate.formatted})
              </p>
            )}
            {isFriday && (
              <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider block mt-0.5">
                ★ Friday Routine Active {isSpiritualTemplate && '(جمعہ مبارک)'}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleNextDay}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Next Day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      PMS Alert Window
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
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

      {/* Routine Sections Stream */}
      <div className="space-y-6">
        {sections.map(section => {
          const sectionHabits = habits.filter(h => h.sectionId === section.id);
          if (sectionHabits.length === 0) return null;

          return (
            <div key={section.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              {/* Section Title */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                    {section.title}
                  </h3>
                  {isSpiritualTemplate && section.urduTitle && (
                    <span className="text-xs text-emerald-300/80 font-normal" dir="rtl">
                      • {section.urduTitle}
                    </span>
                  )}
                </div>
              </div>

              {/* Habit Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sectionHabits.map(habit => {
                  const log = dailyLogsMap.get(habit.id);
                  const isNegative = habit.category === 'NEGATIVE_ABSTINENCE';
                  const incidents = log?.numericValue ?? (log?.status === 'FAILED' ? 1 : 0);
                  const isClean = isNegative ? (!log || (log.status !== 'FAILED' && incidents === 0)) : false;
                  const isDone = isNegative 
                    ? isClean 
                    : (log?.status === 'COMPLETED' || (log?.numericValue && log.numericValue >= (habit.targetValue || 1)));

                  // Friday filter
                  if (habit.cadence === 'FRIDAY_ONLY' && !isFriday) {
                    return null;
                  }

                  return (
                    <div 
                      key={habit.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isNegative
                          ? (isClean ? 'bg-emerald-950/15 border-emerald-900/40' : 'bg-rose-950/20 border-rose-900/60')
                          : (isDone ? 'bg-emerald-950/20 border-emerald-800/80' : 'bg-slate-950/70 border-slate-800 hover:border-slate-700')
                      }`}
                    >
                      {/* Habit Header */}
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex-1">
                          <span className="text-sm font-bold text-slate-100">{habit.title}</span>
                          {isSpiritualTemplate && habit.urduTitle && (
                            <span className="text-xs text-emerald-400/90 ml-2" dir="rtl">{habit.urduTitle}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isNegative ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold border border-emerald-800/60">
                              Inverse Track
                            </span>
                          ) : habit.unit && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                              {habit.unit}
                            </span>
                          )}
                          {onRemoveHabit && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remove "${habit.title}" from this tracker?`)) {
                                  onRemoveHabit(habit.id);
                                }
                              }}
                              className="p-1 rounded text-slate-600 hover:text-rose-400 hover:bg-slate-800 transition"
                              title={`Remove ${habit.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Specialized Input Controls */}
                      {isNegative ? (
                        <div className="space-y-2">
                          {isClean ? (
                            <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-xl">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <div>
                                  <p className="text-xs font-bold text-emerald-300">Clean Day • 0 Incidents</p>
                                  <p className="text-[10px] text-slate-400">Abstinence intact (100% score)</p>
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
                                className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                                title="Record slip / incident"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>+1 Incident</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2 bg-rose-950/30 border border-rose-900/60 p-2.5 rounded-xl">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                                  <div>
                                    <p className="text-xs font-bold text-rose-300">
                                      {incidents} {habit.inputType === 'DURATION' ? 'min' : (habit.unit || 'Incident(s)')} Logged
                                    </p>
                                    <p className="text-[10px] text-slate-400">Inverse tracking penalizes score</p>
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
                                    className="px-2 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-200 text-xs font-bold border border-rose-700 transition"
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
                                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition"
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
                          {/* 1. Multi-State Selector (e.g. 4 Prayer States) */}
                      {(habit.inputType === 'MULTI_STATE' || habit.inputType === 'SLOT') && habit.multiStates && (
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
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
                                  if (state.scoreWeight === 1.0) triggerCelebration();
                                }}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-bold transition ${
                                  isSelected 
                                    ? `${state.bgClass} ring-1 ring-emerald-400 shadow-md` 
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                }`}
                                title={state.label}
                              >
                                <span className="text-sm">{state.symbol}</span>
                                <span className="text-[9px] mt-0.5 font-normal truncate max-w-full">
                                  {state.code.split('_')[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. Quantity Counter (e.g. Quran Pages, Zikr 100) */}
                      {habit.inputType === 'QUANTITY' && (
                        <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
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
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="text-base font-bold text-emerald-400 font-mono px-2">
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
                                if (next >= (habit.targetValue || 1)) triggerCelebration();
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Add Presets */}
                          <div className="flex items-center gap-1">
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
                                  triggerCelebration();
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-bold text-[11px] border border-emerald-800 hover:bg-emerald-900"
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
                                className="px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 font-bold text-[11px] border border-emerald-800 hover:bg-emerald-900"
                              >
                                +5
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2b. Lataif Dual Tracking (Count vs Time: 5000 count = 30m) */}
                      {habit.inputType === 'LATAIF' && (
                        <div className="space-y-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          {/* Current Log Display */}
                          <div className="flex items-center justify-between">
                            <div>
                              {log?.unitUsed === 'min' ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-bold text-sky-400 font-mono">
                                    {log.numericValue || 0} min
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    ≈ {Math.round(((log.numericValue || 0) * 5000) / 30).toLocaleString()} count
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-bold text-emerald-400 font-mono">
                                    {(log?.numericValue || 0).toLocaleString()} count
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    ≈ {Math.round(((log?.numericValue || 0) * 30) / 5000)} min
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              5k = 30m
                            </span>
                          </div>

                          {/* Quick Dual Action Buttons */}
                          <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-800/80">
                            {/* 15m / 2.5k */}
                            <button
                              onClick={() => {
                                onUpdateLog(habit.id, {
                                  status: 'PARTIAL',
                                  numericValue: 2500,
                                  unitUsed: 'count',
                                  date: selectedDate
                                });
                              }}
                              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition"
                            >
                              2.5k (15m)
                            </button>

                            {/* 30m / 5k (Full target) */}
                            <button
                              onClick={() => {
                                onUpdateLog(habit.id, {
                                  status: 'COMPLETED',
                                  numericValue: 5000,
                                  unitUsed: 'count',
                                  date: selectedDate
                                });
                                triggerCelebration();
                              }}
                              className="px-1.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-[10px] font-bold text-emerald-300 transition"
                            >
                              5k (30m) ✓
                            </button>

                            {/* 45m / 7.5k */}
                            <button
                              onClick={() => {
                                onUpdateLog(habit.id, {
                                  status: 'COMPLETED',
                                  numericValue: 7500,
                                  unitUsed: 'count',
                                  date: selectedDate
                                });
                                triggerCelebration();
                              }}
                              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition"
                            >
                              7.5k (45m)
                            </button>

                            {/* 60m / 10k */}
                            <button
                              onClick={() => {
                                onUpdateLog(habit.id, {
                                  status: 'COMPLETED',
                                  numericValue: 10000,
                                  unitUsed: 'count',
                                  date: selectedDate
                                });
                                triggerCelebration();
                              }}
                              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition"
                            >
                              10k (60m)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. Duration & Timer (e.g. Moraqiba Minutes) */}
                      {habit.inputType === 'DURATION' && (
                        <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-sky-400">
                              {log?.numericValue || 0} min
                            </span>
                            <span className="text-[10px] text-slate-500">
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
                                  if (mins >= (habit.targetValue || 20)) triggerCelebration();
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                              >
                                {mins}m
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 4. Boolean Checkbox */}
                      {habit.inputType === 'BOOLEAN' && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-400 font-medium">
                            {isDone ? 'Completed for today' : 'Tap to mark done'}
                          </span>

                          <button
                            onClick={() => {
                              const newStatus = isDone ? 'FAILED' : 'COMPLETED';
                              onUpdateLog(habit.id, {
                                status: newStatus,
                                numericValue: newStatus === 'COMPLETED' ? 1 : 0,
                                date: selectedDate
                              });
                              if (newStatus === 'COMPLETED') triggerCelebration();
                            }}
                            className={`p-1.5 rounded-xl transition ${
                              isDone 
                                ? 'text-emerald-400 bg-emerald-950/80 hover:bg-emerald-900' 
                                : 'text-slate-500 bg-slate-800 hover:text-slate-300'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <Circle className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
