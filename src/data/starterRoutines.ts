import { CadenceType, Habit, HabitInputType, HabitSection } from '../types';

/** Curated starter routines. Creating a template from one copies it with fresh ids. */
export interface StarterRoutine {
  id: string;
  title: string;
  badge: string;
  description: string;
  sections: HabitSection[];
  habits: Habit[];
}

export const STARTER_ROUTINES: StarterRoutine[] = [
  {
    id: 'student',
    title: 'Student & Academic Excellence',
    badge: 'Academics',
    description: 'Lecture attendance, textbook reading, problem sets, spaced repetition review, and sleep hygiene.',
    sections: [
      { id: 'sec_study', title: 'Deep Study & Lectures', order: 1 },
      { id: 'sec_review', title: 'Retention & Spaced Repetition', order: 2 },
      { id: 'sec_wellness', title: 'Mental Energy & Rest', order: 3 }
    ],
    habits: [
      { id: 'attend_classes', sectionId: 'sec_study', title: 'Attend All Scheduled Lectures', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 1, isCustom: true },
      { id: 'textbook_reading', sectionId: 'sec_study', title: 'Textbook / Core Reading', inputType: 'QUANTITY' as HabitInputType, unit: 'pages', targetValue: 30, step: 5, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 2, isCustom: true },
      { id: 'deep_problem_sets', sectionId: 'sec_study', title: 'Problem Sets & Coding Labs', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 120, step: 30, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 3, isCustom: true },
      { id: 'anki_flashcards', sectionId: 'sec_review', title: 'Anki / Flashcard Spaced Repetition', inputType: 'QUANTITY' as HabitInputType, unit: 'cards', targetValue: 50, step: 10, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 4, isCustom: true },
      { id: 'summary_notes', sectionId: 'sec_review', title: 'Lecture Cornell Notes Review', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 5, isCustom: true },
      { id: 'exam_sleep', sectionId: 'sec_wellness', title: 'Sleep 8 Hours Nightly', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 6, isCustom: true },
      { id: 'no_procrastination', sectionId: 'sec_wellness', title: 'No Social Media During Study Blocks', inputType: 'BOOLEAN' as HabitInputType, category: 'NEGATIVE_ABSTINENCE' as const, cadence: 'DAILY' as CadenceType, order: 7, isCustom: true }
    ]
  },
  {
    id: 'athlete',
    title: 'Marathon & Athlete Conditioning',
    badge: 'Athletics',
    description: 'Running distance, Zone 2 endurance, mobility drills, protein targets, and recovery.',
    sections: [
      { id: 'sec_endurance', title: 'Running & Cardio Output', order: 1 },
      { id: 'sec_strength', title: 'Strength, Core & Mobility', order: 2 },
      { id: 'sec_nutrition_rec', title: 'Nutrition & Recovery', order: 3 }
    ],
    habits: [
      { id: 'running_distance', sectionId: 'sec_endurance', title: 'Road / Trail Running', inputType: 'QUANTITY' as HabitInputType, unit: 'km', targetValue: 8, step: 1, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 1, isCustom: true },
      { id: 'zone2_cardio', sectionId: 'sec_endurance', title: 'Zone 2 Base Aerobic', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 45, step: 15, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 2, isCustom: true },
      { id: 'core_strength', sectionId: 'sec_strength', title: 'Core Strength & Calisthenics', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 30, step: 10, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 3, isCustom: true },
      { id: 'mobility_stretch', sectionId: 'sec_strength', title: 'Foam Rolling & Mobility', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 20, step: 5, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 4, isCustom: true },
      { id: 'hydration_athlete', sectionId: 'sec_nutrition_rec', title: 'Electrolyte & Water Intake', inputType: 'QUANTITY' as HabitInputType, unit: 'ml', targetValue: 3500, step: 250, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 5, isCustom: true },
      { id: 'no_junk_food', sectionId: 'sec_nutrition_rec', title: 'Zero Ultra-Processed Junk Food', inputType: 'BOOLEAN' as HabitInputType, category: 'NEGATIVE_ABSTINENCE' as const, cadence: 'DAILY' as CadenceType, order: 6, isCustom: true }
    ]
  },
  {
    id: 'founder',
    title: 'Freelancer & Solo Founder',
    badge: 'Productivity',
    description: 'High-leverage shipping, outbound sales, content, and ruthless time management.',
    sections: [
      { id: 'sec_shipping', title: 'Product & Engineering', order: 1 },
      { id: 'sec_growth', title: 'Sales & Distribution', order: 2 },
      { id: 'sec_clarity', title: 'Mental Clarity & Shutdown', order: 3 }
    ],
    habits: [
      { id: 'deep_shipping', sectionId: 'sec_shipping', title: 'Deep Work: Core Product Build', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 180, step: 30, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 1, isCustom: true },
      { id: 'github_commits', sectionId: 'sec_shipping', title: 'Production Ship / PR Merged', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 2, isCustom: true },
      { id: 'cold_outreach', sectionId: 'sec_growth', title: 'Prospect Outreach / Cold DMs', inputType: 'QUANTITY' as HabitInputType, unit: 'outreach', targetValue: 15, step: 5, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 3, isCustom: true },
      { id: 'content_published', sectionId: 'sec_growth', title: 'Social / Newsletter Piece Published', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 4, isCustom: true },
      { id: 'inbox_zero', sectionId: 'sec_clarity', title: 'Inbox Zero & Day Shutdown', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 5, isCustom: true },
      { id: 'no_doomscroll_founder', sectionId: 'sec_clarity', title: 'No Social Media Doomscrolling', inputType: 'BOOLEAN' as HabitInputType, category: 'NEGATIVE_ABSTINENCE' as const, cadence: 'DAILY' as CadenceType, order: 6, isCustom: true }
    ]
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness & Dopamine Detox',
    badge: 'Mental Wellness',
    description: 'Silent meditation, nature walks, cold exposure, reading, and device detox.',
    sections: [
      { id: 'sec_stillness', title: 'Inner Stillness & Breath', order: 1 },
      { id: 'sec_vitality', title: 'Physical Energy & Grounding', order: 2 },
      { id: 'sec_detox', title: 'Dopamine Fasting & Rest', order: 3 }
    ],
    habits: [
      { id: 'silent_meditation', sectionId: 'sec_stillness', title: 'Silent Breath Meditation', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 20, step: 5, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 1, isCustom: true },
      { id: 'morning_journal', sectionId: 'sec_stillness', title: 'Morning Gratitude Journal', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 2, isCustom: true },
      { id: 'nature_walk', sectionId: 'sec_vitality', title: 'Unplugged Nature Walk', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 40, step: 10, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 3, isCustom: true },
      { id: 'cold_shower', sectionId: 'sec_vitality', title: 'Cold Shower / Cold Rinse', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 4, isCustom: true },
      { id: 'no_screens_after_9', sectionId: 'sec_detox', title: 'No Digital Screens After 9:30 PM', inputType: 'BOOLEAN' as HabitInputType, category: 'NEGATIVE_ABSTINENCE' as const, cadence: 'DAILY' as CadenceType, order: 5, isCustom: true },
      { id: 'no_sugar_caffeine', sectionId: 'sec_detox', title: 'Zero Refined Sugar / Late Caffeine', inputType: 'BOOLEAN' as HabitInputType, category: 'NEGATIVE_ABSTINENCE' as const, cadence: 'DAILY' as CadenceType, order: 6, isCustom: true }
    ]
  },
  {
    id: 'polyglot',
    title: 'Polyglot Language Immersion',
    badge: 'Linguistics',
    description: 'Spaced repetition cards, audio immersion, foreign reading, and speaking practice.',
    sections: [
      { id: 'sec_vocab', title: 'Vocabulary & Grammar', order: 1 },
      { id: 'sec_comprehension', title: 'Comprehension & Input', order: 2 },
      { id: 'sec_output', title: 'Active Speaking & Writing', order: 3 }
    ],
    habits: [
      { id: 'anki_vocab_cards', sectionId: 'sec_vocab', title: 'Anki Target Language Cards', inputType: 'QUANTITY' as HabitInputType, unit: 'cards', targetValue: 40, step: 10, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 1, isCustom: true },
      { id: 'grammar_drills', sectionId: 'sec_vocab', title: 'Grammar Exercises & Drills', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 20, step: 5, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 2, isCustom: true },
      { id: 'foreign_podcast', sectionId: 'sec_comprehension', title: 'Native Audio Podcast Listening', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 30, step: 10, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 3, isCustom: true },
      { id: 'foreign_reading_pages', sectionId: 'sec_comprehension', title: 'Reading Target Language Novel/News', inputType: 'QUANTITY' as HabitInputType, unit: 'pages', targetValue: 10, step: 2, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 4, isCustom: true },
      { id: 'speaking_shadowing', sectionId: 'sec_output', title: 'Speaking Shadowing / Monologue', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 15, step: 5, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 5, isCustom: true }
    ]
  },
  {
    id: 'cycle_wellness',
    title: 'Cycle-Synced Hormonal Health',
    badge: 'Hormonal Health',
    description: 'Menstrual flow, cervical fluid, basal temperature, cycle-synced workouts, and inverse tracking for PMS meltdowns.',
    sections: [
      { id: 'sec_cycle_markers', title: 'Cycle Flow & Phase Markers', order: 1 },
      { id: 'sec_cycle_symptoms', title: 'Physical Symptoms & Biomarkers', order: 2 },
      { id: 'sec_cycle_mindset', title: 'Mood, Energy & Emotional Harmony', order: 3 },
      { id: 'sec_cycle_care', title: 'Cycle-Synced Nutrition & Care', order: 4 }
    ],
    habits: [
      { id: 'custom_flow_level', sectionId: 'sec_cycle_markers', title: 'Menstrual Flow (Heavy/Med/Light/None)', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 1, isCustom: true },
      { id: 'custom_bbt_temp', sectionId: 'sec_cycle_symptoms', title: 'Basal Body Temperature', inputType: 'QUANTITY' as HabitInputType, unit: '°F', targetValue: 98.2, step: 0.1, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 2, isCustom: true },
      { id: 'custom_cramps_pain', sectionId: 'sec_cycle_symptoms', title: 'Pelvic Cramps & Dysmenorrhea', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 3, isCustom: true },
      { id: 'custom_pms_meltdown', sectionId: 'sec_cycle_mindset', title: 'PMS Meltdowns / Sudden Rage', inputType: 'QUANTITY' as HabitInputType, unit: 'incidents', targetValue: 0, step: 1, category: 'NEGATIVE_ABSTINENCE' as const, cadence: 'DAILY' as CadenceType, order: 4, isCustom: true },
      { id: 'custom_cycle_workout', sectionId: 'sec_cycle_care', title: 'Cycle-Synced Movement (Yin Yoga/HIIT)', inputType: 'DURATION' as HabitInputType, unit: 'min', targetValue: 30, step: 10, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 5, isCustom: true },
      { id: 'custom_magnesium_water', sectionId: 'sec_cycle_care', title: 'Magnesium & Electrolyte Hydration', inputType: 'BOOLEAN' as HabitInputType, category: 'POSITIVE' as const, cadence: 'DAILY' as CadenceType, order: 6, isCustom: true }
    ]
  }
];
