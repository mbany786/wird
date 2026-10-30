import React, { useState } from 'react';
import { TrackerTemplate } from '../types';
import { getHijriDate } from '../utils/hijri';
import {
  Calendar,
  LayoutGrid,
  CheckSquare,
  BarChart3,
  SlidersHorizontal,
  Moon,
  Activity,
  Brain,
  BookOpen,
  Baby,
  HeartPulse,
  Sparkles,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Mail,
  ChevronDown,
  Ellipsis,
  DatabaseBackup
} from 'lucide-react';

export type AppView = 'matrix' | 'daily' | 'bi' | 'customize';

interface HeaderProps {
  currentTemplate: TrackerTemplate;
  templates: TrackerTemplate[];
  onSelectTemplate: (t: TrackerTemplate) => void;
  currentMonth: string; // YYYY-MM
  onMonthChange: (m: string) => void;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenCustomizer: () => void;
  showHijri: boolean;
  onToggleHijri: () => void;
  hijriOffset: number;
  onOffsetChange: (offset: number) => void;
  onExportExcel: () => void;
  onPrintPDF: () => void;
  onEmailReport: () => void;
  onCreateBlankTemplate?: () => void;
  onOpenData: () => void;
}

export const VIEW_TABS: { id: AppView; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'matrix', label: 'Matrix', Icon: LayoutGrid },
  { id: 'daily', label: 'Daily', Icon: CheckSquare },
  { id: 'bi', label: 'Analytics', Icon: BarChart3 }
];

const getIcon = (iconName: string) => {
  const cls = 'w-5 h-5';
  switch (iconName) {
    case 'Moon': return <Moon className={`${cls} text-emerald-400`} />;
    case 'Activity': return <Activity className={`${cls} text-sky-400`} />;
    case 'Brain': return <Brain className={`${cls} text-purple-400`} />;
    case 'BookOpen': return <BookOpen className={`${cls} text-amber-400`} />;
    case 'Baby': return <Baby className={`${cls} text-pink-400`} />;
    case 'HeartPulse': return <HeartPulse className={`${cls} text-rose-400`} />;
    case 'PlusCircle': return <PlusCircle className={`${cls} text-emerald-400`} />;
    default: return <Sparkles className={`${cls} text-emerald-400`} />;
  }
};

export const Header: React.FC<HeaderProps> = ({
  currentTemplate,
  templates,
  onSelectTemplate,
  currentMonth,
  onMonthChange,
  activeView,
  onViewChange,
  onOpenCustomizer,
  showHijri,
  onToggleHijri,
  hijriOffset,
  onOffsetChange,
  onExportExcel,
  onPrintPDF,
  onEmailReport,
  onCreateBlankTemplate,
  onOpenData
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSpiritualTemplate = currentTemplate.id === 'daily_spiritual_schedule';
  const midMonthHijri = isSpiritualTemplate && showHijri ? getHijriDate(`${currentMonth}-15`, hijriOffset) : null;

  const runAndClose = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
      <div className="max-w-7xl mx-auto">
        {/* Row 1: template title (doubles as switcher) + tabs (tablet/desktop) + actions */}
        <div className="flex items-center gap-2 h-11">
          <div className="hidden sm:flex p-2 rounded-xl bg-slate-800/90 border border-slate-700/80 shrink-0">
            {getIcon(currentTemplate.icon)}
          </div>

          {/* Title acts as the template picker: a native select sits invisibly on top of it */}
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <div className="flex items-center gap-1 min-w-0 pointer-events-none">
              <h1 className="text-[17px] font-semibold text-slate-50 truncate">
                {currentTemplate.title}
              </h1>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <select
              aria-label="Switch tracker template"
              value={currentTemplate.id}
              onChange={(e) => {
                if (e.target.value === '__NEW_BLANK__') {
                  onCreateBlankTemplate?.();
                } else {
                  const selected = templates.find(t => t.id === e.target.value);
                  if (selected) onSelectTemplate(selected);
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <optgroup label="Templates">
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </optgroup>
              <optgroup label="New">
                <option value="__NEW_BLANK__">+ Create blank template…</option>
              </optgroup>
            </select>
          </div>

          <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium shrink-0">
            {currentTemplate.badge}
          </span>

          {/* View tabs (iPad / desktop). iPhone uses the bottom tab bar instead. */}
          <nav className="hidden sm:flex ml-auto bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[13px]">
            {VIEW_TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition font-medium ${
                  activeView === id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1 ml-auto sm:ml-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCustomizer}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Template Studio: edit sections and tasks"
              aria-label="Open Template Studio"
            >
              <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                className={`relative z-50 w-10 h-10 flex items-center justify-center rounded-xl transition ${
                  menuOpen ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="More: Hijri settings and export"
                aria-label="More options"
                aria-expanded={menuOpen}
              >
                <Ellipsis className="w-5 h-5" />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-1.5 text-[15px]">
                    {isSpiritualTemplate && (
                      <div className="px-2.5 py-2 border-b border-slate-800 mb-1">
                        <button
                          type="button"
                          onClick={onToggleHijri}
                          className="w-full flex items-center justify-between min-h-[40px]"
                        >
                          <span className="flex items-center gap-2.5 text-slate-200">
                            <Moon className="w-4 h-4 text-emerald-400" />
                            Hijri dates
                          </span>
                          <span
                            className={`w-11 h-6 rounded-full p-0.5 transition ${showHijri ? 'bg-emerald-600' : 'bg-slate-700'}`}
                            aria-hidden
                          >
                            <span className={`block w-5 h-5 rounded-full bg-white transition ${showHijri ? 'translate-x-5' : ''}`} />
                          </span>
                        </button>

                        {showHijri && (
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[13px] text-slate-400">Moon-sighting adjustment</span>
                            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                              {[-1, 0, 1].map(offset => (
                                <button
                                  key={offset}
                                  type="button"
                                  onClick={() => onOffsetChange(offset)}
                                  className={`w-9 h-8 rounded-md text-[13px] font-semibold tabular-nums transition ${
                                    hijriOffset === offset ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                                  }`}
                                  aria-label={`Hijri adjustment ${offset > 0 ? '+' : ''}${offset} day`}
                                >
                                  {offset > 0 ? `+${offset}` : offset}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {[
                      { label: 'Export to Excel', Icon: FileSpreadsheet, fn: onExportExcel },
                      { label: 'Print or save PDF', Icon: Printer, fn: onPrintPDF },
                      { label: 'Email monthly report', Icon: Mail, fn: onEmailReport },
                      { label: 'Backup & data…', Icon: DatabaseBackup, fn: onOpenData }
                    ].map(({ label, Icon, fn }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={runAndClose(fn)}
                        className="w-full flex items-center gap-2.5 px-2.5 min-h-[44px] rounded-xl text-slate-200 hover:bg-slate-800 transition text-left"
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: month picker + Hijri month */}
        <div className="flex items-center gap-2 mt-1">
          <label className="flex items-center gap-1.5 text-[15px] text-slate-300">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => e.target.value && onMonthChange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium"
              aria-label="Month"
            />
          </label>
          {midMonthHijri && (
            <span className="text-[13px] text-emerald-400/90 truncate">
              · {midMonthHijri.monthName} {midMonthHijri.year} AH
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
