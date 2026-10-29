import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { Habit, HabitLog } from '../types';
import { AmountUnit, buildAmountUpdate, getAmountConfig, getCurrentAmount } from '../utils/amount';

interface AmountEntryProps {
  habit: Habit;
  log?: HabitLog;
  onSave: (update: Partial<HabitLog>) => void;
  /**
   * collapsible: shows a small "Add count or minutes" link that opens the editor (Daily cards).
   * inline: editor is always visible (Matrix quick-count panel).
   */
  variant?: 'collapsible' | 'inline';
}

const UNIT_LABEL: Record<AmountUnit, string> = { count: 'Count', min: 'Min' };

export const AmountEntry: React.FC<AmountEntryProps> = ({ habit, log, onSave, variant = 'collapsible' }) => {
  const cfg = getAmountConfig(habit);
  const current = getCurrentAmount(habit, log);
  const hasValue = current.value !== undefined && (cfg.primary || current.value > 0);

  const [open, setOpen] = useState(variant === 'inline');
  const [unit, setUnit] = useState<AmountUnit>(current.unit);
  const [text, setText] = useState<string>(hasValue ? String(current.value) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-sync when the day or habit changes underneath (e.g. stepping days in the Matrix panel)
  useEffect(() => {
    setUnit(current.unit);
    setText(hasValue ? String(current.value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit.id, log?.date, log?.numericValue, log?.amount, log?.amountUnit, log?.unitUsed, log?.status]);

  useEffect(() => {
    if (open && variant === 'collapsible') inputRef.current?.focus();
  }, [open, variant]);

  const parsed = text.trim() === '' ? NaN : Number(text.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed >= 0 && (cfg.decimals || Number.isInteger(parsed));
  const dirty = valid && (parsed !== current.value || unit !== current.unit);

  const save = () => {
    if (!valid) return;
    onSave(buildAmountUpdate(habit, log, parsed, unit));
    if (variant === 'collapsible') setOpen(false);
    inputRef.current?.blur();
  };

  const clear = () => {
    onSave(buildAmountUpdate(habit, log, 0, unit));
    setText('');
    if (variant === 'collapsible') setOpen(false);
  };

  const fixedUnitLabel = cfg.units.length === 1 ? (cfg.unitLabel ?? (cfg.units[0] === 'min' ? 'min' : 'count')) : undefined;
  const promptLabel = cfg.primary ? 'Enter exact amount' : 'Add count or minutes';

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 inline-flex items-center gap-1.5 min-h-[36px] text-[13px] font-medium text-slate-400 hover:text-emerald-300"
      >
        {hasValue && !cfg.primary ? (
          <>
            <Pencil className="w-3.5 h-3.5 text-emerald-400" />
            <span className="tabular-nums text-slate-200">
              {current.value?.toLocaleString()} {current.unit === 'min' ? 'min' : 'count'}
            </span>
          </>
        ) : (
          <>
            {cfg.primary ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-4 h-4" />}
            <span>{promptLabel}</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className={variant === 'collapsible' ? 'mt-2.5' : 'mt-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800'}>
      {variant === 'inline' && (
        <p className="text-[13px] text-slate-400 mb-1.5">{cfg.primary ? 'Exact amount' : 'Count or minutes (optional)'}</p>
      )}
      <form
        className="flex flex-wrap items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode={cfg.decimals ? 'decimal' : 'numeric'}
          enterKeyHint="done"
          autoComplete="off"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^0-9.,]/g, ''))}
          placeholder="0"
          aria-label={`${habit.title} amount`}
          className={`w-20 h-10 px-3 rounded-xl bg-slate-900 border text-[17px] font-semibold tabular-nums text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            text && !valid ? 'border-rose-600' : 'border-slate-700'
          }`}
        />

        {fixedUnitLabel ? (
          <span className="text-[15px] text-slate-400">{fixedUnitLabel}</span>
        ) : (
          <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-0.5" role="radiogroup" aria-label="Unit">
            {cfg.units.map(u => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={unit === u}
                onClick={() => setUnit(u)}
                className={`h-9 px-2.5 rounded-lg text-[13px] font-semibold transition ${
                  unit === u ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {UNIT_LABEL[u]}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {hasValue && !cfg.primary && (
            <button
              type="button"
              onClick={clear}
              className="h-10 px-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-rose-300 hover:bg-slate-800"
              aria-label="Clear amount"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={!dirty}
            className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[15px] font-semibold transition"
          >
            Save
          </button>
          {variant === 'collapsible' && (
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
