import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Sheet } from './Sheet';
import { CadenceType, Habit, HabitCategory, HabitInputType, HabitSection } from '../types';
import { PRAYER_STATES } from '../data/templates';
import { newId } from '../utils/templateOps';

interface HabitEditorSheetProps {
  /** Existing habit to edit; omit to create a new one */
  habit?: Habit;
  /** Section for a new habit */
  defaultSectionId?: string;
  sections: HabitSection[];
  /** Number of logged entries; when > 0 the tracking type is locked so history keeps its meaning */
  entryCount: number;
  onSave: (updated: Habit) => void;
  onDelete?: (habitId: string) => void;
  onClose: () => void;
}

const field = 'w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-[15px] text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500';
const label = 'block text-[13px] font-medium text-slate-400 mb-1';

const TYPE_LABEL: Record<HabitInputType, string> = {
  BOOLEAN: 'Done / not done',
  MULTI_STATE: 'Choice of states (e.g. prayer quality)',
  SLOT: 'Choice of slots',
  QUANTITY: 'Number (pages, counts, ml…)',
  DURATION: 'Minutes',
  LATAIF: 'Lataif (count or minutes)'
};

const CADENCE_LABEL: Record<CadenceType, string> = {
  DAILY: 'Every day',
  FRIDAY_ONLY: 'Fridays only',
  WEEKLY_ONCE: 'Once a week'
};

