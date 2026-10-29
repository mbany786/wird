import { Habit, HabitLog, HabitSection } from '../types';

/**
 * Custom amounts ("how many" / "how long") for any habit.
 *
 * - Measured habits (QUANTITY, DURATION, LATAIF, and inverse/slip habits) keep their value in
 *   `numericValue`; a custom amount simply sets that value exactly.
 * - Status habits (BOOLEAN done/not-done, MULTI_STATE prayers, SLOT) keep their status as is and
 *   store an optional extra `amount` + `amountUnit` (count or minutes) next to it.
 */

export type AmountUnit = 'count' | 'min';

export interface AmountConfig {
  /** true when the amount is the habit's primary value (numericValue) */
  primary: boolean;
  /** units the user may choose between; one entry means the unit is fixed */
  units: AmountUnit[];
  /** label to show for a fixed unit (e.g. "pages", "ml") */
  unitLabel?: string;
  /** allow decimals (e.g. 7.5 hrs, 98.6 °F) */
  decimals: boolean;
}

export function getAmountConfig(habit: Habit): AmountConfig {
  const decimals = (habit.step ?? 1) % 1 !== 0;
  if (habit.category === 'NEGATIVE_ABSTINENCE') {
    const isMin = habit.inputType === 'DURATION';
    return { primary: true, units: [isMin ? 'min' : 'count'], unitLabel: isMin ? 'min' : (habit.unit || 'slips'), decimals: false };
  }
  switch (habit.inputType) {
    case 'QUANTITY':
      return { primary: true, units: ['count'], unitLabel: habit.unit || 'count', decimals };
    case 'DURATION':
      return { primary: true, units: ['min'], unitLabel: 'min', decimals: false };
    case 'LATAIF':
      return { primary: true, units: ['count', 'min'], decimals: false };
    default:
      return { primary: false, units: ['count', 'min'], decimals: false };
  }
}

/** Current amount and unit stored on a log (undefined value = nothing entered yet). */
export function getCurrentAmount(habit: Habit, log?: HabitLog): { value?: number; unit: AmountUnit } {
  const cfg = getAmountConfig(habit);
  if (cfg.primary) {
    const unit: AmountUnit = habit.inputType === 'LATAIF' ? (log?.unitUsed ?? 'count') : cfg.units[0];
    const v = log?.numericValue;
    return { value: log && log.status !== 'SKIPPED' && v !== undefined ? v : undefined, unit };
  }
  return { value: log?.amount, unit: log?.amountUnit ?? 'count' };
}

/** Partial log update that records `value` (in `unit`) for this habit on this day. */
export function buildAmountUpdate(habit: Habit, log: HabitLog | undefined, value: number, unit: AmountUnit): Partial<HabitLog> {
  const v = Math.max(0, value);

  if (habit.category === 'NEGATIVE_ABSTINENCE') {
    return { status: v === 0 ? 'COMPLETED' : 'FAILED', numericValue: v };
  }

  switch (habit.inputType) {
    case 'QUANTITY': {
      const target = habit.targetValue || 1;
      return { status: v >= target ? 'COMPLETED' : v > 0 ? 'PARTIAL' : 'FAILED', numericValue: v };
    }
    case 'DURATION': {
      const target = habit.targetValue || 20;
      return { status: v >= target ? 'COMPLETED' : v > 0 ? 'PARTIAL' : 'FAILED', numericValue: v };
    }
    case 'LATAIF': {
      const target = unit === 'min' ? 30 : 5000;
      return { status: v >= target ? 'COMPLETED' : v > 0 ? 'PARTIAL' : 'FAILED', numericValue: v, unitUsed: unit };
    }
    case 'BOOLEAN': {
      // Entering an amount means the habit was done that day
      const done = v > 0 || log?.status === 'COMPLETED';
      return {
        amount: v > 0 ? v : undefined,
        amountUnit: unit,
        status: done ? 'COMPLETED' : (log?.status ?? 'SKIPPED'),
        numericValue: done ? 1 : (log?.numericValue ?? 0)
      };
    }
    default: {
      // MULTI_STATE / SLOT: keep the chosen state; without one the day stays unscored
      return {
        amount: v > 0 ? v : undefined,
        amountUnit: unit,
        status: log?.status ?? 'SKIPPED',
        stateCode: log?.stateCode,
        numericValue: log?.numericValue ?? 0
      };
    }
  }
}

/** Short label for the stored extra amount on status habits, e.g. "25m" or "8". */
export function shortExtraAmount(log?: HabitLog): string | undefined {
  if (!log?.amount) return undefined;
  const n = log.amount >= 1000 ? `${(log.amount / 1000).toFixed(log.amount >= 10000 ? 0 : 1)}k` : String(log.amount);
  return log.amountUnit === 'min' ? `${n}m` : n;
}

/** Readable label for the stored extra amount, e.g. "25 min" or "8 count". */
export function formatExtraAmount(log?: HabitLog): string | undefined {
  if (!log?.amount) return undefined;
  return `${log.amount.toLocaleString()} ${log.amountUnit === 'min' ? 'min' : 'count'}`;
}

/** Sections whose habits never take a custom count/minutes (prayers are logged by state or done). */
const PRAYER_SECTION_RE = /prayer|namaz|نماز/i;

export function allowsCustomAmount(habit: Habit, sections: HabitSection[]): boolean {
  const section = sections.find(s => s.id === habit.sectionId);
  if (!section) return true;
  return !(PRAYER_SECTION_RE.test(section.title) || PRAYER_SECTION_RE.test(section.urduTitle ?? ''));
}
