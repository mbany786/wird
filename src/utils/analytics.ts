import { Habit, HabitLog } from '../types';
import { completedWeekKeys, fridaysInMonth, isDoneLog, possibleInMonth, weeksInMonth } from './cadence';

export interface HabitSummary {
  habitId: string;
  totalLoggedDays: number;
  totalDaysInMonth: number;
  completionRate: number; // 0 to 100
  totalVolume: number;    // sum of pages, minutes, counts
  dailyAverage: number;
  multiStateCounts?: Record<string, number>;
  strengthScore: number;  // 0 to 100%
  currentStreak: number;
  longestStreak: number;
  /** Chances in the month: days, Fridays or weeks depending on cadence */
  possible: number;
  /** Chances met: logged days (prayers), done days, clean days (inverse habits) or done weeks */
  periodsDone: number;
}

export const LATAIF_COUNT_TO_MIN = (count: number) => Math.round((count * 30) / 5000);
export const LATAIF_MIN_TO_COUNT = (min: number) => Math.round((min * 5000) / 30);

export function calculateHabitStrength(logs: HabitLog[], habit: Habit): number {
  if (logs.length === 0) return 0;

  // Sort logs by date ascending
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const lambda = 0.9674; // ~21 day half-life
  let score = 0.5; // Neutral start

  for (const log of sorted) {
    let r = 0.0;
    if (log.status === 'SKIPPED') {
      // Freezes score without penalty
      continue;
    }

    if (habit.category === 'NEGATIVE_ABSTINENCE') {
      // INVERSE LOGIC: 0 incidents = 100% clean, each incident penalizes score
      if (habit.inputType === 'QUANTITY') {
        const incidents = log.numericValue ?? 0;
        r = incidents === 0 ? 1.0 : Math.max(0.0, 1.0 - (incidents * 0.35));
      } else if (habit.inputType === 'DURATION') {
        const mins = log.numericValue ?? 0;
        r = mins === 0 ? 1.0 : Math.max(0.0, 1.0 - (mins / 60));
      } else {
        r = log.status === 'COMPLETED' ? 1.0 : 0.0;
      }
    } else if (habit.inputType === 'BOOLEAN') {
      r = log.status === 'COMPLETED' ? 1.0 : 0.0;
    } else if (habit.inputType === 'MULTI_STATE' && habit.multiStates) {
      const state = habit.multiStates.find(s => s.code === log.stateCode);
      r = state ? state.scoreWeight : 0.0;
    } else if (habit.inputType === 'QUANTITY' || habit.inputType === 'DURATION') {
      const target = habit.targetValue || 1;
      const logged = log.numericValue || 0;
      r = Math.min(1.0, logged / target);
    } else if (habit.inputType === 'LATAIF') {
      const isMin = log.unitUsed === 'min';
      const effectiveCount = isMin ? (log.numericValue || 0) * (5000 / 30) : (log.numericValue || 0);
      r = Math.min(1.0, effectiveCount / (habit.targetValue || 5000));
    } else if (habit.inputType === 'SLOT' && habit.multiStates) {
      const state = habit.multiStates.find(s => s.code === log.stateCode);
      r = state ? state.scoreWeight : 0.0;
    }

    score = score * lambda + r * (1 - lambda);
  }

  return Math.round(score * 100);
}

