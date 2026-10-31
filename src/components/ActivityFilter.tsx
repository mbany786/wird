import React from 'react';
import { ChevronDown, ListFilter, X } from 'lucide-react';
import { Habit, HabitSection } from '../types';

/** Filter value: 'all', a section ('sec:<sectionId>') or a single habit id. */
export type ActivityFilterValue = string;

export const ALL_ACTIVITIES = 'all';
export const sectionFilterValue = (sectionId: string) => `sec:${sectionId}`;

/** Habits visible under the given filter (falls back to all when the target no longer exists). */
export function filterHabits(habits: Habit[], filter: ActivityFilterValue): Habit[] {
  if (filter === ALL_ACTIVITIES) return habits;
  if (filter.startsWith('sec:')) {
    const sectionId = filter.slice(4);
    const inSection = habits.filter(h => h.sectionId === sectionId);
    return inSection.length ? inSection : habits;
  }
  const one = habits.filter(h => h.id === filter);
  return one.length ? one : habits;
}

interface ActivityFilterProps {
  habits: Habit[];
  sections: HabitSection[];
  value: ActivityFilterValue;
  onChange: (value: ActivityFilterValue) => void;
  showUrdu?: boolean;
}

export const ActivityFilter: React.FC<ActivityFilterProps> = ({ habits, sections, value, onChange, showUrdu }) => {
  const isFiltered = value !== ALL_ACTIVITIES;
  const visibleCount = filterHabits(habits, value).length;

  const label = (() => {
    if (!isFiltered) return 'All activities';
    if (value.startsWith('sec:')) {
      const sec = sections.find(s => s.id === value.slice(4));
      return sec ? `All ${sec.title}` : 'All activities';
    }
    const h = habits.find(x => x.id === value);
    return h ? h.title : 'All activities';
  })();

  return (
    <div className="flex items-center gap-2">
      {/* Native select sits invisibly over a styled pill: iOS shows its own picker wheel */}
      <div
        className={`relative flex-1 min-w-0 flex items-center gap-2 h-11 px-3.5 rounded-xl border transition ${
          isFiltered ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200' : 'bg-slate-900 border-slate-800 text-slate-200'
        }`}
      >
        <ListFilter className={`w-4 h-4 shrink-0 ${isFiltered ? 'text-emerald-400' : 'text-slate-400'}`} />
        <span className="text-[15px] font-medium truncate">{label}</span>
        {isFiltered && (
          <span className="text-[13px] text-emerald-400/80 tabular-nums shrink-0">
            {visibleCount} of {habits.length}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-auto shrink-0" />
        <select
          aria-label="Filter activities"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          <option value={ALL_ACTIVITIES}>All activities ({habits.length})</option>
          {sections.map(section => {
            const sectionHabits = habits.filter(h => h.sectionId === section.id);
            if (!sectionHabits.length) return null;
            return (
              <optgroup key={section.id} label={section.title}>
                {sectionHabits.length > 1 && (
                  <option value={sectionFilterValue(section.id)}>All {section.title} ({sectionHabits.length})</option>
                )}
                {sectionHabits.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.title}{showUrdu && h.urduTitle ? ` · ${h.urduTitle}` : ''}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      {isFiltered && (
        <button
          type="button"
          onClick={() => onChange(ALL_ACTIVITIES)}
          className="h-11 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[13px] font-semibold text-slate-300 hover:text-slate-100 flex items-center gap-1 shrink-0"
          aria-label="Show all activities"
        >
          <X className="w-4 h-4" />
          <span>All</span>
        </button>
      )}
    </div>
  );
};
