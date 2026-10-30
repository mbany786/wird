import { db, SETTING } from '../db';
import { AppSetting, HabitLog, MonthlyRemark, TrackerTemplate } from '../types';
import { todayStr } from './date';

/**
 * Full backup / restore.
 *
 * File format (JSON):
 * {
 *   "format": "wird-backup", "version": 1, "exportedAt": ISO date,
 *   "data": { "templates": [...], "logs": [...], "remarks": [...], "settings": [...] }
 * }
 * Templates carry their own sections and habits. Logs include notes, custom amounts and Lataif units.
 */

export const BACKUP_FORMAT = 'wird-backup';
export const BACKUP_VERSION = 1;

export interface WirdBackup {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  app: { name: 'Wird' };
  data: {
    templates: TrackerTemplate[];
    logs: HabitLog[];
    remarks: MonthlyRemark[];
    settings: AppSetting[];
  };
}

export interface BackupSummary {
  templates: number;
  habits: number;
  logs: number;
  remarks: number;
  firstDate?: string;
  lastDate?: string;
  exportedAt: string;
}

/** Settings that describe this device rather than the user's data; never restored. */
const DEVICE_ONLY_SETTINGS = new Set<string>([SETTING.knownDefaults, SETTING.lastBackupAt]);

export async function createBackup(): Promise<WirdBackup> {
  const [templates, logs, remarks, settings] = await Promise.all([
    db.templates.toArray(),
    db.logs.toArray(),
    db.remarks.toArray(),
    db.settings.toArray()
  ]);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: { name: 'Wird' },
    data: {
      templates,
      logs: logs.map(({ id: _id, ...rest }) => rest as HabitLog),
      remarks: remarks.map(({ id: _id, ...rest }) => rest as MonthlyRemark),
      settings: settings.filter(s => !DEVICE_ONLY_SETTINGS.has(s.key))
    }
  };
}

export function backupFilename(): string {
  return `Wird-backup-${todayStr()}.json`;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses and validates a backup file. Throws an Error with a user-readable message when invalid. */
export function parseBackup(text: string): { backup: WirdBackup; summary: BackupSummary } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("This file isn't valid JSON, so it can't be a Wird backup.");
  }
  if (!isObj(raw) || raw.format !== BACKUP_FORMAT) {
    throw new Error("This file isn't a Wird backup. (Template files are imported from the Studio instead.)");
  }
  if (typeof raw.version !== 'number' || raw.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of Wird. Update the app, then try again.');
  }
  const data = raw.data;
  if (!isObj(data) || !Array.isArray(data.templates) || !Array.isArray(data.logs)) {
    throw new Error('This backup is incomplete or damaged.');
  }

  const templates = (data.templates as unknown[]).filter(
    (t): t is TrackerTemplate =>
      isObj(t) && typeof t.id === 'string' && typeof t.title === 'string' && Array.isArray(t.sections) && Array.isArray(t.habits)
  );
  const logs = (data.logs as unknown[]).filter(
    (l): l is HabitLog =>
      isObj(l) && typeof l.habitId === 'string' && typeof l.date === 'string' && DATE_RE.test(l.date) && typeof l.status === 'string'
  ).map(l => ({ ...l, timestamp: typeof l.timestamp === 'number' ? l.timestamp : 0 }));
  const remarks = (Array.isArray(data.remarks) ? data.remarks : []).filter(
    (r): r is MonthlyRemark => isObj(r) && typeof r.templateId === 'string' && typeof r.monthKey === 'string' && typeof r.remarks === 'string'
  );
  const settings = (Array.isArray(data.settings) ? data.settings : []).filter(
    (s): s is AppSetting => isObj(s) && typeof s.key === 'string' && !DEVICE_ONLY_SETTINGS.has(s.key)
  );

  if (templates.length === 0 && logs.length === 0) {
    throw new Error('This backup has no templates or entries in it.');
  }

  const dates = logs.map(l => l.date).sort();
  return {
    backup: {
      format: BACKUP_FORMAT,
      version: raw.version,
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      app: { name: 'Wird' },
      data: { templates, logs, remarks, settings }
    },
    summary: {
      templates: templates.length,
      habits: templates.reduce((n, t) => n + t.habits.length, 0),
      logs: logs.length,
      remarks: remarks.length,
      firstDate: dates[0],
      lastDate: dates[dates.length - 1],
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : ''
    }
  };
}

export type RestoreMode = 'merge' | 'replace';

/**
 * merge   — keeps everything on this device and adds the backup's contents. Templates with the same
 *           id are replaced by the backup's version; for the same habit and day the newer entry wins.
 * replace — wipes templates, entries, reflections and settings on this device, then restores the backup.
 */
export async function restoreBackup(backup: WirdBackup, mode: RestoreMode): Promise<void> {
  const { templates, logs, remarks, settings } = backup.data;

  await db.transaction('rw', [db.templates, db.sections, db.habits, db.logs, db.remarks, db.settings], async () => {
    if (mode === 'replace') {
      const keep = await Promise.all([...DEVICE_ONLY_SETTINGS].map(k => db.settings.get(k)));
      await Promise.all([db.templates.clear(), db.sections.clear(), db.habits.clear(), db.logs.clear(), db.remarks.clear(), db.settings.clear()]);
      await db.settings.bulkPut(keep.filter((s): s is AppSetting => !!s));
    }

    for (const t of templates) {
      await db.templates.put(t);
      await db.sections.bulkPut(t.sections);
      await db.habits.bulkPut(t.habits);
    }

    if (mode === 'replace') {
      await db.logs.bulkAdd(logs.map(({ id: _id, ...l }) => l as HabitLog));
      await db.remarks.bulkAdd(remarks.map(({ id: _id, ...r }) => r as MonthlyRemark));
      await db.settings.bulkPut(settings);
    } else {
      for (const { id: _id, ...log } of logs) {
        const existing = await db.logs.where({ habitId: log.habitId, date: log.date }).first();
        if (!existing) await db.logs.add(log as HabitLog);
        else if ((log.timestamp ?? 0) >= (existing.timestamp ?? 0)) await db.logs.put({ ...(log as HabitLog), id: existing.id });
      }
      for (const { id: _id, ...r } of remarks) {
        const existing = await db.remarks.where({ templateId: r.templateId, monthKey: r.monthKey }).first();
        if (!existing) await db.remarks.add(r as MonthlyRemark);
        else if (!existing.remarks.trim()) await db.remarks.put({ ...(r as MonthlyRemark), id: existing.id });
      }
    }
  });
}
