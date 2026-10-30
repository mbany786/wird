import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Sheet } from './Sheet';
import { Habit, HabitSection, TrackerTemplate } from '../types';

interface StudioSheetProps {
  template: TrackerTemplate;
  entryCountByHabit: Record<string, number>;
  onAddHabit: (sectionId: string) => void;
  onEditHabit: (habit: Habit) => void;
  onMoveHabit: (habitId: string, direction: -1 | 1) => void;
  onAddSection: (title: string, urduTitle?: string) => void;
  onRenameSection: (sectionId: string, title: string, urduTitle?: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onDeleteSection: (sectionId: string) => void;
  onClose: () => void;
}

export function describeHabit(h: Habit): string {
  const kind =
    h.category === 'NEGATIVE_ABSTINENCE'
      ? `To avoid${h.inputType === 'DURATION' ? ' · minutes' : h.unit ? ` · ${h.unit}` : ''}`
      : h.inputType === 'BOOLEAN' ? 'Done / not done'
      : h.multiStates?.some(s => s.code === 'TAKBEER_OOLA') ? 'Prayer quality'
      : h.inputType === 'MULTI_STATE' || h.inputType === 'SLOT' ? (h.multiStates?.length ? h.multiStates.map(s => s.label.split(' (')[0]).slice(0, 3).join(' / ') + (h.multiStates.length > 3 ? '…' : '') : 'States')
      : h.inputType === 'DURATION' ? `Minutes${h.targetValue ? ` · goal ${h.targetValue}` : ''}`
      : h.inputType === 'LATAIF' ? 'Count or minutes'
      : `${h.unit || 'Number'}${h.targetValue ? ` · goal ${h.targetValue}` : ''}`;
  const cadence = h.cadence === 'FRIDAY_ONLY' ? ' · Fridays' : h.cadence === 'WEEKLY_ONCE' ? ' · weekly' : '';
  return kind + cadence;
}

const iconBtn = 'w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-25';

const SectionHeader: React.FC<{
  section: HabitSection;
  index: number;
  count: number;
  habitCount: number;
  onRename: (title: string, urdu?: string) => void;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
}> = ({ section, index, count, habitCount, onRename, onMove, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [urdu, setUrdu] = useState(section.urduTitle ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (editing) {
    return (
      <div className="space-y-2 rounded-xl bg-slate-950 border border-slate-800 p-2.5">
        <input aria-label="Section name" className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-[15px]" value={title} onChange={e => setTitle(e.target.value)} />
        <input aria-label="Section Urdu name" dir="rtl" placeholder="اردو نام (اختیاری)" className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-[15px] font-arabic" value={urdu} onChange={e => setUrdu(e.target.value)} />
        <div className="flex gap-2 justify-end">
          <button type="button" className="h-10 px-3 rounded-lg bg-slate-800 text-[15px]" onClick={() => setEditing(false)}>Cancel</button>
          <button type="button" disabled={!title.trim()} className="h-10 px-4 rounded-lg bg-emerald-600 text-white text-[15px] font-semibold disabled:opacity-50" onClick={() => { onRename(title.trim(), urdu.trim() || undefined); setEditing(false); }}>Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <h3 className="text-[15px] font-semibold text-emerald-400 truncate">{section.title}</h3>
        {section.urduTitle && <span className="text-[13px] text-emerald-300/70 font-arabic shrink-0" dir="rtl">{section.urduTitle}</span>}
      </div>
      {confirmDelete ? (
        <>
          <button type="button" className="h-9 px-2.5 rounded-lg bg-rose-700 text-white text-[13px] font-semibold" onClick={onDelete}>
            Delete{habitCount ? ` with ${habitCount} habits` : ''}
          </button>
          <button type="button" className={iconBtn} aria-label="Cancel" onClick={() => setConfirmDelete(false)}><X className="w-4 h-4" /></button>
        </>
      ) : (
        <>
          <button type="button" className={iconBtn} disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move section ${section.title} up`}><ChevronUp className="w-4 h-4" /></button>
          <button type="button" className={iconBtn} disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Move section ${section.title} down`}><ChevronDown className="w-4 h-4" /></button>
          <button type="button" className={iconBtn} onClick={() => setEditing(true)} aria-label={`Rename section ${section.title}`}><Pencil className="w-4 h-4" /></button>
          <button type="button" className={iconBtn} disabled={count === 1} onClick={() => setConfirmDelete(true)} aria-label={`Delete section ${section.title}`}><Trash2 className="w-4 h-4" /></button>
        </>
      )}
    </div>
  );
};

export const StudioSheet: React.FC<StudioSheetProps> = ({
  template, entryCountByHabit, onAddHabit, onEditHabit, onMoveHabit, onAddSection, onRenameSection, onMoveSection, onDeleteSection, onClose
}) => {
  const [newSection, setNewSection] = useState('');
  const sections = [...template.sections].sort((a, b) => a.order - b.order);

  return (
    <Sheet title="Studio" subtitle={`Sections and habits of “${template.title}”`} onClose={onClose} wide>
      {sections.map((section, i) => {
        const list = template.habits.filter(h => h.sectionId === section.id);
        return (
          <section key={section.id} className="space-y-2" aria-label={section.title}>
            <SectionHeader
              section={section}
              index={i}
              count={sections.length}
              habitCount={list.length}
              onRename={(t, u) => onRenameSection(section.id, t, u)}
              onMove={(d) => onMoveSection(section.id, d)}
              onDelete={() => onDeleteSection(section.id)}
            />
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/70">
              {list.map((h, idx) => (
                <div key={h.id} className="flex items-center gap-1 pl-3 pr-1 min-h-[56px]">
                  <button type="button" onClick={() => onEditHabit(h)} className="flex-1 min-w-0 text-left py-2" aria-label={`Edit ${h.title}`}>
                    <span className="flex items-baseline gap-2 min-w-0">
                      <span className="text-[15px] font-medium text-slate-100 truncate">{h.title}</span>
                      {h.urduTitle && <span className="text-[13px] text-emerald-400/70 font-arabic truncate" dir="rtl">{h.urduTitle}</span>}
                    </span>
                    <span className="block text-[13px] text-slate-400 truncate">
                      {describeHabit(h)}
                      {entryCountByHabit[h.id] ? ` · ${entryCountByHabit[h.id]} entries` : ''}
                    </span>
                  </button>
                  <button type="button" className={iconBtn} disabled={idx === 0} onClick={() => onMoveHabit(h.id, -1)} aria-label={`Move ${h.title} up`}><ChevronUp className="w-4 h-4" /></button>
                  <button type="button" className={iconBtn} disabled={idx === list.length - 1} onClick={() => onMoveHabit(h.id, 1)} aria-label={`Move ${h.title} down`}><ChevronDown className="w-4 h-4" /></button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onAddHabit(section.id)}
                className="w-full flex items-center gap-2 px-3 min-h-[48px] text-[15px] font-medium text-emerald-400 hover:bg-slate-900/60 rounded-b-2xl"
              >
                <Plus className="w-4 h-4" /> Add habit to {section.title}
              </button>
            </div>
          </section>
        );
      })}

      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); if (newSection.trim()) { onAddSection(newSection.trim()); setNewSection(''); } }}
      >
        <input
          aria-label="New section name"
          placeholder="New section name"
          className="flex-1 h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-[15px]"
          value={newSection}
          onChange={e => setNewSection(e.target.value)}
        />
        <button type="submit" disabled={!newSection.trim()} className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-[15px] font-semibold disabled:opacity-50 flex items-center gap-1.5">
          <Check className="w-4 h-4" /> Add section
        </button>
      </form>
    </Sheet>
  );
};
