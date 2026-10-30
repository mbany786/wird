import { Habit, HabitLog } from '../types';

const short = (t: string) => t.replace(/\s*\(.*\)\s*$/, '').replace(/\s+-\s+\d+$/, '').trim();

/** One-line description of what an entry now says, for the "Undo" bar. */
export function describeLog(habit: Habit | undefined, log: Partial<HabitLog>): string {
  const name = habit ? short(habit.title) : 'Entry';
  if (log.stateCode && habit?.multiStates) {
    const s = habit.multiStates.find(m => m.code === log.stateCode);
    if (s) return `${name}: ${short(s.label)}`;
  }
  if (log.status === 'SKIPPED') return `${name}: skipped`;
  if (log.status === 'FAILED' || log.status === 'RELAPSED') return `${name}: marked slipped`;
  const v = log.numericValue ?? 0;
  if (habit?.inputType === 'BOOLEAN' || habit?.inputType === undefined) {
    return v > 0 || log.status === 'COMPLETED' ? `${name}: done` : `${name}: not done`;
  }
  if (habit.inputType === 'DURATION') return `${name}: ${v} min`;
  if (habit.inputType === 'LATAIF') return `${name}: ${v.toLocaleString()} ${log.unitUsed === 'min' ? 'min' : 'count'}`;
  if (habit.inputType === 'QUANTITY') return `${name}: ${v.toLocaleString()}${habit.unit ? ' ' + habit.unit : ''}`;
  return log.status === 'COMPLETED' ? `${name}: done` : `${name}: updated`;
}
