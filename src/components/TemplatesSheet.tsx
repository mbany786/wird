import React, { useRef, useState } from 'react';
import { Check, ChevronRight, Copy, FilePlus2, FileUp, Share, Trash2, RotateCcw, LayoutTemplate } from 'lucide-react';
import { Sheet, SheetSection } from './Sheet';
import { TemplateIcon, TEMPLATE_COLORS, TEMPLATE_ICONS, TemplateIconName, templateColor } from './templateIcons';
import { TrackerTemplate } from '../types';
import { STARTER_ROUTINES } from '../data/starterRoutines';
import { blankTemplate, cloneWithNewIds, parseTemplateFile } from '../utils/templateOps';
import { readFileAsText } from '../utils/share';

interface TemplatesSheetProps {
  templates: TrackerTemplate[];
  currentId: string;
  entryCounts: Record<string, number>;
  deletedBuiltIns: TrackerTemplate[];
  onSwitch: (id: string) => void;
  onCreate: (t: TrackerTemplate) => void;
  onUpdate: (t: TrackerTemplate) => void;
  onDelete: (id: string) => void;
  onExport: (t: TrackerTemplate) => void;
  onRestoreBuiltIn: (id: string) => void;
  onClose: () => void;
}

const field = 'w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-[15px] text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500';
const label = 'block text-[13px] font-medium text-slate-400 mb-1';
const btn = 'h-11 px-4 rounded-xl text-[15px] font-semibold transition flex items-center justify-center gap-2';

