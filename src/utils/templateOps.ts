import { Habit, HabitSection, TrackerTemplate } from '../types';

/** Short unique id with a readable prefix. */
export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Copies a template (or starter routine) with brand-new ids for the template, sections and habits,
 * so its entries never mix with the original's.
 */
export function cloneWithNewIds(
  source: { title: string; urduTitle?: string; description?: string; icon?: string; color?: string; badge?: string; sections: HabitSection[]; habits: Habit[] },
  overrides: Partial<TrackerTemplate> = {}
): TrackerTemplate {
  const id = newId('custom_tracker');
  const sectionMap = new Map<string, string>();
  const sections = source.sections.map((s, i) => {
    const sid = newId('sec');
    sectionMap.set(s.id, sid);
    return { ...s, id: sid, order: i + 1 };
  });
  const habits = source.habits.map((h, i) => ({
    ...h,
    id: newId('habit'),
    sectionId: sectionMap.get(h.sectionId) ?? sections[0]?.id ?? '',
    order: i + 1,
    isCustom: true
  }));
  return {
    id,
    title: source.title,
    urduTitle: source.urduTitle,
    description: source.description ?? '',
    icon: source.icon ?? 'Sparkles',
    color: source.color,
    badge: source.badge ?? 'Custom',
    sections,
    habits,
    ...overrides
  };
}

export function blankTemplate(title = 'My Tracker'): TrackerTemplate {
  const secId = newId('sec');
  return {
    id: newId('custom_tracker'),
    title,
    description: '',
    icon: 'Sparkles',
    color: 'emerald',
    badge: 'Custom',
    sections: [{ id: secId, title: 'Daily', order: 1 }],
    habits: []
  };
}

/** Validates an imported template file; returns a copy with fresh ids so it never collides. */
export function parseTemplateFile(text: string): TrackerTemplate {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error("This file isn't valid JSON."); }
  const t = raw as Partial<TrackerTemplate> & { format?: string };
  if (t && t.format === 'wird-backup') throw new Error('This is a full backup. Restore it from Backup & data instead.');
  if (!t || typeof t.title !== 'string' || !Array.isArray(t.sections) || !Array.isArray(t.habits)) {
    throw new Error("This file isn't a Wird template.");
  }
  return cloneWithNewIds(t as TrackerTemplate, { title: t.title });
}
