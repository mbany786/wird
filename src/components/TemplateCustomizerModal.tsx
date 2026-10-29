import React, { useState } from 'react';
import { Habit, HabitSection, HabitInputType, CadenceType, TrackerTemplate } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  Sparkles, 
  SlidersHorizontal, 
  Layers, 
  Wand2, 
  FolderPlus, 
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface TemplateCustomizerModalProps {
  template: TrackerTemplate;
  sections: HabitSection[];
  habits: Habit[];
  onAddHabit: (habit: Habit) => void;
  onUpdateHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onAddSection?: (title: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onUpdateTemplate?: (updated: TrackerTemplate) => void;
  onApplyGeneratedTemplate?: (newSections: HabitSection[], newHabits: Habit[], newTitle?: string) => void;
  onClose: () => void;
  onExportTemplate: () => void;
  onImportTemplate: (jsonStr: string) => void;
}

const PRESET_ROUTINES = [
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

export const TemplateCustomizerModal: React.FC<TemplateCustomizerModalProps> = ({
  template,
  sections,
  habits,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onAddSection,
  onDeleteSection,
  onUpdateTemplate,
  onApplyGeneratedTemplate,
  onClose,
  onExportTemplate,
  onImportTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'generate' | 'settings'>('list');

  // New Habit Form State
  const [newTitle, setNewTitle] = useState('');
  const [newUrduTitle, setNewUrduTitle] = useState('');
  const [newSectionId, setNewSectionId] = useState(sections[0]?.id || '');
  const [newInputType, setNewInputType] = useState<HabitInputType>('BOOLEAN');
  const [newCategory, setNewCategory] = useState<'POSITIVE' | 'NEGATIVE_ABSTINENCE'>('POSITIVE');
  const [newCadence, setNewCadence] = useState<CadenceType>('DAILY');
  const [newUnit, setNewUnit] = useState('count');
  const [newTarget, setNewTarget] = useState<number>(100);
  const [newStep, setNewStep] = useState<number>(10);

  // Template Settings State
  const [editTitle, setEditTitle] = useState(template.title);
  const [editDescription, setEditDescription] = useState(template.description);
  const [editBadge, setEditBadge] = useState(template.badge);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Prompt Generator State
  const [customPrompt, setCustomPrompt] = useState('');

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const id = `custom_${Date.now()}`;
    const newHabit: Habit = {
      id,
      sectionId: newSectionId || sections[0]?.id || 'custom_sec',
      title: newTitle.trim(),
      urduTitle: newUrduTitle.trim() || undefined,
      inputType: newInputType,
      category: newCategory,
      cadence: newCadence,
      order: habits.length + 1,
      isCustom: true
    };

    if (newCategory === 'NEGATIVE_ABSTINENCE') {
      newHabit.targetValue = 0;
      if (newInputType === 'QUANTITY') {
        newHabit.unit = newUnit || 'incidents';
        newHabit.step = 1;
      } else if (newInputType === 'DURATION') {
        newHabit.unit = 'min';
        newHabit.step = 15;
      }
    } else {
      if (newInputType === 'QUANTITY') {
        newHabit.unit = newUnit;
        newHabit.targetValue = newTarget;
        newHabit.step = newStep;
      } else if (newInputType === 'DURATION') {
        newHabit.unit = 'min';
        newHabit.targetValue = newTarget || 20;
        newHabit.step = newStep || 5;
      } else if (newInputType === 'LATAIF') {
        newHabit.unit = 'count';
        newHabit.targetValue = 5000;
        newHabit.step = 1000;
      }
    }

    onAddHabit(newHabit);
    setNewTitle('');
    setNewUrduTitle('');
    setActiveTab('list');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateTemplate) return;
    const updated: TrackerTemplate = {
      ...template,
      title: editTitle.trim() || template.title,
      description: editDescription.trim() || template.description,
      badge: editBadge.trim() || template.badge
    };
    onUpdateTemplate(updated);
    setActiveTab('list');
  };

  const handleAddNewSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim() || !onAddSection) return;
    onAddSection(newSectionTitle.trim());
    setNewSectionTitle('');
  };

  const handleApplyPreset = (preset: typeof PRESET_ROUTINES[0]) => {
    if (!onApplyGeneratedTemplate) return;
    if (confirm(`Apply "${preset.title}"? This will populate the sections and tasks for this template.`)) {
      onApplyGeneratedTemplate(preset.sections, preset.habits, preset.title);
      setActiveTab('list');
    }
  };

  const handleGenerateFromPrompt = () => {
    if (!customPrompt.trim() || !onApplyGeneratedTemplate) return;
    
    // Synthesize structured routine from the prompt
    const promptLower = customPrompt.toLowerCase();
    const promptTitle = customPrompt.length > 30 ? `${customPrompt.slice(0, 30)}... Tracker` : `${customPrompt} Tracker`;
    
    const genSections: HabitSection[] = [
      { id: `sec_gen_${Date.now()}_1`, title: 'Core Daily Priorities', order: 1 },
      { id: `sec_gen_${Date.now()}_2`, title: 'Skill Building & Focus', order: 2 },
      { id: `sec_gen_${Date.now()}_3`, title: 'Energy & Habits', order: 3 }
    ];

    const genHabits: Habit[] = [
      { id: `gen_h_${Date.now()}_1`, sectionId: genSections[0].id, title: `Primary Goal Focus: ${customPrompt.slice(0, 25)}`, inputType: 'DURATION', unit: 'min', targetValue: 60, step: 15, category: 'POSITIVE', cadence: 'DAILY', order: 1, isCustom: true },
      { id: `gen_h_${Date.now()}_2`, sectionId: genSections[0].id, title: 'Key Daily Milestone Completed', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 2, isCustom: true },
      { id: `gen_h_${Date.now()}_3`, sectionId: genSections[1].id, title: 'Dedicated Practice / Study', inputType: 'QUANTITY', unit: promptLower.includes('read') ? 'pages' : 'units', targetValue: 20, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 3, isCustom: true },
      { id: `gen_h_${Date.now()}_4`, sectionId: genSections[1].id, title: 'Deep Work Immersion', inputType: 'DURATION', unit: 'min', targetValue: 90, step: 15, category: 'POSITIVE', cadence: 'DAILY', order: 4, isCustom: true },
      { id: `gen_h_${Date.now()}_5`, sectionId: genSections[2].id, title: 'Hydration & Clean Energy', inputType: 'QUANTITY', unit: 'ml', targetValue: 2500, step: 250, category: 'POSITIVE', cadence: 'DAILY', order: 5, isCustom: true },
      { id: `gen_h_${Date.now()}_6`, sectionId: genSections[2].id, title: 'No Distractions / Zero Doomscrolling', inputType: 'BOOLEAN', category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 6, isCustom: true }
    ];

    onApplyGeneratedTemplate(genSections, genHabits, promptTitle);
    setCustomPrompt('');
    setActiveTab('list');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) onImportTemplate(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl p-6 shadow-2xl relative text-slate-100 flex flex-col max-h-[88vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Template Studio & Routine Generator</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
              {template.title}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Build your personalized tracker: add custom tasks with quantitative metrics, edit sections, or generate routines via prompt.
          </p>
        </div>

        {/* Action Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-2">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Current Tasks ({habits.length})
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'add'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'generate'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-purple-950/60 text-purple-300 border border-purple-800/60 hover:bg-purple-900/80'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Generate Routine</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'settings'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Settings & Sections</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportTemplate}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
              title="Download local JSON template"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Tab 1: Task List & Management */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {sections.length === 0 ? (
              <div className="text-center py-12 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <Layers className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No sections or tasks in this template yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Start by adding your first section, creating customized tasks, or use the routine generator.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Generate Routine</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>
            ) : (
              sections.map(section => {
                const secHabits = habits.filter(h => h.sectionId === section.id);
                return (
                  <div key={section.id} className="space-y-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span>{section.title}</span>
                        {section.urduTitle && <span className="text-[11px] text-emerald-400/80" dir="rtl">• {section.urduTitle}</span>}
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal">{secHabits.length} tasks</span>
                    </h4>

                    {secHabits.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-500 italic flex items-center justify-between">
                        <span>No tasks in this section.</span>
                        <button
                          onClick={() => {
                            setNewSectionId(section.id);
                            setActiveTab('add');
                          }}
                          className="text-emerald-400 hover:underline font-semibold"
                        >
                          + Add task here
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {secHabits.map(habit => (
                          <div
                            key={habit.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200">{habit.title}</span>
                              {habit.urduTitle && (
                                <span className="text-[11px] text-emerald-400 font-normal" dir="rtl">{habit.urduTitle}</span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                {habit.category === 'NEGATIVE_ABSTINENCE' ? 'Abstinence' : habit.inputType}
                              </span>
                              {habit.unit && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                                  {habit.targetValue} {habit.unit}
                                </span>
                              )}
                              {habit.cadence === 'FRIDAY_ONLY' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  Friday
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => onDeleteHabit(habit.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Add New Task */}
        {activeTab === 'add' && (
          <form onSubmit={handleCreateHabit} className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Task Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Read 20 Pages, Morning Workout, Guarding Gaze"
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Subtitle / Translation (Optional):</label>
                <input
                  type="text"
                  value={newUrduTitle}
                  onChange={(e) => setNewUrduTitle(e.target.value)}
                  placeholder="e.g. مطالعہ کتب"
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Assign to Section:</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    + Manage Sections
                  </button>
                </div>
                <select
                  value={newSectionId}
                  onChange={(e) => setNewSectionId(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Habit Category:</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="POSITIVE">Positive Habit (Streaks, Completion targets)</option>
                  <option value="NEGATIVE_ABSTINENCE">Negative / Vice Habit (Inverse: 0 = clean day)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300">Input Modality:</label>
              <select
                value={newInputType}
                onChange={(e) => setNewInputType(e.target.value as HabitInputType)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="BOOLEAN">Boolean Checkmark (Done / Missed)</option>
                <option value="QUANTITY">Quantitative (Pages, Reps, Counts, ML, Incidents)</option>
                <option value="DURATION">Duration (Minutes / Stopwatch)</option>
                <option value="LATAIF">Lataif Dual Tracking (5,000 count = 30 min)</option>
              </select>
            </div>

            {/* Quantitative details */}
            {newInputType === 'QUANTITY' && (
              <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Unit Name:</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="e.g. pages, ml, reps"
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Target Value:</label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Increment Step:</label>
                  <input
                    type="number"
                    value={newStep}
                    onChange={(e) => setNewStep(parseFloat(e.target.value) || 1)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {newInputType === 'DURATION' && (
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Target Minutes:</label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseFloat(e.target.value) || 0)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Step (Minutes):</label>
                  <input
                    type="number"
                    value={newStep}
                    onChange={(e) => setNewStep(parseFloat(e.target.value) || 5)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300">Schedule Cadence:</label>
              <select
                value={newCadence}
                onChange={(e) => setNewCadence(e.target.value as CadenceType)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="DAILY">Daily (1 to 31)</option>
                <option value="FRIDAY_ONLY">Fridays Only (Weekly)</option>
                <option value="WEEKLY_ONCE">Weekly Once</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-950"
            >
              <Check className="w-4 h-4" />
              <span>Add Task to Tracker</span>
            </button>
          </form>
        )}

        {/* Tab 3: Smart Routine Generator */}
        {activeTab === 'generate' && (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Freeform Prompt Generator */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <Wand2 className="w-4 h-4" />
                <span>Prompt-to-Routine Generator</span>
              </div>
              <p className="text-xs text-slate-400">
                Describe your goals, habits, or daily schedule in plain English. The smart engine will extract categories, quantitative units, and vice-elimination targets.
              </p>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Software engineer preparing for technical interviews, studying system design 2 hours, running 5k, and doing a zero sugar detox."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 h-20 resize-none"
              />
              <button
                type="button"
                onClick={handleGenerateFromPrompt}
                disabled={!customPrompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate & Populate Template</span>
              </button>
            </div>

            {/* Curated Theme Blueprints */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Or Choose a Ready-to-Use Blueprint:</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_ROUTINES.map(preset => (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{preset.title}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {preset.description}
                      </p>
                      <div className="text-[10px] text-emerald-400/90 font-medium mt-2">
                        {preset.sections.length} sections • {preset.habits.length} habits
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5"
                    >
                      <span>Apply Blueprint</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Template Settings & Sections */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Meta form */}
            <form onSubmit={handleSaveSettings} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Tracker Identity & Branding
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400">Template Title:</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400">Badge Label:</label>
                  <input
                    type="text"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400">Description:</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Template Details</span>
              </button>
            </form>

            {/* Sections Manager */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Manage Sections ({sections.length})</span>
              </h4>

              {/* Add New Section */}
              <form onSubmit={handleAddNewSection} className="flex gap-2">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Morning Routine, Deep Work, Health, Evening"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!newSectionTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white transition flex items-center gap-1"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              </form>

              {/* Sections List */}
              <div className="space-y-1.5 pt-2">
                {sections.map((sec, idx) => {
                  const count = habits.filter(h => h.sectionId === sec.id).length;
                  return (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[10px]">#{idx + 1}</span>
                        <span className="font-semibold text-slate-200">{sec.title}</span>
                        <span className="text-[10px] text-slate-500">({count} tasks)</span>
                      </div>

                      {onDeleteSection && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete section "${sec.title}" and its ${count} tasks?`)) {
                              onDeleteSection(sec.id);
                            }
                          }}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
