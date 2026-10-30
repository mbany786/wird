import React from 'react';
import { ChevronRight, Clock, DatabaseBackup, LayoutTemplate, CircleDot, Moon, CalendarDays, ShieldCheck } from 'lucide-react';
import { Sheet, SheetSection } from './Sheet';

interface SettingsSheetProps {
  showHijri: boolean;
  onToggleHijri: () => void;
  hijriOffset: number;
  onOffsetChange: (n: number) => void;
  weekStart: number;
  onWeekStartChange: (d: number) => void;
  prayerSummary: string;
  remindersOn: boolean;
  templateCount: number;
  lastBackup: string | null;
  onOpenPrayer: () => void;
  onOpenTemplates: () => void;
  onOpenData: () => void;
  onOpenTasbih: () => void;
  onClose: () => void;
}

const Row: React.FC<{ Icon: typeof Clock; label: string; detail?: string; onClick: () => void }> = ({ Icon, label, detail, onClick }) => (
  <button type="button" onClick={onClick} aria-label={label}
    className="w-full flex items-center gap-3 min-h-[56px] text-left active:opacity-70">
    <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-emerald-400" /></span>
    <span className="flex-1 min-w-0">
      <span className="block text-[15px] text-slate-100">{label}</span>
      {detail && <span className="block text-[13px] text-slate-400 truncate">{detail}</span>}
    </span>
    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
  </button>
);

const WEEK_STARTS: [number, string][] = [[1, 'Monday'], [0, 'Sunday'], [6, 'Saturday']];

/** One place for every preference. */
export const SettingsSheet: React.FC<SettingsSheetProps> = (p) => {
  const backupDetail = p.lastBackup
    ? `Last backup ${new Date(p.lastBackup).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'No backup yet';
  return (
    <Sheet title="Settings" subtitle="Everything stays on this device." onClose={p.onClose}>
      <SheetSection title="Tracking">
        <div className="divide-y divide-slate-800/80">
          <Row Icon={LayoutTemplate} label="Templates" detail={`${p.templateCount} template${p.templateCount === 1 ? '' : 's'} · switch, create, import`} onClick={p.onOpenTemplates} />
          <Row Icon={Clock} label="Prayer times & reminders" detail={`${p.prayerSummary} · reminders ${p.remindersOn ? 'on' : 'off'}`} onClick={p.onOpenPrayer} />
          <Row Icon={CircleDot} label="Tasbih counter" detail="Tap to count dhikr into today" onClick={p.onOpenTasbih} />
        </div>
      </SheetSection>

      <SheetSection title="Calendar">
        <button type="button" role="switch" aria-checked={p.showHijri} aria-label="Hijri dates" onClick={p.onToggleHijri}
          className="w-full flex items-center justify-between min-h-[48px] text-left">
          <span className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"><Moon className="w-4 h-4 text-emerald-400" /></span>
            <span className="text-[15px]">Hijri dates</span>
          </span>
          <span className={`w-11 h-6 rounded-full p-0.5 transition ${p.showHijri ? 'bg-emerald-600' : 'bg-slate-700'}`} aria-hidden>
            <span className={`block w-5 h-5 rounded-full bg-white transition ${p.showHijri ? 'translate-x-5' : ''}`} />
          </span>
        </button>
        {p.showHijri && (
          <div className="flex items-center justify-between min-h-[48px] gap-3">
            <span className="text-[15px] text-slate-300 pl-11">Adjust days</span>
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5 shrink-0">
              {[-2, -1, 0, 1, 2].map(offset => (
                <button key={offset} type="button" onClick={() => p.onOffsetChange(offset)}
                  aria-pressed={p.hijriOffset === offset}
                  aria-label={`Hijri adjustment ${offset > 0 ? '+' : ''}${offset} day`}
                  className={`w-9 h-9 rounded-lg text-[13px] font-semibold tabular-nums ${p.hijriOffset === offset ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                  {offset > 0 ? `+${offset}` : offset}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between min-h-[48px] gap-3">
          <span className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center"><CalendarDays className="w-4 h-4 text-emerald-400" /></span>
            <span className="text-[15px]">Week starts on</span>
          </span>
          <select aria-label="Week starts on" value={p.weekStart} onChange={e => p.onWeekStartChange(Number(e.target.value))}
            className="h-10 px-2 rounded-lg bg-slate-950 border border-slate-700 text-[15px]">
            {WEEK_STARTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <p className="text-[13px] text-slate-500">Used for weekly habits and weekly totals.</p>
      </SheetSection>

      <SheetSection title="Your data">
        <Row Icon={DatabaseBackup} label="Backup & data" detail={backupDetail} onClick={p.onOpenData} />
      </SheetSection>

      <SheetSection title="About">
        <p className="flex items-start gap-2 text-[13px] text-slate-400 leading-snug">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          Wird has no account and no servers. Your entries, prayer times and reminders are stored and calculated on this device only.
        </p>
        <p className="text-[13px] text-slate-500 mt-3">
          Wird {__APP_VERSION__} · <a className="text-emerald-400 underline-offset-2 hover:underline" href="mailto:m.anayetullah@gmail.com?subject=Wird%20feedback">Send feedback</a>
        </p>
      </SheetSection>
    </Sheet>
  );
};
