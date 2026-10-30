import Dexie, { Table } from 'dexie';
import { Habit, HabitSection, HabitLog, TrackerTemplate, MonthlyRemark, AppSetting } from '../types';
import { TEMPLATES } from '../data/templates';
import { generateSampleData } from '../utils/sampleData';

/** Settings keys (kept in one place so backups and the Settings screen agree). */
export const SETTING = {
  currentTemplateId: 'ui.currentTemplateId',
  showHijri: 'hijri.show',
  hijriOffset: 'hijri.offset',
  knownDefaults: 'defaults.knownIds',
  lastBackupAt: 'backup.lastAt',
  sampleDismissed: 'sample.promptDismissed',
  prayerConfig: 'prayer.config',
  reminders: 'reminders.config',
  weekStart: 'week.start'
} as const;

export class HabitTrackerDatabase extends Dexie {
  templates!: Table<TrackerTemplate, string>;
  sections!: Table<HabitSection, string>;
  habits!: Table<Habit, string>;
  logs!: Table<HabitLog, number>;
  remarks!: Table<MonthlyRemark, number>;
  settings!: Table<AppSetting, string>;

  constructor() {
    // Database name kept for compatibility with existing installs
    super('AegisLocalHabitDB');
    this.version(1).stores({
      templates: 'id',
      sections: 'id, order',
      habits: 'id, sectionId, order, category, inputType',
      logs: '++id, habitId, date, [habitId+date], status, timestamp',
      remarks: '++id, [templateId+monthKey], monthKey'
    });
    this.version(2).stores({
      settings: 'key'
    });
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const row = await this.settings.get(key);
    return row === undefined ? fallback : (row.value as T);
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await this.settings.put({ key, value });
  }

  // ---------------------------------------------------------------------------
  // Built-in templates
  // ---------------------------------------------------------------------------

  /**
   * Make sure the built-in templates exist without ever overwriting the user's copy.
   *
   * - A built-in template that was never installed is added.
   * - A built-in template the user already has is left exactly as they edited it, except that
   *   sections/habits introduced by a later app version are appended once.
   * - Anything the user deleted (template, section or habit) is remembered and never re-added.
   */
  async ensureDefaultTemplates(): Promise<void> {
    await this.transaction('rw', [this.templates, this.sections, this.habits, this.settings], async () => {
      const knownList = await this.getSetting<string[]>(SETTING.knownDefaults, []);
      const known = new Set(knownList);
      const adopting = knownList.length === 0; // first launch with this logic (or a fresh install)

      for (const t of TEMPLATES) {
        const existing = await this.templates.get(t.id);

        if (!existing) {
          if (!adopting && known.has(`t:${t.id}`)) continue; // user deleted this template
          await this.templates.put(t);
          await this.sections.bulkPut(t.sections);
          await this.habits.bulkPut(t.habits);
        } else if (!adopting) {
          // Append only genuinely new built-in items from an app update
          const newSections = t.sections.filter(s => !known.has(`s:${s.id}`) && !existing.sections.some(x => x.id === s.id));
          const newHabits = t.habits.filter(h => !known.has(`h:${h.id}`) && !existing.habits.some(x => x.id === h.id));
          if (newSections.length || newHabits.length) {
            const merged: TrackerTemplate = {
              ...existing,
              sections: [...existing.sections, ...newSections],
              habits: [...existing.habits, ...newHabits]
            };
            await this.templates.put(merged);
            if (newSections.length) await this.sections.bulkPut(newSections);
            if (newHabits.length) await this.habits.bulkPut(newHabits);
          }
        }

        known.add(`t:${t.id}`);
        t.sections.forEach(s => known.add(`s:${s.id}`));
        t.habits.forEach(h => known.add(`h:${h.id}`));
      }

      await this.setSetting(SETTING.knownDefaults, [...known]);
    });
  }

  // ---------------------------------------------------------------------------
  // Sample data (opt-in)
  // ---------------------------------------------------------------------------

  async hasSampleData(): Promise<boolean> {
    return (await this.logs.filter(l => l.sample === true).count()) > 0;
  }

  /** Adds sample logs only on days/habits that have no real entry, so real data is never replaced. */
  async loadSampleData(): Promise<number> {
    const { logs, remarks } = generateSampleData();
    let added = 0;
    await this.transaction('rw', [this.logs, this.remarks], async () => {
      for (const log of logs) {
        const existing = await this.logs.where({ habitId: log.habitId, date: log.date }).first();
        if (!existing) {
          await this.logs.add(log);
          added++;
        }
      }
      for (const r of remarks) {
        const existing = await this.remarks.where({ templateId: r.templateId, monthKey: r.monthKey }).first();
        if (!existing) await this.remarks.add(r);
      }
    });
    return added;
  }

  async removeSampleData(): Promise<number> {
    let removed = 0;
    await this.transaction('rw', [this.logs, this.remarks], async () => {
      removed = await this.logs.filter(l => l.sample === true).delete();
      await this.remarks.filter(r => r.sample === true).delete();
    });
    return removed;
  }

  /**
   * Demo entries written by early test builds (before sample data was tagged). They were bulk-inserted,
   * so hundreds share the same second; real taps never do. Entries the user later edited got a new
   * timestamp and are therefore treated as real and kept.
   */
  async findLegacyDemoIds(): Promise<number[]> {
    const groups = new Map<number, number[]>();
    await this.logs.each(l => {
      if (l.sample || l.id === undefined) return;
      const sec = Math.floor((l.timestamp || 0) / 1000);
      const g = groups.get(sec);
      if (g) g.push(l.id); else groups.set(sec, [l.id]);
    });
    const ids: number[] = [];
    for (const g of groups.values()) if (g.length >= 25) ids.push(...g);
    return ids;
  }

  async removeLegacyDemo(): Promise<number> {
    const ids = await this.findLegacyDemoIds();
    const seededRemarkStarts = ['الحمد لله، feeling steady improvement', 'Completed 3 books this month', 'Night sleep stabilized well', 'Cycle sync tracking has been deeply insightful'];
    await this.transaction('rw', [this.logs, this.remarks], async () => {
      await this.logs.bulkDelete(ids);
      await this.remarks.filter(r => !r.sample && seededRemarkStarts.some(p => r.remarks.startsWith(p))).delete();
    });
    return ids.length;
  }

  /** Permanently deletes every log and monthly reflection (templates and settings stay). */
  async deleteAllEntries(): Promise<void> {
    await this.transaction('rw', [this.logs, this.remarks], async () => {
      await this.logs.clear();
      await this.remarks.clear();
    });
  }
}

export const db = new HabitTrackerDatabase();