export function calculateMonthSummary(
  habit: Habit, 
  logsForMonth: HabitLog[], 
  daysInMonth: number,
  monthKey?: string
): HabitSummary {
  const month = monthKey ?? logsForMonth[0]?.date.slice(0, 7);
  let totalVolume = 0;
  let successWeightSum = 0;
  const multiStateCounts: Record<string, number> = {};

  if (habit.multiStates) {
    for (const opt of habit.multiStates) {
      multiStateCounts[opt.code] = 0;
    }
  }

  for (const log of logsForMonth) {
    if (log.stateCode && multiStateCounts[log.stateCode] !== undefined) {
      multiStateCounts[log.stateCode]++;
    }

    if (habit.inputType === 'QUANTITY' || habit.inputType === 'DURATION') {
      totalVolume += (log.numericValue || 0);
    } else if (habit.inputType === 'LATAIF') {
      const isMin = log.unitUsed === 'min';
      const countVal = isMin ? (log.numericValue || 0) * (5000 / 30) : (log.numericValue || 0);
      totalVolume += Math.round(countVal);
    }

    if (log.status === 'COMPLETED') {
      successWeightSum += 1.0;
    } else if (log.status === 'PARTIAL' && log.stateCode && habit.multiStates) {
      const state = habit.multiStates.find(s => s.code === log.stateCode);
      successWeightSum += state ? state.scoreWeight : 0.5;
    }
  }

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Map dates in month
  const logMap = new Map<string, HabitLog>();
  logsForMonth.forEach(l => logMap.set(l.date, l));

  // Determine eligible days
  const eligibleDays = month ? possibleInMonth(habit, month) : (habit.cadence === 'FRIDAY_ONLY' ? 4 : daysInMonth);

  const isNegative = habit.category === 'NEGATIVE_ABSTINENCE';
  let cleanDaysCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const matchingLog = logsForMonth.find(l => l.date.endsWith(`-${dayStr}`));

    let isCleanOrDone = false;
    if (isNegative) {
      // In negative habits: no log = clean day; status 'COMPLETED' or numericValue === 0 = clean day
      if (!matchingLog) {
        isCleanOrDone = true;
      } else if (matchingLog.status === 'COMPLETED' || (matchingLog.numericValue === 0)) {
        isCleanOrDone = true;
      } else {
        isCleanOrDone = false; // Incident occurred
      }
    } else {
      isCleanOrDone = Boolean(matchingLog && (matchingLog.status === 'COMPLETED' || (matchingLog.numericValue && matchingLog.numericValue >= (habit.targetValue || 1))));
    }

    if (isCleanOrDone) {
      cleanDaysCount++;
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else if (matchingLog?.status === 'SKIPPED') {
      // Maintain streak
    } else {
      tempStreak = 0;
    }
  }
  currentStreak = tempStreak;

  const strength = calculateHabitStrength(logsForMonth, habit);
  let completionRate = isNegative 
    ? Math.round((cleanDaysCount / daysInMonth) * 100)
    : Math.min(100, Math.round((successWeightSum / Math.max(1, eligibleDays)) * 100));

  // Chances met in the month
  let periodsDone: number;
  if (isNegative) {
    periodsDone = cleanDaysCount;
  } else if (habit.inputType === 'MULTI_STATE' || habit.inputType === 'SLOT') {
    periodsDone = logsForMonth.filter(l => l.status !== 'SKIPPED' && l.stateCode).length;
  } else {
    periodsDone = logsForMonth.filter(l => isDoneLog(habit, l)).length;
  }

  // Weekly habits: one completed day covers the week; streaks count in weeks
  if (habit.cadence === 'WEEKLY_ONCE' && month && !isNegative) {
    const weeks = weeksInMonth(month);
    const done = completedWeekKeys(habit, logsForMonth);
    periodsDone = weeks.filter(w => done.has(w.key)).length;
    completionRate = Math.round((periodsDone / Math.max(1, weeks.length)) * 100);
    let run = 0;
    longestStreak = 0;
    for (const w of weeks) {
      if (done.has(w.key)) { run++; longestStreak = Math.max(longestStreak, run); } else run = 0;
    }
    currentStreak = run;
  } else if (habit.cadence === 'FRIDAY_ONLY' && month && !isNegative) {
    const fridays = new Set(fridaysInMonth(month).map(d => `${month}-${String(d).padStart(2, '0')}`));
    periodsDone = logsForMonth.filter(l => fridays.has(l.date) && (habit.multiStates ? l.status !== 'SKIPPED' && !!l.stateCode : isDoneLog(habit, l))).length;
  }

  return {
    habitId: habit.id,
    totalLoggedDays: logsForMonth.filter(l => l.status !== 'SKIPPED').length,
    totalDaysInMonth: daysInMonth,
    completionRate,
    totalVolume,
    dailyAverage: daysInMonth > 0 ? Math.round((totalVolume / daysInMonth) * 10) / 10 : 0,
    multiStateCounts,
    strengthScore: strength,
    currentStreak,
    longestStreak,
    possible: eligibleDays,
    periodsDone
  };
}

export function computeHabitCorrelation(
  logsA: HabitLog[],
  habitA: Habit,
  logsB: HabitLog[],
  habitB: Habit
): number {
  // Join logs by date
  const mapB = new Map<string, HabitLog>();
  logsB.forEach(l => mapB.set(l.date, l));

  const pairs: [number, number][] = [];

  const getScore = (h: Habit, l: HabitLog): number => {
    if (h.inputType === 'BOOLEAN') return l.status === 'COMPLETED' ? 1 : 0;
    if (h.inputType === 'QUANTITY' || h.inputType === 'DURATION') return l.numericValue || 0;
    if (h.multiStates && l.stateCode) {
      const s = h.multiStates.find(st => st.code === l.stateCode);
      return s ? s.scoreWeight : 0;
    }
    return l.status === 'COMPLETED' ? 1 : 0;
  };

  for (const logA of logsA) {
    const logB = mapB.get(logA.date);
    if (logB) {
      pairs.push([getScore(habitA, logA), getScore(habitB, logB)]);
    }
  }

  if (pairs.length < 5) return 0; // Not enough sample size

  const n = pairs.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const [x, y] of pairs) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100) / 100;
}
