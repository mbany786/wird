import { Habit, HabitLog } from '../types';

/** Lataif: 5000 count ≈ 30 min */
export const LATAIF_COUNT_PER_MIN = 5000 / 30;

/** Habits a tap counter makes sense for: counted dhikr and Lataif lessons. */
export function isTasbihHabit(h: Habit): boolean {
  if (h.inputType === 'LATAIF') return true;
  return h.inputType === 'QUANTITY' && (!h.unit || /^(count|times|x)$/i.test(h.unit.trim()));
}

/** The day's current count for a habit (Lataif minutes converted to count). */
export function currentCount(h: Habit, log?: HabitLog): number {
  if (!log) return 0;
  const v = log.numericValue || 0;
  if (h.inputType === 'LATAIF' && log.unitUsed === 'min') return Math.round(v * LATAIF_COUNT_PER_MIN);
  return v;
}

export function countLog(h: Habit, total: number): Partial<HabitLog> {
  const target = h.targetValue || 1;
  return {
    numericValue: total,
    status: total >= target ? 'COMPLETED' : 'PARTIAL',
    ...(h.inputType === 'LATAIF' ? { unitUsed: 'count' as const } : {})
  };
}