export const HabitEditorSheet: React.FC<HabitEditorSheetProps> = ({ habit: existing, defaultSectionId, sections, entryCount, onSave, onDelete, onClose }) => {
  const isNew = !existing;
  const habit: Habit = existing ?? {
    id: newId('habit'),
    sectionId: defaultSectionId ?? sections[0]?.id ?? '',
    title: '',
    inputType: 'BOOLEAN',
    category: 'POSITIVE',
    cadence: 'DAILY',
    order: 9999,
    isCustom: true
  };
  const [title, setTitle] = useState(habit.title);
  const [urduTitle, setUrduTitle] = useState(habit.urduTitle ?? '');
  const [sectionId, setSectionId] = useState(habit.sectionId);
  const [cadence, setCadence] = useState<CadenceType>(habit.cadence);
  const [inputType, setInputType] = useState<HabitInputType>(habit.inputType);
  const [category, setCategory] = useState<HabitCategory>(habit.category);
  const [unit, setUnit] = useState(habit.unit ?? '');
  const [target, setTarget] = useState(habit.targetValue !== undefined ? String(habit.targetValue) : '');
  const [step, setStep] = useState(habit.step !== undefined ? String(habit.step) : '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const typeLocked = entryCount > 0;
  const hasStates = !isNew && (inputType === 'MULTI_STATE' || inputType === 'SLOT');
  const measured = inputType === 'QUANTITY' || inputType === 'DURATION' || inputType === 'LATAIF';

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const targetN = num(target);
  const stepN = num(step);
  const errors: string[] = [];
  if (!title.trim()) errors.push('Give the habit a name.');
  if (measured && targetN !== undefined && (!Number.isFinite(targetN) || targetN < 0)) errors.push('Target must be a number of 0 or more.');
  if (measured && stepN !== undefined && (!Number.isFinite(stepN) || stepN <= 0)) errors.push('Step must be a number above 0.');

  const save = () => {
    if (errors.length) return;
    const updated: Habit = {
      ...habit,
      title: title.trim(),
      urduTitle: urduTitle.trim() || undefined,
      sectionId,
      cadence,
      inputType,
      category: inputType === 'MULTI_STATE' ? 'POSITIVE' : category,
      multiStates: inputType === 'MULTI_STATE' && isNew ? PRAYER_STATES : habit.multiStates,
      unit: measured ? (inputType === 'DURATION' ? 'min' : unit.trim() || undefined) : habit.unit,
      targetValue: measured ? targetN : habit.targetValue,
      step: measured ? stepN : habit.step
    };
    onSave(updated);
    onClose();
  };

  return (
    <Sheet
      title={isNew ? 'New habit' : 'Edit habit'}
      subtitle={entryCount ? `${entryCount.toLocaleString()} logged ${entryCount === 1 ? 'entry' : 'entries'} keep working after changes.` : undefined}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-2">
          {isNew || !onDelete ? null : !confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className="h-11 px-3 rounded-xl text-[15px] font-semibold text-rose-300 hover:bg-rose-950/50">
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { onDelete(habit.id); onClose(); }}
              className="h-11 px-3 rounded-xl text-[15px] font-semibold bg-rose-700 text-white"
            >
              {entryCount ? `Delete with ${entryCount} entries` : 'Tap to delete'}
            </button>
          )}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="h-11 px-4 rounded-xl bg-slate-800 text-slate-200 text-[15px] font-semibold">Cancel</button>
            <button
              type="button"
              onClick={save}
              disabled={errors.length > 0}
              className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[15px] font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={label} htmlFor="he-title">Name</label>
          <input id="he-title" className={field} value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="he-urdu">Urdu / Arabic name (optional)</label>
          <input id="he-urdu" dir="rtl" className={`${field} font-arabic`} value={urduTitle} onChange={e => setUrduTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="he-section">Section</label>
            <select id="he-section" className={field} value={sectionId} onChange={e => setSectionId(e.target.value)}>
              {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="he-cadence">How often</label>
            <select id="he-cadence" className={field} value={cadence} onChange={e => setCadence(e.target.value as CadenceType)}>
              {(Object.keys(CADENCE_LABEL) as CadenceType[]).map(c => <option key={c} value={c}>{CADENCE_LABEL[c]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={label} htmlFor="he-type">Tracked as</label>
          {typeLocked || hasStates ? (
            <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[15px] text-slate-300">
              <Lock className="w-4 h-4 text-slate-500" />
              {TYPE_LABEL[inputType]}{category === 'NEGATIVE_ABSTINENCE' ? ' · to avoid' : ''}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <select id="he-type" className={field} value={inputType} onChange={e => setInputType(e.target.value as HabitInputType)}>
                {(['BOOLEAN', 'QUANTITY', 'DURATION', 'LATAIF'] as HabitInputType[]).map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                {isNew && <option value="MULTI_STATE">Prayer quality (Takbeer / Jamat / Individual / Qaza)</option>}
              </select>
              <select aria-label="Goal" disabled={inputType === 'MULTI_STATE'} className={`${field} disabled:opacity-50`} value={category} onChange={e => setCategory(e.target.value as HabitCategory)}>
                <option value="POSITIVE">Build (do it)</option>
                <option value="NEGATIVE_ABSTINENCE">Avoid (0 = clean day)</option>
              </select>
            </div>
          )}
          {typeLocked && !hasStates && (
            <p className="text-[12px] text-slate-500 mt-1">Locked because this habit already has entries; changing it would change what they mean.</p>
          )}
        </div>

        {measured && (
          <div className="grid grid-cols-3 gap-3">
            {inputType !== 'DURATION' && inputType !== 'LATAIF' && (
              <div>
                <label className={label} htmlFor="he-unit">Unit</label>
                <input id="he-unit" className={field} value={unit} onChange={e => setUnit(e.target.value)} placeholder="pages" />
              </div>
            )}
            <div>
              <label className={label} htmlFor="he-target">{inputType === 'DURATION' ? 'Target (min)' : 'Daily target'}</label>
              <input id="he-target" className={field} inputMode="decimal" value={target} onChange={e => setTarget(e.target.value.replace(/[^0-9.]/g, ''))} />
            </div>
            <div>
              <label className={label} htmlFor="he-step">Step (−/+)</label>
              <input id="he-step" className={field} inputMode="decimal" value={step} onChange={e => setStep(e.target.value.replace(/[^0-9.]/g, ''))} />
            </div>
          </div>
        )}

        {errors.length > 0 && <p className="text-[13px] text-rose-300">{errors[0]}</p>}
      </div>
    </Sheet>
  );
};
