import React, { useEffect, useRef, useState } from 'react';
import { DatabaseBackup, FileUp, FlaskConical, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Sheet, SheetSection } from './Sheet';
import { db, SETTING } from '../db';
import { backupFilename, BackupSummary, createBackup, parseBackup, restoreBackup, RestoreMode, WirdBackup } from '../utils/backup';
import { readFileAsText, shareFile } from '../utils/share';

interface DataSheetProps {
  onClose: () => void;
  /** Called after anything that changes stored data, so the app reloads it */
  onDataChanged: () => Promise<void> | void;
}

const btn = 'h-11 px-4 rounded-xl text-[15px] font-semibold transition disabled:opacity-50';
const primary = `${btn} bg-emerald-600 hover:bg-emerald-500 text-white`;
const secondary = `${btn} bg-slate-800 hover:bg-slate-700 text-slate-100`;
const danger = `${btn} bg-rose-700 hover:bg-rose-600 text-white`;

const fmtDate = (iso?: string) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const DataSheet: React.FC<DataSheetProps> = ({ onClose, onDataChanged }) => {
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [hasSample, setHasSample] = useState(false);
  const [legacyCount, setLegacyCount] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [pending, setPending] = useState<{ backup: WirdBackup; summary: BackupSummary } | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLastBackup(await db.getSetting<string | null>(SETTING.lastBackupAt, null));
    setHasSample(await db.hasSampleData());
    setLegacyCount((await db.findLegacyDemoIds()).length);
  };
  useEffect(() => { refresh(); }, []);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setNotice({ tone: 'error', text: (e as Error).message || 'Something went wrong.' });
    } finally {
      setBusy(null);
    }
  };

  const handleBackup = () =>
    run('backup', async () => {
      const backup = await createBackup();
      const result = await shareFile({
        filename: backupFilename(),
        data: JSON.stringify(backup, null, 1),
        mimeType: 'application/json',
        title: 'Wird backup'
      });
      if (result === 'cancelled') return;
      const now = new Date().toISOString();
      await db.setSetting(SETTING.lastBackupAt, now);
      setLastBackup(now);
      setNotice({
        tone: 'ok',
        text: `Backup ready: ${backup.data.logs.length.toLocaleString()} entries across ${backup.data.templates.length} templates.`
      });
    });

  const handlePickFile = async (file?: File) => {
    if (!file) return;
    await run('read', async () => {
      const text = await readFileAsText(file);
      setPending(parseBackup(text));
      setConfirmReplace(false);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRestore = (mode: RestoreMode) =>
    run(`restore-${mode}`, async () => {
      if (!pending) return;
      await restoreBackup(pending.backup, mode);
      setPending(null);
      setConfirmReplace(false);
      await onDataChanged();
      await refresh();
      setNotice({ tone: 'ok', text: mode === 'replace' ? 'Backup restored. This device now matches the backup.' : 'Backup merged into your data.' });
    });

  const handleSample = () =>
    run('sample', async () => {
      if (hasSample) {
        const n = await db.removeSampleData();
        setNotice({ tone: 'ok', text: `Removed ${n.toLocaleString()} sample entries. Your own entries were not touched.` });
      } else {
        const n = await db.loadSampleData();
        setNotice({ tone: 'ok', text: `Added ${n.toLocaleString()} sample entries for last month and this month.` });
      }
      await onDataChanged();
      await refresh();
    });

  const handleRemoveLegacy = () =>
    run('legacy', async () => {
      const n = await db.removeLegacyDemo();
      await onDataChanged();
      await refresh();
      setNotice({ tone: 'ok', text: `Removed ${n.toLocaleString()} demo entries from test builds. Entries you made or edited were kept.` });
    });

  const handleDeleteAll = () =>
    run('delete', async () => {
      await db.deleteAllEntries();
      setConfirmDeleteAll(false);
      await onDataChanged();
      await refresh();
      setNotice({ tone: 'ok', text: 'All entries and reflections were deleted. Your templates are still here.' });
    });

  return (
    <Sheet title="Backup & data" subtitle="Everything stays on this device unless you share a backup." onClose={onClose}>
      {notice && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px] ${
            notice.tone === 'ok' ? 'bg-emerald-950/60 text-emerald-200 border border-emerald-800' : 'bg-rose-950/60 text-rose-200 border border-rose-800'
          }`}
        >
          {notice.tone === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      <SheetSection
        title="Back up"
        description="Saves all templates, entries, notes, amounts and reflections to one file. Keep it in Files or iCloud Drive, or AirDrop it to another device."
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-slate-400">{lastBackup ? `Last backup ${fmtDate(lastBackup)}` : 'No backup yet'}</span>
          <button type="button" className={`${primary} flex items-center gap-2`} onClick={handleBackup} disabled={!!busy}>
            <DatabaseBackup className="w-4 h-4" />
            {busy === 'backup' ? 'Preparing…' : 'Back up now'}
          </button>
        </div>
      </SheetSection>

      <SheetSection title="Restore" description="Open a Wird backup file. You'll see what's in it before anything changes.">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => handlePickFile(e.target.files?.[0])}
          aria-label="Choose backup file"
        />
        {!pending ? (
          <button type="button" className={`${secondary} flex items-center gap-2`} onClick={() => fileRef.current?.click()} disabled={!!busy}>
            <FileUp className="w-4 h-4" />
            {busy === 'read' ? 'Reading…' : 'Choose backup file…'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 text-[13px] text-slate-300 space-y-0.5">
              <p className="text-[15px] font-semibold text-slate-100">Backup from {fmtDate(pending.summary.exportedAt) || 'unknown date'}</p>
              <p>
                {pending.summary.templates} templates · {pending.summary.habits} habits · {pending.summary.logs.toLocaleString()} entries
                {pending.summary.remarks ? ` · ${pending.summary.remarks} reflections` : ''}
              </p>
              {pending.summary.firstDate && (
                <p>
                  Entries from {fmtDate(pending.summary.firstDate)} to {fmtDate(pending.summary.lastDate)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button type="button" className={primary} onClick={() => handleRestore('merge')} disabled={!!busy}>
                {busy === 'restore-merge' ? 'Merging…' : 'Merge with this device'}
              </button>
              <p className="text-[12px] text-slate-500 -mt-1 px-1">Keeps your data and adds the backup's; for the same habit and day, the newer entry wins.</p>
              {!confirmReplace ? (
                <button type="button" className={secondary} onClick={() => setConfirmReplace(true)} disabled={!!busy}>
                  Replace everything on this device…
                </button>
              ) : (
                <button type="button" className={danger} onClick={() => handleRestore('replace')} disabled={!!busy}>
                  {busy === 'restore-replace' ? 'Restoring…' : 'Tap again to erase this device and restore'}
                </button>
              )}
              <button type="button" className="h-10 text-[13px] text-slate-400" onClick={() => { setPending(null); setConfirmReplace(false); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </SheetSection>

      <SheetSection
        title="Sample data"
        description={
          hasSample
            ? 'Sample entries are loaded so you can explore the Matrix and Analytics. Removing them leaves your own entries untouched.'
            : 'Fill last month and this month with realistic example entries to explore the app. Days you already logged are skipped, and you can remove the samples at any time.'
        }
      >
        <button type="button" className={`${secondary} flex items-center gap-2`} onClick={handleSample} disabled={!!busy}>
          <FlaskConical className="w-4 h-4" />
          {busy === 'sample' ? 'Working…' : hasSample ? 'Remove sample data' : 'Load sample data'}
        </button>
        {legacyCount > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <p className="text-[13px] text-slate-400 leading-snug">
              Found {legacyCount.toLocaleString()} demo entries added automatically by earlier test builds. Entries you logged or edited yourself
              are not included.
            </p>
            <button type="button" className={`${secondary} mt-2`} onClick={handleRemoveLegacy} disabled={!!busy}>
              {busy === 'legacy' ? 'Removing…' : 'Remove test-build demo entries'}
            </button>
          </div>
        )}
      </SheetSection>

      <SheetSection title="Delete all entries" tone="danger" description="Erases every logged entry and reflection on this device. Templates and settings stay. Back up first if you might want them later.">
        {!confirmDeleteAll ? (
          <button type="button" className={`${secondary} flex items-center gap-2 text-rose-300`} onClick={() => setConfirmDeleteAll(true)} disabled={!!busy}>
            <Trash2 className="w-4 h-4" />
            Delete all entries…
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={danger} onClick={handleDeleteAll} disabled={!!busy}>
              {busy === 'delete' ? 'Deleting…' : 'Delete everything permanently'}
            </button>
            <button type="button" className={secondary} onClick={() => setConfirmDeleteAll(false)}>
              Cancel
            </button>
          </div>
        )}
      </SheetSection>
    </Sheet>
  );
};