const TemplateEditor: React.FC<{
  template: TrackerTemplate;
  entryCount: number;
  canDelete: boolean;
  onSave: (t: TrackerTemplate) => void;
  onDuplicate: () => void;
  onExport: () => void;
  onDelete: () => void;
  onBack: () => void;
}> = ({ template, entryCount, canDelete, onSave, onDuplicate, onExport, onDelete, onBack }) => {
  const [title, setTitle] = useState(template.title);
  const [urduTitle, setUrduTitle] = useState(template.urduTitle ?? '');
  const [description, setDescription] = useState(template.description ?? '');
  const [icon, setIcon] = useState(template.icon);
  const [color, setColor] = useState(template.color ?? Object.keys(TEMPLATE_COLORS).find(k => TEMPLATE_COLORS[k] === templateColor(template)) ?? 'emerald');
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="text-[15px] text-emerald-400 font-medium min-h-[36px]">‹ All templates</button>
      <div>
        <label className={label} htmlFor="te-title">Name</label>
        <input id="te-title" className={field} value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div>
        <label className={label} htmlFor="te-urdu">Urdu / Arabic name (optional)</label>
        <input id="te-urdu" dir="rtl" className={`${field} font-arabic`} value={urduTitle} onChange={e => setUrduTitle(e.target.value)} />
      </div>
      <div>
        <label className={label} htmlFor="te-desc">Description (optional)</label>
        <input id="te-desc" className={field} value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <span className={label}>Colour</span>
        <div className="flex gap-2" role="radiogroup" aria-label="Colour">
          {Object.entries(TEMPLATE_COLORS).map(([key, c]) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={color === key}
              aria-label={key}
              onClick={() => setColor(key)}
              className={`w-10 h-10 rounded-full ${c.swatch} flex items-center justify-center ring-offset-2 ring-offset-slate-900 ${color === key ? 'ring-2 ring-white' : ''}`}
            >
              {color === key && <Check className="w-5 h-5 text-slate-950" />}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className={label}>Icon</span>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5" role="radiogroup" aria-label="Icon">
          {(Object.keys(TEMPLATE_ICONS) as TemplateIconName[]).map(name => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={icon === name}
              aria-label={name}
              onClick={() => setIcon(name)}
              className={`h-11 rounded-xl flex items-center justify-center border ${icon === name ? `border-transparent ${TEMPLATE_COLORS[color].bg} ring-2 ${TEMPLATE_COLORS[color].ring}` : 'border-slate-800 bg-slate-950'}`}
            >
              <TemplateIcon template={{ icon: name, color }} />
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={!title.trim()}
        onClick={() => onSave({ ...template, title: title.trim(), urduTitle: urduTitle.trim() || undefined, description: description.trim(), icon, color })}
        className={`${btn} w-full bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50`}
      >
        Save
      </button>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onDuplicate} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-100`}>
          <Copy className="w-4 h-4" /> Duplicate
        </button>
        <button type="button" onClick={onExport} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-100`}>
          <Share className="w-4 h-4" /> Share file
        </button>
      </div>

      {canDelete && (
        <div className="rounded-2xl border border-rose-900/70 bg-rose-950/20 p-3">
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className={`${btn} w-full text-rose-300 hover:bg-rose-950/40`}>
              <Trash2 className="w-4 h-4" /> Delete template…
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-[13px] text-rose-200">
                This deletes “{template.title}”, its {template.habits.length} habits
                {entryCount ? ` and ${entryCount.toLocaleString()} logged entries` : ''}. Back up first if you might want them.
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={onDelete} className={`${btn} flex-1 bg-rose-700 text-white`}>Delete permanently</button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={`${btn} bg-slate-800 text-slate-200`}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const TemplatesSheet: React.FC<TemplatesSheetProps> = ({
  templates, currentId, entryCounts, deletedBuiltIns, onSwitch, onCreate, onUpdate, onDelete, onExport, onRestoreBuiltIn, onClose
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showStarters, setShowStarters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editing = templates.find(t => t.id === editingId);

  const create = (t: TrackerTemplate) => { onCreate(t); onClose(); };

  if (editing) {
    return (
      <Sheet title="Edit template" onClose={onClose}>
        <TemplateEditor
          template={editing}
          entryCount={entryCounts[editing.id] ?? 0}
          canDelete={templates.length > 1}
          onBack={() => setEditingId(null)}
          onSave={(t) => { onUpdate(t); setEditingId(null); }}
          onDuplicate={() => create(cloneWithNewIds(editing, { title: `${editing.title} (copy)` }))}
          onExport={() => onExport(editing)}
          onDelete={() => { onDelete(editing.id); setEditingId(null); }}
        />
      </Sheet>
    );
  }

  return (
    <Sheet title="Templates" subtitle="Each template is its own tracker with its own habits and history." onClose={onClose}>
      {error && <p role="alert" className="text-[13px] text-rose-300 bg-rose-950/50 border border-rose-900 rounded-xl px-3 py-2">{error}</p>}

      <div className="space-y-2">
        {templates.map(t => {
          const active = t.id === currentId;
          return (
            <div key={t.id} className={`flex items-center rounded-2xl border ${active ? 'border-emerald-700 bg-emerald-950/30' : 'border-slate-800 bg-slate-950/60'}`}>
              <button
                type="button"
                onClick={() => { onSwitch(t.id); onClose(); }}
                className="flex-1 min-w-0 flex items-center gap-3 p-3 text-left"
                aria-label={`Use ${t.title}`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${templateColor(t).bg}`}>
                  <TemplateIcon template={t} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-slate-100 truncate">{t.title}</span>
                  <span className="block text-[13px] text-slate-400">
                    {t.habits.length} habits{entryCounts[t.id] ? ` · ${entryCounts[t.id].toLocaleString()} entries` : ''}{active ? ' · in use' : ''}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEditingId(t.id)}
                className="h-11 px-3 mr-1 rounded-xl text-[13px] font-semibold text-emerald-300 hover:bg-slate-800 flex items-center gap-0.5 shrink-0"
                aria-label={`Edit ${t.title}`}
              >
                Edit <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <SheetSection title="New template">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => create(blankTemplate())} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-100`}>
            <FilePlus2 className="w-4 h-4" /> Blank
          </button>
          <button type="button" onClick={() => setShowStarters(s => !s)} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-100`} aria-expanded={showStarters}>
            <LayoutTemplate className="w-4 h-4" /> Starter…
          </button>
          <button
            type="button"
            onClick={() => { const cur = templates.find(t => t.id === currentId); if (cur) create(cloneWithNewIds(cur, { title: `${cur.title} (copy)` })); }}
            className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-100`}
          >
            <Copy className="w-4 h-4" /> Copy current
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={`${btn} bg-slate-800 hover:bg-slate-700 text-slate-100`}>
            <FileUp className="w-4 h-4" /> Import file
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Choose template file"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try {
              setError(null);
              create(parseTemplateFile(await readFileAsText(f)));
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        />
        {showStarters && (
          <div className="mt-3 space-y-2">
            {STARTER_ROUTINES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => create(cloneWithNewIds({ ...r, icon: 'Target', color: 'sky' }, { title: r.title, badge: r.badge }))}
                className="w-full text-left rounded-xl border border-slate-800 bg-slate-900 hover:border-slate-700 p-3"
              >
                <span className="block text-[15px] font-semibold text-slate-100">{r.title}</span>
                <span className="block text-[13px] text-slate-400 mt-0.5">{r.description}</span>
                <span className="block text-[12px] text-slate-500 mt-1">{r.habits.length} habits in {r.sections.length} sections</span>
              </button>
            ))}
          </div>
        )}
      </SheetSection>

      {deletedBuiltIns.length > 0 && (
        <SheetSection title="Deleted built-in templates" description="Bring back a built-in template you removed. It starts with its original habits.">
          <div className="space-y-2">
            {deletedBuiltIns.map(t => (
              <button key={t.id} type="button" onClick={() => onRestoreBuiltIn(t.id)} className={`${btn} w-full justify-start bg-slate-800 hover:bg-slate-700 text-slate-100`}>
                <RotateCcw className="w-4 h-4" /> Restore {t.title}
              </button>
            ))}
          </div>
        </SheetSection>
      )}
    </Sheet>
  );
};
