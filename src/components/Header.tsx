import React, { useEffect, useState } from 'react';
import { TrackerTemplate } from '../types';
import { getHijriDate } from '../utils/hijri';
import { TemplateIcon, templateColor } from './templateIcons';
import {
  Calendar,
  LayoutGrid,
  CheckSquare,
  BarChart3,
  SlidersHorizontal,
  FileSpreadsheet,
  Printer,
  Mail,
  ChevronDown,
  Ellipsis,
  CircleDot,
  Settings,
  RotateCcw
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
  hijriOffset: number;
  onExportExcel: () => void;
  onPrintPDF: () => void;
  onEmailReport: () => void;
  onManageTemplates: () => void;
  onOpenSettings: () => void;
  onOpenReset?: () => void;
  onOpenTasbih?: () => void;
}

export const VIEW_TABS: { id: AppView; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'daily', label: 'Today', Icon: CheckSquare },
  { id: 'matrix', label: 'Matrix', Icon: LayoutGrid },
  { id: 'bi', label: 'Analytics', Icon: BarChart3 }
];


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
  hijriOffset,
  onExportExcel,
  onPrintPDF,
  onEmailReport,
  onManageTemplates,
  onOpenSettings,
  onOpenReset,
  onOpenTasbih
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isSpiritualTemplate = currentTemplate.id === 'daily_spiritual_schedule';
  const midMonthHijri = isSpiritualTemplate && showHijri ? getHijriDate(`${currentMonth}-15`, hijriOffset) : null;

  // iOS-style large-title collapse: shrink and tighten the header once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Row 2 (month + Hijri month) duplicates what the Today screen's own date card already
  // shows per-day, so it only earns its place on Matrix/Analytics, which navigate by month.
  const showMonthRow = activeView !== 'daily' && !scrolled;

  const runAndClose = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <header className={`bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 pt-[max(env(safe-area-inset-top),12px)] transition-[padding] ${scrolled ? 'pb-1' : 'pb-2'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Row 1: template title (doubles as switcher) + tabs (tablet/desktop) + actions */}
        <div className={`flex items-center gap-2 transition-[height] ${scrolled ? 'h-9' : 'h-11'}`}>
          <div className={`hidden sm:flex p-2 rounded-xl border border-slate-700/80 shrink-0 transition-opacity ${templateColor(currentTemplate).bg} ${scrolled ? 'opacity-0 w-0 p-0 overflow-hidden border-0' : ''}`}>
            <TemplateIcon template={currentTemplate} />
          </div>

          {/* Title acts as the template picker: a native select sits invisibly on top of it */}
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <div className="flex items-center gap-1 min-w-0 pointer-events-none">
              <h1 className={`font-semibold text-slate-50 truncate transition-[font-size] ${scrolled ? 'text-[15px]' : 'text-[17px]'}`}>
                {currentTemplate.title}
              </h1>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
            <select
              aria-label="Switch tracker template"
              value={currentTemplate.id}
              onChange={(e) => {
                if (e.target.value === '__MANAGE__') {
                  onManageTemplates();
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
              <optgroup label="More">
                <option value="__MANAGE__">Manage templates…</option>
              </optgroup>
            </select>
          </div>

          {!scrolled && (
            <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium shrink-0">
              {currentTemplate.badge}
            </span>
          )}

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
              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition"
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
                  menuOpen ? 'bg-slate-800 text-slate-100' : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
                }`}
                title="Share, Tasbih and Settings"
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
                    {[
                      { label: 'Share as Excel', Icon: FileSpreadsheet, fn: onExportExcel },
                      { label: 'Share monthly chart (PDF)', Icon: Printer, fn: onPrintPDF },
                      { label: 'Email monthly report', Icon: Mail, fn: onEmailReport },
                      ...(onOpenTasbih ? [{ label: 'Tasbih counter', Icon: CircleDot, fn: onOpenTasbih }] : []),
                      ...(onOpenReset ? [{ label: 'Reset entries…', Icon: RotateCcw, fn: onOpenReset }] : []),
                      { label: 'Settings…', Icon: Settings, fn: onOpenSettings }
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

        {/* Row 2: month picker + Hijri month. Hidden on Today (its own date card already
            covers this) and while scrolled, so the header stays out of the way of content. */}
        {showMonthRow && (
          <div className="flex items-center gap-2 mt-1">
            <label className="flex items-center gap-1.5 text-[15px] text-slate-300">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="month"
                value={currentMonth}
                onChange={(e) => e.target.value && onMonthChange(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-medium [color-scheme:dark]"
                aria-label="Month"
              />
            </label>
            {midMonthHijri && (
              <span className="text-[13px] text-slate-500 truncate">
                · {midMonthHijri.monthName} {midMonthHijri.year} AH
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
