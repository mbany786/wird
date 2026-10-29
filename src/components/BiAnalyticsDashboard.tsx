import React, { useMemo } from 'react';
import { Habit, HabitLog, TrackerTemplate } from '../types';
import { calculateMonthSummary, computeHabitCorrelation } from '../utils/analytics';
import { 
  TrendingUp, 
  Flame, 
  Layers, 
  Sparkles, 
  ArrowUpRight,
  BarChart2,
  Droplet,
  Footprints,
  ShieldCheck,
  Baby,
  BookOpen,
  Heart,
  HeartPulse
} from 'lucide-react';
import { analyzeMenstrualCycle } from '../utils/cycleEngine';

interface BiAnalyticsDashboardProps {
  template: TrackerTemplate;
  habits: Habit[];
  logs: HabitLog[];
  currentMonth: string; // YYYY-MM
}

export const BiAnalyticsDashboard: React.FC<BiAnalyticsDashboardProps> = ({
  template,
  habits,
  logs,
  currentMonth
}) => {
  const isSpiritualTemplate = template.id === 'daily_spiritual_schedule';
  const isHealthTemplate = template.id === 'complete_health_fitness';
  const isDeepWorkTemplate = template.id === 'deep_work_digital_detox';
  const isBabyTemplate = template.id === 'baby_child_routine_tracker';
  const isCycleTemplate = template.id === 'cycle_health_tracker';

  const [year, month] = currentMonth.split('-').map(Number);
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const cycleTargetDate = useMemo(() => {
    if (todayStr.startsWith(currentMonth)) return todayStr;
    return `${currentMonth}-15`;
  }, [currentMonth, todayStr]);

  const cycleBiAnalysis = useMemo(() => {
    if (!isCycleTemplate) return null;
    return analyzeMenstrualCycle(logs, cycleTargetDate);
  }, [isCycleTemplate, logs, cycleTargetDate]);

  // Summaries per habit
  const summaries = useMemo(() => {
    return habits.map(h => {
      const habitLogs = logs.filter(l => l.habitId === h.id);
      return {
        habit: h,
        summary: calculateMonthSummary(h, habitLogs, daysInMonth)
      };
    });
  }, [habits, logs, daysInMonth]);

  // Overall Health Index
  const overallHealthIndex = useMemo(() => {
    if (summaries.length === 0) return 0;
    const sum = summaries.reduce((acc, s) => acc + s.summary.strengthScore, 0);
    return Math.round(sum / summaries.length);
  }, [summaries]);

  // Aggregated Volume Metrics
  const volumeMetrics = useMemo(() => {
    let totalPages = 0;
    let totalCount = 0;
    let totalMinutes = 0;
    let totalWaterMl = 0;
    let totalSteps = 0;
    let totalBooks = 0;
    let totalMilkOz = 0;
    let totalSleepHours = 0;
    let cleanAbstinenceLogs = 0;

    for (const log of logs) {
      const h = habits.find(habit => habit.id === log.habitId);
      if (!h) continue;

      if (h.unit === 'pages') totalPages += (log.numericValue || 0);
      if (h.unit === 'books') totalBooks += (log.numericValue || 0);
      if (h.unit === 'oz') totalMilkOz += (log.numericValue || 0);
      if (h.unit === 'hrs') totalSleepHours += (log.numericValue || 0);
      if (h.unit === 'count' || h.inputType === 'LATAIF') {
        const count = log.unitUsed === 'min' ? Math.round(((log.numericValue || 0) * 5000) / 30) : (log.numericValue || 0);
        totalCount += count;
      }
      if (h.unit === 'min' || h.inputType === 'DURATION') totalMinutes += (log.numericValue || 0);
      if (h.unit === 'ml') totalWaterMl += (log.numericValue || 0);
      if (h.unit === 'steps') totalSteps += (log.numericValue || 0);

      if (h.category === 'NEGATIVE_ABSTINENCE' && (log.status === 'COMPLETED' || (log.numericValue === 0))) {
        cleanAbstinenceLogs++;
      }
    }

    return { totalPages, totalCount, totalMinutes, totalWaterMl, totalSteps, totalBooks, totalMilkOz, totalSleepHours, cleanAbstinenceLogs };
  }, [logs, habits]);

  // Top Streaks
  const topStreaks = useMemo(() => {
    return [...summaries]
      .sort((a, b) => b.summary.currentStreak - a.summary.currentStreak)
      .slice(0, 5);
  }, [summaries]);

  // Correlations between top habits
  const correlations = useMemo(() => {
    if (habits.length < 2) return [];
    const results: { habitA: string; habitB: string; score: number }[] = [];

    for (let i = 0; i < Math.min(habits.length, 6); i++) {
      for (let j = i + 1; j < Math.min(habits.length, 6); j++) {
        const hA = habits[i];
        const hB = habits[j];
        const logsA = logs.filter(l => l.habitId === hA.id);
        const logsB = logs.filter(l => l.habitId === hB.id);
        const r = computeHabitCorrelation(logsA, hA, logsB, hB);
        if (Math.abs(r) > 0.1) {
          results.push({ habitA: hA.title, habitB: hB.title, score: r });
        }
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }, [habits, logs]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Template-Specific Macro KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Strength Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Overall Strength Index</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-white">{overallHealthIndex}%</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Active
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallHealthIndex}%` }}
            />
          </div>
        </div>

        {/* KPI 2 (Template Specific) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              {isSpiritualTemplate && 'Total Zikr & Reps'}
              {isHealthTemplate && 'Hydration Volume'}
              {isDeepWorkTemplate && 'Deep Work Duration'}
              {isBabyTemplate && 'Milk & Formula Intake'}
              {isCycleTemplate && 'Biological Stage'}
              {!isSpiritualTemplate && !isHealthTemplate && !isDeepWorkTemplate && !isBabyTemplate && !isCycleTemplate && 'Total Count Logs'}
            </span>
            {isHealthTemplate ? (
              <Droplet className="w-4 h-4 text-sky-400" />
            ) : isBabyTemplate ? (
              <Baby className="w-4 h-4 text-pink-400" />
            ) : isCycleTemplate ? (
              <HeartPulse className="w-4 h-4 text-rose-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-purple-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`font-extrabold ${isCycleTemplate ? 'text-xl sm:text-2xl text-rose-300' : 'text-3xl text-purple-300'}`}>
              {isHealthTemplate 
                ? `${(volumeMetrics.totalWaterMl / 1000).toFixed(1)} L` 
                : isBabyTemplate 
                  ? `${volumeMetrics.totalMilkOz} oz` 
                  : isCycleTemplate
                    ? (cycleBiAnalysis?.phaseInfo.phaseName || 'Luteal Phase')
                    : volumeMetrics.totalCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">
              {isHealthTemplate ? 'water' : isBabyTemplate ? 'milk' : isCycleTemplate ? `Day ${cycleBiAnalysis?.currentCycleDay || 19}` : 'reps'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isSpiritualTemplate && 'Aggregated across tasbih counters & lataif'}
            {isHealthTemplate && 'Total water consumed this month'}
            {isDeepWorkTemplate && `${Math.round(volumeMetrics.totalMinutes / 60)} total focus hours`}
            {isBabyTemplate && 'Recorded total feeding volume'}
            {isCycleTemplate && (cycleBiAnalysis ? `${cycleBiAnalysis.phaseInfo.subPhase}` : 'Intelligent cycle stage')}
          </p>
        </div>

        {/* KPI 3 (Template Specific) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              {isSpiritualTemplate && 'Quran Pages Logged'}
              {isHealthTemplate && 'Total Step Count'}
              {isDeepWorkTemplate && 'Pages Read'}
              {isBabyTemplate && 'Storytime Books Read'}
              {isCycleTemplate && 'Restful Sleep Tracked'}
              {!isSpiritualTemplate && !isHealthTemplate && !isDeepWorkTemplate && !isBabyTemplate && !isCycleTemplate && 'Volume Units'}
            </span>
            {isHealthTemplate ? (
              <Footprints className="w-4 h-4 text-emerald-400" />
            ) : isBabyTemplate ? (
              <BookOpen className="w-4 h-4 text-amber-400" />
            ) : isCycleTemplate ? (
              <Heart className="w-4 h-4 text-purple-400" />
            ) : (
              <Layers className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-sky-300">
              {isHealthTemplate 
                ? volumeMetrics.totalSteps.toLocaleString() 
                : isBabyTemplate 
                  ? volumeMetrics.totalBooks 
                  : isCycleTemplate
                    ? `${volumeMetrics.totalSleepHours.toFixed(1)}`
                    : volumeMetrics.totalPages}
            </span>
            <span className="text-xs text-slate-400">
              {isHealthTemplate ? 'steps' : isBabyTemplate ? 'books' : isCycleTemplate ? 'hrs' : 'pages'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isSpiritualTemplate && `~${(volumeMetrics.totalPages / 20).toFixed(1)} Juz completed`}
            {isHealthTemplate && 'Recorded active movement'}
            {isDeepWorkTemplate && 'Non-fiction book progress'}
            {isBabyTemplate && 'Language & cognitive milestones'}
            {isCycleTemplate && 'Total restorative sleep logged'}
          </p>
        </div>

        {/* KPI 4 (Template Specific) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>
              {isSpiritualTemplate && 'Moraqiba / Presence'}
              {isHealthTemplate && 'Training / Gym Time'}
              {isDeepWorkTemplate && 'Clean Abstinence Logs'}
              {isBabyTemplate && 'Outdoor & Nap Time'}
              {isCycleTemplate && 'Emotional Harmony (Inverse)'}
              {!isSpiritualTemplate && !isHealthTemplate && !isDeepWorkTemplate && !isBabyTemplate && !isCycleTemplate && 'Total Minutes'}
            </span>
            {isDeepWorkTemplate || isCycleTemplate ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : isBabyTemplate ? (
              <Heart className="w-4 h-4 text-rose-400" />
            ) : (
              <Flame className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-amber-300">
              {isDeepWorkTemplate || isCycleTemplate
                ? volumeMetrics.cleanAbstinenceLogs 
                : isBabyTemplate 
                  ? `${Math.round(volumeMetrics.totalMinutes / 60)} hrs` 
                  : `${volumeMetrics.totalMinutes}m`}
            </span>
            <span className="text-xs text-slate-400">
              {isDeepWorkTemplate || isCycleTemplate ? 'serene days' : isBabyTemplate ? 'fresh air & rest' : 'logged'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {isSpiritualTemplate && 'Meditation & silent dhikr focus'}
            {isHealthTemplate && 'Physical resistance & cardio'}
            {isDeepWorkTemplate && 'Zero screen addiction slips'}
            {isBabyTemplate && 'Total outdoor play & restorative nap time'}
            {isCycleTemplate && 'Days with zero PMS rage or meltdowns'}
          </p>
        </div>
      </div>

      {/* Main Grid: Habit Strength Rankings & Cross Correlations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Habit Strength Rankings */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[17px] font-semibold text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <span>Habit Strength</span>
              </h3>
              <span className="text-[13px] text-slate-400 tabular-nums whitespace-nowrap">
                {summaries.length} habits
              </span>
            </div>
            <p className="text-[13px] text-slate-400 mt-1">
              Builds with consistency and fades slowly (21-day half-life), so one missed day won't reset your progress.
            </p>
          </div>

          <div className="space-y-3">
            {summaries.map(({ habit, summary }) => (
              <div key={habit.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{habit.title}</span>
                    {isSpiritualTemplate && habit.urduTitle && (
                      <span className="text-[11px] text-emerald-400" dir="rtl">{habit.urduTitle}</span>
                    )}
                    {habit.unit && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 tabular-nums">
                        {habit.unit}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">
                      {summary.totalLoggedDays} logs
                    </span>
                    <span className="tabular-nums font-bold text-emerald-400 text-sm">
                      {summary.strengthScore}%
                    </span>
                  </div>
                </div>

                {/* Strength Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${summary.strengthScore}%`,
                      backgroundColor: summary.strengthScore > 75 ? '#22c55e' : summary.strengthScore > 40 ? '#38bdf8' : '#fbbf24'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel: Top Streaks & Catalyst Correlations */}
        <div className="space-y-6">
          {/* Top Active Streaks */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-[15px] font-semibold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Current Unbroken Streaks</span>
            </h3>

            <div className="space-y-2">
              {topStreaks.map(({ habit, summary }) => (
                <div key={habit.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-200 font-medium truncate max-w-[170px]">
                    {habit.title}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Flame className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{summary.currentStreak} days</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Habit Correlation Insights */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-[15px] font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Habit Correlation Engine</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Discovers statistically correlated habits running locally on-device.
            </p>

            <div className="space-y-2">
              {correlations.length > 0 ? (
                correlations.slice(0, 4).map((c, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-semibold truncate max-w-[150px]">{c.habitA}</span>
                      <span className="text-slate-500 tabular-nums">⟷</span>
                      <span className="font-semibold truncate max-w-[150px]">{c.habitB}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Pearson Correlation (r):</span>
                      <span className={`tabular-nums font-bold ${c.score > 0.5 ? 'text-emerald-400' : 'text-sky-400'}`}>
                        +{c.score} (Strong Catalyst)
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-950 rounded-xl">
                  Log at least 5 days of data across multiple habits to reveal correlation patterns.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
