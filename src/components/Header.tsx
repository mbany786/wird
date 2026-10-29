import React from 'react';
import { TrackerTemplate } from '../types';
import { getHijriDate } from '../utils/hijri';
import { 
  ShieldCheck, 
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
  Mail
} from 'lucide-react';

interface HeaderProps {
  currentTemplate: TrackerTemplate;
  templates: TrackerTemplate[];
  onSelectTemplate: (t: TrackerTemplate) => void;
  currentMonth: string; // YYYY-MM
  onMonthChange: (m: string) => void;
  activeView: 'matrix' | 'daily' | 'bi' | 'customize';
  onViewChange: (view: 'matrix' | 'daily' | 'bi' | 'customize') => void;
  onOpenCustomizer: () => void;
  showHijri: boolean;
  onToggleHijri: () => void;
  hijriOffset: number;
  onOffsetChange: (offset: number) => void;
  onExportExcel: () => void;
  onPrintPDF: () => void;
  onEmailReport: () => void;
  onCreateBlankTemplate?: () => void;
}

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
  onCreateBlankTemplate
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Moon': return <Moon className="w-5 h-5 text-emerald-400" />;
      case 'Activity': return <Activity className="w-5 h-5 text-sky-400" />;
      case 'Brain': return <Brain className="w-5 h-5 text-purple-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-amber-400" />;
      case 'Baby': return <Baby className="w-5 h-5 text-pink-400" />;
      case 'HeartPulse': return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'PlusCircle': return <PlusCircle className="w-5 h-5 text-emerald-400" />;
      default: return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const isSpiritualTemplate = currentTemplate.id === 'daily_spiritual_schedule';
  const midMonthHijri = isSpiritualTemplate && showHijri ? getHijriDate(`${currentMonth}-15`, hijriOffset) : null;

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Title and Template Switcher */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-inner">
            {getIcon(currentTemplate.icon)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                {currentTemplate.title}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                {currentTemplate.badge}
              </span>
            </div>
            {isSpiritualTemplate && currentTemplate.urduTitle && (
              <p className="text-xs text-emerald-400 font-medium tracking-wide mt-0.5" dir="rtl">
                {currentTemplate.urduTitle}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="month"
              value={currentMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            />
            {midMonthHijri && (
              <span className="text-[11px] text-emerald-300 font-semibold border-l border-slate-700 pl-2">
                {midMonthHijri.monthName} {midMonthHijri.year} AH
              </span>
            )}
          </div>

          {/* Hijri Calendar Option (Only for Spiritual Schedule) */}
          {isSpiritualTemplate && (
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={onToggleHijri}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-semibold ${
                  showHijri 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Hijri Calendar dates across table and daily views"
              >
                <span>🌙 Hijri</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${showHijri ? 'bg-emerald-800 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  {showHijri ? 'ON' : 'OFF'}
                </span>
              </button>

              {showHijri && (
                <div className="flex items-center gap-0.5 pl-1 pr-1 border-l border-slate-700/80 ml-1">
                  <span className="text-[10px] text-slate-400 mr-1" title="Moon sighting adjustment">Adj:</span>
                  {[-1, 0, 1].map(offset => (
                    <button
                      key={offset}
                      type="button"
                      onClick={() => onOffsetChange(offset)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                        hijriOffset === offset 
                          ? 'bg-emerald-600 text-white' 
                          : 'text-slate-400 hover:bg-slate-700'
                      }`}
                      title={`Hijri sighting adjustment: ${offset > 0 ? '+' : ''}${offset} day`}
                    >
                      {offset > 0 ? `+${offset}` : offset}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Template Switcher Dropdown & Customizer Trigger */}
          <div className="flex items-center gap-1.5">
            <select 
              value={currentTemplate.id}
              onChange={(e) => {
                if (e.target.value === '__NEW_BLANK__') {
                  if (onCreateBlankTemplate) onCreateBlankTemplate();
                } else {
                  const selected = templates.find(t => t.id === e.target.value);
                  if (selected) onSelectTemplate(selected);
                }
              }}
              className="bg-slate-800/90 border border-slate-700/80 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
            >
              <optgroup label="Available Templates">
                {templates.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.title}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Blank & Custom Tracker">
                <option value="__NEW_BLANK__" className="bg-slate-900 text-emerald-400 font-bold">
                  + Create New Blank Template...
                </option>
              </optgroup>
            </select>

            <button
              type="button"
              onClick={onOpenCustomizer}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
              title="Edit template, add custom sections/tasks, or generate habits via prompt"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Customize / Generate</span>
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => onViewChange('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                activeView === 'matrix' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full 31-Day Density Matrix (PDF Layout)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>31-Day Matrix</span>
            </button>

            <button
              onClick={() => onViewChange('daily')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                activeView === 'daily' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Day Focus & Routine Stream"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Daily Routine</span>
            </button>

            <button
              onClick={() => onViewChange('bi')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                activeView === 'bi' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="BI Analytics, Trends & Correlations"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>BI Analytics</span>
            </button>
          </div>

          {/* Customizer Button */}
          <button
            onClick={onOpenCustomizer}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition"
            title="Customize tasks, units, inputs and add custom rows"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Customize</span>
          </button>

          {/* Export & Download Controls (Excel, PDF, Email) */}
          <div className="flex items-center bg-slate-800/90 border border-slate-700/80 p-0.5 rounded-lg text-xs">
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-emerald-400 hover:bg-slate-700 transition"
              title="Download formatted Excel (.xlsx) schedule"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={onPrintPDF}
              className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-sky-400 hover:bg-slate-700 transition"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onEmailReport}
              className="flex items-center gap-1 px-2 py-1 rounded text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition"
              title="Email Monthly Tracking Report"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Email</span>
            </button>
          </div>

          {/* Privacy Pill */}
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-emerald-400/90 bg-emerald-950/60 border border-emerald-900 px-2 py-1 rounded-full font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% On-Device / Local E2EE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
