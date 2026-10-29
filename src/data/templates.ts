import { TrackerTemplate, MultiStateOption } from '../types';

export const PRAYER_STATES: MultiStateOption[] = [
  {
    code: 'TAKBEER_OOLA',
    symbol: '✓',
    label: 'Takbeer-e-Oola (تکبیر اولیٰ)',
    urduLabel: 'تکبیر اولیٰ',
    scoreWeight: 1.0,
    color: '#22c55e',
    bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
  },
  {
    code: 'JAMAT',
    symbol: '•',
    label: 'With Jamat (جماعت کے ساتھ)',
    urduLabel: 'باجماعت',
    scoreWeight: 0.85,
    color: '#38bdf8',
    bgClass: 'bg-sky-900/60 text-sky-300 border-sky-500'
  },
  {
    code: 'INDIVIDUAL',
    symbol: '••',
    label: 'Individually (انفرادی)',
    urduLabel: 'انفرادی',
    scoreWeight: 0.60,
    color: '#fbbf24',
    bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500'
  },
  {
    code: 'QAZA',
    symbol: '✗',
    label: 'Qaza / Missed (قضاء)',
    urduLabel: 'قضاء',
    scoreWeight: 0.0,
    color: '#f87171',
    bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500'
  }
];

export const JORE_STATES: MultiStateOption[] = [
  {
    code: 'SLOT_1',
    symbol: '1',
    label: 'Asar to Ishraq (عصر تا اشراق)',
    scoreWeight: 1.0,
    color: '#22c55e',
    bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
  },
  {
    code: 'SLOT_2',
    symbol: '2',
    label: 'Asar to Isha (عصر تا عشاء)',
    scoreWeight: 0.8,
    color: '#38bdf8',
    bgClass: 'bg-sky-900/60 text-sky-300 border-sky-500'
  },
  {
    code: 'SLOT_3',
    symbol: '3',
    label: 'Magrib to Isha (مغرب تا عشاء)',
    scoreWeight: 0.6,
    color: '#fbbf24',
    bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500'
  },
  {
    code: 'NOT_PARTICIPATED',
    symbol: '✗',
    label: 'Not participated (عدم شرکت)',
    scoreWeight: 0.0,
    color: '#f87171',
    bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500'
  }
];

export const CYCLE_FLOW_STATES: MultiStateOption[] = [
  {
    code: 'FLOW_HEAVY',
    symbol: '✓',
    label: 'Heavy Flow (Day 1-2 Peak)',
    scoreWeight: 1.0,
    color: '#f43f5e',
    bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500'
  },
  {
    code: 'FLOW_MEDIUM',
    symbol: '•',
    label: 'Medium Flow',
    scoreWeight: 0.8,
    color: '#fb7185',
    bgClass: 'bg-rose-950/60 text-rose-200 border-rose-400'
  },
  {
    code: 'FLOW_LIGHT',
    symbol: '••',
    label: 'Light Flow',
    scoreWeight: 0.6,
    color: '#fda4af',
    bgClass: 'bg-pink-900/60 text-pink-200 border-pink-400'
  },
  {
    code: 'FLOW_SPOTTING',
    symbol: '•••',
    label: 'Spotting / Tapering',
    scoreWeight: 0.4,
    color: '#f472b6',
    bgClass: 'bg-fuchsia-900/60 text-fuchsia-200 border-fuchsia-400'
  },
  {
    code: 'FLOW_NONE',
    symbol: '✗',
    label: 'No Bleeding / Dry Day',
    scoreWeight: 0.0,
    color: '#64748b',
    bgClass: 'bg-slate-900/60 text-slate-300 border-slate-600'
  }
];

export const CYCLE_PAIN_STATES: MultiStateOption[] = [
  {
    code: 'PAIN_NONE',
    symbol: '✓',
    label: 'Pain-Free / Comfortable',
    scoreWeight: 1.0,
    color: '#22c55e',
    bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
  },
  {
    code: 'PAIN_MILD',
    symbol: '•',
    label: 'Mild Twinges / Light Ache',
    scoreWeight: 0.75,
    color: '#38bdf8',
    bgClass: 'bg-sky-900/60 text-sky-300 border-sky-500'
  },
  {
    code: 'PAIN_MODERATE',
    symbol: '••',
    label: 'Moderate Cramps / Pressure',
    scoreWeight: 0.45,
    color: '#fbbf24',
    bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500'
  },
  {
    code: 'PAIN_SEVERE',
    symbol: '✗',
    label: 'Severe Cramps / Heating Pad & Rest',
    scoreWeight: 0.0,
    color: '#f87171',
    bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500'
  }
];

export const CYCLE_ENERGY_STATES: MultiStateOption[] = [
  {
    code: 'ENERGY_VIBRANT',
    symbol: '✓',
    label: 'Radiant / High Vitality',
    scoreWeight: 1.0,
    color: '#22c55e',
    bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
  },
  {
    code: 'ENERGY_STEADY',
    symbol: '•',
    label: 'Steady & Grounded Energy',
    scoreWeight: 0.8,
    color: '#38bdf8',
    bgClass: 'bg-sky-900/60 text-sky-300 border-sky-500'
  },
  {
    code: 'ENERGY_LOW',
    symbol: '••',
    label: 'Low Stamina / Sluggish',
    scoreWeight: 0.45,
    color: '#fbbf24',
    bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500'
  },
  {
    code: 'ENERGY_DEPLETED',
    symbol: '✗',
    label: 'Exhausted / Depleted',
    scoreWeight: 0.0,
    color: '#f87171',
    bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500'
  }
];

export const CYCLE_MOOD_STATES: MultiStateOption[] = [
  {
    code: 'MOOD_JOYFUL',
    symbol: '✓',
    label: 'Joyful, Optimistic & Confident',
    scoreWeight: 1.0,
    color: '#22c55e',
    bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
  },
  {
    code: 'MOOD_FOCUSED',
    symbol: '•',
    label: 'Calm, Centered & Methodical',
    scoreWeight: 0.8,
    color: '#38bdf8',
    bgClass: 'bg-sky-900/60 text-sky-300 border-sky-500'
  },
  {
    code: 'MOOD_SENSITIVE',
    symbol: '••',
    label: 'Sensitive, Emotional / Tender',
    scoreWeight: 0.5,
    color: '#fbbf24',
    bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500'
  },
  {
    code: 'MOOD_IRRITABLE',
    symbol: '✗',
    label: 'Irritable, Anxious / Short Fuse (PMS)',
    scoreWeight: 0.0,
    color: '#f87171',
    bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500'
  }
];

export const CERVICAL_FLUID_STATES: MultiStateOption[] = [
  {
    code: 'CF_EGGWHITE',
    symbol: '✓',
    label: 'Egg-White / Clear & Stretchy (Peak Fertile)',
    scoreWeight: 1.0,
    color: '#38bdf8',
    bgClass: 'bg-sky-900/60 text-sky-300 border-sky-500'
  },
  {
    code: 'CF_WATERY',
    symbol: '•',
    label: 'Watery & Slippery (High Fertility)',
    scoreWeight: 0.8,
    color: '#22c55e',
    bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
  },
  {
    code: 'CF_CREAMY',
    symbol: '••',
    label: 'Creamy / Lotion-like (Transitional)',
    scoreWeight: 0.6,
    color: '#fbbf24',
    bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500'
  },
  {
    code: 'CF_DRY',
    symbol: '✗',
    label: 'Dry / Sticky (Low Fertility)',
    scoreWeight: 0.2,
    color: '#64748b',
    bgClass: 'bg-slate-900/60 text-slate-300 border-slate-600'
  }
];

export const TEMPLATES: TrackerTemplate[] = [
  {
    id: 'daily_spiritual_schedule',
    title: 'Daily Spiritual Schedule',
    urduTitle: 'روزانہ کا معمول',
    description: 'High-density spiritual matrix including 5 daily prayers with Takbeer-e-Oola/Jamat states, Quran pages, Zikr counts, weekly Jore & Surah Kahaf, and custom aamal.',
    icon: 'Moon',
    badge: 'Spiritual Matrix',
    sections: [
      { id: 'fard_prayers', title: 'Obligatory Prayers', urduTitle: 'فرائض نمازیں', order: 1 },
      { id: 'nawafil_prayers', title: 'Sunan & Nawafil Prayers', urduTitle: 'سنن و نوافل', order: 2 },
      { id: 'quran_recitation', title: 'Recitation of Quran', urduTitle: 'تلاوت قرآن پاک', order: 3 },
      { id: 'zikr_durood', title: 'Zikar & Durood Sharif', urduTitle: 'ذکر و درود شریف', order: 4 },
      { id: 'lataif_lessons', title: 'Lataif (Lessons 1-8)', urduTitle: 'لطائف و اسباق (۱ تا ۸)', order: 5 },
      { id: 'ahzab_litanies', title: 'Ahzab & Daily Litanies', urduTitle: 'احزاب و اوراد', order: 6 },
      { id: 'negative_purification', title: 'Negative Actions & Vices', urduTitle: 'تزکیہ و ترکِ رذائل', order: 7 },
      { id: 'periodic_weekly', title: 'Weekly & Periodic Routines', urduTitle: 'ہفتہ وار معمولات', order: 8 },
      { id: 'custom_aamal', title: 'Write The Aamal Below (Custom)', urduTitle: 'مندرجہ بالا کے علاوہ معمولات', order: 9 },
    ],
    habits: [
      // Fard Prayers (Multi-state)
      { id: 'fajr', sectionId: 'fard_prayers', title: 'Fajr', urduTitle: 'فجر', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', multiStates: PRAYER_STATES, order: 1 },
      { id: 'zuhar', sectionId: 'fard_prayers', title: 'Zuhar', urduTitle: 'ظہر', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', multiStates: PRAYER_STATES, order: 2 },
      { id: 'asar', sectionId: 'fard_prayers', title: 'Asar', urduTitle: 'عصر', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', multiStates: PRAYER_STATES, order: 3 },
      { id: 'magrib', sectionId: 'fard_prayers', title: 'Magrib', urduTitle: 'مغرب', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', multiStates: PRAYER_STATES, order: 4 },
      { id: 'isha', sectionId: 'fard_prayers', title: 'Isha', urduTitle: 'عشاء', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', multiStates: PRAYER_STATES, order: 5 },

      // Nawafil
      { id: 'tahajjud', sectionId: 'nawafil_prayers', title: 'Tahajjud', urduTitle: 'تہجد', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 6 },
      { id: 'ishraq', sectionId: 'nawafil_prayers', title: 'Ishraq', urduTitle: 'اشراق', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 7 },
      { id: 'chaasht', sectionId: 'nawafil_prayers', title: 'Chaasht', urduTitle: 'چاشت', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 8 },
      { id: 'awabeen', sectionId: 'nawafil_prayers', title: 'Awabeen', urduTitle: 'اوابین', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 9 },
      { id: 'nawafil_isha', sectionId: 'nawafil_prayers', title: '4 Nawafil with Isha', urduTitle: 'عشاء کے ساتھ چار نفل', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 10 },

      // Quran
      { id: 'surah_yaseen', sectionId: 'quran_recitation', title: 'Surah Yaseen', urduTitle: 'سورۃ یس', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 11 },
      { id: 'surah_mulk', sectionId: 'quran_recitation', title: 'Surah Mulk', urduTitle: 'سورۃ ملک', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 12 },
      { id: 'quran_pages', sectionId: 'quran_recitation', title: 'Recitation of Quran', urduTitle: 'تلاوت قرآن پاک', inputType: 'QUANTITY', unit: 'pages', targetValue: 10, step: 1, category: 'POSITIVE', cadence: 'DAILY', order: 13 },

      // Zikar
      { id: 'kalma_3rd', sectionId: 'zikr_durood', title: '3rd Kalma - 100', urduTitle: 'تیسرا کلمہ - 100', inputType: 'QUANTITY', unit: 'count', targetValue: 100, step: 100, category: 'POSITIVE', cadence: 'DAILY', order: 14 },
      { id: 'durood_100', sectionId: 'zikr_durood', title: 'Durood Sharif - 100', urduTitle: 'درود شریف - 100', inputType: 'QUANTITY', unit: 'count', targetValue: 100, step: 100, category: 'POSITIVE', cadence: 'DAILY', order: 15 },
      { id: 'astaghfar_100', sectionId: 'zikr_durood', title: 'Astaghfar - 100', urduTitle: 'استغفار - 100', inputType: 'QUANTITY', unit: 'count', targetValue: 100, step: 100, category: 'POSITIVE', cadence: 'DAILY', order: 16 },
      { id: 'durood_extended', sectionId: 'zikr_durood', title: 'Durood Sharif - Hundreds/Thousands', urduTitle: 'مزید درود شریف سینکڑوں / ہزاروں', inputType: 'QUANTITY', unit: 'count', targetValue: 500, step: 100, category: 'POSITIVE', cadence: 'DAILY', order: 17 },
      { id: 'durood_40', sectionId: 'zikr_durood', title: '40 Darood Sharif', urduTitle: 'چالیس درود شریف', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 18 },
      { id: 'munajat_maqbool', sectionId: 'zikr_durood', title: 'Munajat-e-Maqbool', urduTitle: 'مناجات مقبول', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 19 },
      { id: 'zikr_advised', sectionId: 'zikr_durood', title: 'Zikr (as advised)', urduTitle: 'ذکر (ہدایت کے مطابق)', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 20 },
      { id: 'moraqiba', sectionId: 'zikr_durood', title: 'Moraqiba (Meditation)', urduTitle: 'مراقبہ', inputType: 'DURATION', unit: 'min', targetValue: 20, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 21 },
      { id: 'nafi_asbat', sectionId: 'zikr_durood', title: 'Nafi Asbat', urduTitle: 'نفی و اثبات', inputType: 'QUANTITY', unit: 'count', targetValue: 500, step: 100, category: 'POSITIVE', cadence: 'DAILY', order: 22 },

      // Lataif (Lessons 1 to 8) - Dual Tracking (5000 count = 30 minutes)
      { id: 'lataif_1', sectionId: 'lataif_lessons', title: 'Lesson 1', urduTitle: 'سبق ۱', inputType: 'LATAIF', category: 'POSITIVE', cadence: 'DAILY', unit: 'count', targetValue: 5000, step: 1000, order: 23 },
      { id: 'lataif_2', sectionId: 'lataif_lessons', title: 'Lesson 2', urduTitle: 'سبق ۲', inputType: 'LATAIF', category: 'POSITIVE', cadence: 'DAILY', unit: 'count', targetValue: 5000, step: 1000, order: 24 },
      { id: 'lataif_3', sectionId: 'lataif_lessons', title: 'Lesson 3', urduTitle: 'سبق ۳', inputType: 'LATAIF', category: 'POSITIVE', cadence: 'DAILY', unit: 'count', targetValue: 5000, step: 1000, order: 25 },
      { id: 'lataif_4', sectionId: 'lataif_lessons', title: 'Lesson 4', urduTitle: 'سبق ۴', inputType: 'LATAIF', category: 'POSITIVE', cadence: 'DAILY', unit: 'count', targetValue: 5000, step: 1000, order: 26 },
      { id: 'lataif_5', sectionId: 'lataif_lessons', title: 'Lesson 5', urduTitle: 'سبق ۵', inputType: 'LATAIF', category: 'POSITIVE', cadence: 'DAILY', unit: 'count', targetValue: 5000, step: 1000, order: 27 },
      { id: 'lataif_6', sectionId: 'lataif_lessons', title: 'Lesson 6', urduTitle: 'سبق ۶', inputType: 'LATAIF', category: 'POSITIVE', cadence: 'DAILY', unit: 'count', targetValue: 5000, step: 1000, order: 28 },
      { id: 'lataif_7', sectionId: 'lataif_lessons', title: 'Lesson 7', urduTitle: 'سبق ۷', inputType: 'LATAIF', category: 'POSITIVE', cadence: 'DAILY', unit: 'count', targetValue: 5000, step: 1000, order: 29 },
      { id: 'lataif_8', sectionId: 'lataif_lessons', title: 'Lesson 8', urduTitle: 'سبق ۸', inputType: 'LATAIF', category: 'POSITIVE', cadence: 'DAILY', unit: 'count', targetValue: 5000, step: 1000, order: 30 },

      // Ahzab & Daily Litanies (احزاب و اوراد)
      { id: 'wird_latif', sectionId: 'ahzab_litanies', title: 'Wird al-Latif', urduTitle: 'ورد اللطیف', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 31 },
      { id: 'hizb_al_bahr', sectionId: 'ahzab_litanies', title: 'Hizb al-Bahr', urduTitle: 'حزب البحر', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 32 },
      { id: 'hizb_al_nasr', sectionId: 'ahzab_litanies', title: 'Hizb al-Nasr', urduTitle: 'حزب النصر', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 33 },
      { id: 'hizb_al_nawawi', sectionId: 'ahzab_litanies', title: 'Hizb al-Nawawi', urduTitle: 'حزب الامام النووی', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 34 },
      { id: 'hizb_al_barr', sectionId: 'ahzab_litanies', title: 'Hizb al-Barr', urduTitle: 'حزب البر', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 35 },
      { id: 'ratib_al_haddad', sectionId: 'ahzab_litanies', title: 'Ratib al-Haddad', urduTitle: 'راتب الحداد', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 36 },
      { id: 'hizb_al_fath', sectionId: 'ahzab_litanies', title: 'Hizb al-Fath', urduTitle: 'حزب الفتح', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 37 },

      // Negative Actions & Spiritual Vices (Inverse Tracking: 0 incidents = 100% Clean)
      { id: 'anger_incidents', sectionId: 'negative_purification', title: 'Incidents of Anger', urduTitle: 'غصہ کے واقعات', inputType: 'QUANTITY', unit: 'incidents', targetValue: 0, step: 1, category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 38 },
      { id: 'backbiting_avoidance', sectionId: 'negative_purification', title: 'Backbiting & Gossip', urduTitle: 'غیبت و بدگوئی', inputType: 'BOOLEAN', category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 39 },
      { id: 'idle_talk_time', sectionId: 'negative_purification', title: 'Idle Talk & Time Wasting', urduTitle: 'فضول گوئی / لایعنی', inputType: 'DURATION', unit: 'min', targetValue: 0, step: 15, category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 40 },
      { id: 'guarding_gaze', sectionId: 'negative_purification', title: 'Guarding the Gaze', urduTitle: 'حفاظتِ نظر / بد نظری', inputType: 'BOOLEAN', category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 41 },

      // Periodic & Weekly
      { id: 'surah_kahaf', sectionId: 'periodic_weekly', title: 'Surah Kahaf (Fridays)', urduTitle: 'سورۃ کہف', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'FRIDAY_ONLY', order: 42 },
      { id: 'participation_jore', sectionId: 'periodic_weekly', title: 'Participation in Jore (Slot)', urduTitle: 'جوڑ میں شرکت', inputType: 'SLOT', category: 'POSITIVE', cadence: 'FRIDAY_ONLY', multiStates: JORE_STATES, order: 43 },
      { id: 'salaat_tasbeeh', sectionId: 'periodic_weekly', title: 'Salaat e Tasbeeh (Weekly)', urduTitle: 'صلوٰۃ تسبیح', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'WEEKLY_ONCE', order: 44 },

      // Custom write-ins
      { id: 'custom_aamal_1', sectionId: 'custom_aamal', title: 'Custom Amale 1 (Optional)', urduTitle: 'اضافی معمول ۱', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 45, isCustom: true },
      { id: 'custom_aamal_2', sectionId: 'custom_aamal', title: 'Custom Amale 2 (Optional)', urduTitle: 'اضافی معمول ۲', inputType: 'QUANTITY', unit: 'count', targetValue: 100, step: 10, category: 'POSITIVE', cadence: 'DAILY', order: 46, isCustom: true }
    ]
  },
  {
    id: 'complete_health_fitness',
    title: 'Peak Health & Biohacking',
    description: 'Track hydration volume, workout minutes, sleep, supplementation, and clean nutrition with flexible daily and weekly goals.',
    icon: 'Activity',
    badge: 'Health & Vitality',
    sections: [
      { id: 'vital_hydration', title: 'Hydration & Nutrition', order: 1 },
      { id: 'movement_fitness', title: 'Movement & Physical Training', order: 2 },
      { id: 'recovery_sleep', title: 'Recovery & Bio-Optimization', order: 3 }
    ],
    habits: [
      { id: 'water_intake', sectionId: 'vital_hydration', title: 'Water Intake', inputType: 'QUANTITY', unit: 'ml', targetValue: 3000, step: 250, category: 'POSITIVE', cadence: 'DAILY', order: 1 },
      { id: 'clean_eating', sectionId: 'vital_hydration', title: 'Clean Whole-Food Nutrition', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', order: 2, multiStates: [
        { code: 'PERFECT', symbol: '✓', label: 'Clean (100%)', scoreWeight: 1.0, color: '#22c55e', bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500' },
        { code: 'MINOR_SLIP', symbol: '•', label: '1 Small Treat', scoreWeight: 0.7, color: '#fbbf24', bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500' },
        { code: 'CHEAT_DAY', symbol: '✗', label: 'Junk Food', scoreWeight: 0.0, color: '#f87171', bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500' }
      ]},
      { id: 'supplements', sectionId: 'vital_hydration', title: 'Vitamins & Creatine', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 3 },
      { id: 'daily_steps', sectionId: 'movement_fitness', title: 'Daily Step Count', inputType: 'QUANTITY', unit: 'steps', targetValue: 10000, step: 1000, category: 'POSITIVE', cadence: 'DAILY', order: 4 },
      { id: 'gym_workout', sectionId: 'movement_fitness', title: 'Resistance / Gym Workout', inputType: 'DURATION', unit: 'min', targetValue: 45, step: 15, category: 'POSITIVE', cadence: 'DAILY', order: 5 },
      { id: 'cardio_zone2', sectionId: 'movement_fitness', title: 'Zone 2 Cardio Session', inputType: 'DURATION', unit: 'min', targetValue: 30, step: 10, category: 'POSITIVE', cadence: 'DAILY', order: 6 },
      { id: 'sleep_hours', sectionId: 'recovery_sleep', title: 'Sleep Duration', inputType: 'QUANTITY', unit: 'hrs', targetValue: 8, step: 0.5, category: 'POSITIVE', cadence: 'DAILY', order: 7 },
      { id: 'sauna_cold', sectionId: 'recovery_sleep', title: 'Sauna / Cold Plunge', inputType: 'DURATION', unit: 'min', targetValue: 15, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 8 }
    ]
  },
  {
    id: 'deep_work_digital_detox',
    title: 'Deep Work & Digital Detox',
    description: 'High-leverage productivity combining positive deep work blocks, reading quotas, and negative habit abstinence (screen limits & urges).',
    icon: 'Brain',
    badge: 'Cognitive Focus',
    sections: [
      { id: 'positive_output', title: 'Deep Work & Knowledge Intake', order: 1 },
      { id: 'negative_abstinence', title: 'Abstinence & Detox (Negative Habits)', order: 2 },
      { id: 'daily_hygiene', title: 'Mindset & Evening Shutdown', order: 3 }
    ],
    habits: [
      { id: 'deep_work', sectionId: 'positive_output', title: 'Deep Focus Work', inputType: 'DURATION', unit: 'min', targetValue: 180, step: 30, category: 'POSITIVE', cadence: 'DAILY', order: 1 },
      { id: 'book_reading', sectionId: 'positive_output', title: 'Non-Fiction Reading', inputType: 'QUANTITY', unit: 'pages', targetValue: 20, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 2 },
      { id: 'no_doomscroll', sectionId: 'negative_abstinence', title: 'No Social Media Doomscrolling', inputType: 'BOOLEAN', category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 3 },
      { id: 'no_sugar_craving', sectionId: 'negative_abstinence', title: 'Zero Refined Sugar / Junk', inputType: 'BOOLEAN', category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 4 },
      { id: 'no_late_screens', sectionId: 'negative_abstinence', title: 'No Screens After 10:30 PM', inputType: 'BOOLEAN', category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 5 },
      { id: 'shutdown_ritual', sectionId: 'daily_hygiene', title: 'Workstation Shutdown Ritual', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 6 },
      { id: 'daily_journal', sectionId: 'daily_hygiene', title: 'Nightly Reflection Journal', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 7 }
    ]
  },
  {
    id: 'multi_book_reading_tracker',
    title: 'Multi-Book Daily Reading Tracker',
    description: 'Designed for scholars, researchers, and voracious readers managing multiple books concurrently across non-fiction, technical literature, fiction, and research papers.',
    icon: 'BookOpen',
    badge: 'Reading Matrix',
    sections: [
      { id: 'core_books', title: 'Core Study Books', order: 1 },
      { id: 'research_articles', title: 'Research & Scholarly Papers', order: 2 },
      { id: 'evening_literature', title: 'Literature & Audiobooks', order: 3 },
      { id: 'synthesis_notes', title: 'Synthesis & Note Taking', order: 4 }
    ],
    habits: [
      { id: 'book_primary', sectionId: 'core_books', title: 'Book 1: Primary Non-Fiction', inputType: 'QUANTITY', unit: 'pages', targetValue: 25, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 1 },
      { id: 'book_secondary', sectionId: 'core_books', title: 'Book 2: Technical / Professional', inputType: 'QUANTITY', unit: 'pages', targetValue: 20, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 2 },
      { id: 'book_classical', sectionId: 'core_books', title: 'Book 3: Philosophy / Classical Text', inputType: 'QUANTITY', unit: 'pages', targetValue: 15, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 3 },
      { id: 'research_papers', sectionId: 'research_articles', title: 'Research Papers / Essays', inputType: 'QUANTITY', unit: 'papers', targetValue: 2, step: 1, category: 'POSITIVE', cadence: 'DAILY', order: 4 },
      { id: 'deep_immersion_time', sectionId: 'research_articles', title: 'Deep Reading Immersion', inputType: 'DURATION', unit: 'min', targetValue: 90, step: 15, category: 'POSITIVE', cadence: 'DAILY', order: 5 },
      { id: 'book_fiction', sectionId: 'evening_literature', title: 'Book 4: Fiction / Novels', inputType: 'QUANTITY', unit: 'pages', targetValue: 30, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 6 },
      { id: 'audiobook_time', sectionId: 'evening_literature', title: 'Audiobook Listening Session', inputType: 'DURATION', unit: 'min', targetValue: 45, step: 15, category: 'POSITIVE', cadence: 'DAILY', order: 7 },
      { id: 'reading_notes', sectionId: 'synthesis_notes', title: 'Marginalia & Chapter Summaries', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 8 },
      { id: 'quotes_logged', sectionId: 'synthesis_notes', title: 'Key Quotes & Insights Logged', inputType: 'QUANTITY', unit: 'quotes', targetValue: 5, step: 1, category: 'POSITIVE', cadence: 'DAILY', order: 9 }
    ]
  },
  {
    id: 'baby_child_routine_tracker',
    title: 'Baby & Child Daily Habits Tracker',
    description: 'Empowers parents to monitor essential daily routines for infants, toddlers, and young children: feeding & milk, nap and night sleep, outdoor play, storytime, hygiene, and emotional wellbeing.',
    icon: 'Baby',
    badge: 'Parenting & Childcare',
    sections: [
      { id: 'nutrition_feeding', title: 'Nutrition & Daily Feeding', order: 1 },
      { id: 'sleep_rest', title: 'Sleep Cycles & Bedtime Routine', order: 2 },
      { id: 'play_development', title: 'Active Play & Cognitive Development', order: 3 },
      { id: 'hygiene_care', title: 'Hygiene, Health & Self-Care', order: 4 },
      { id: 'behavior_balance', title: 'Screen Time & Behavioral Harmony', order: 5 }
    ],
    habits: [
      // Nutrition & Feeding
      { id: 'child_milk_intake', sectionId: 'nutrition_feeding', title: 'Milk / Formula Intake', inputType: 'QUANTITY', unit: 'oz', targetValue: 24, step: 2, category: 'POSITIVE', cadence: 'DAILY', order: 1 },
      { id: 'child_solid_meals', sectionId: 'nutrition_feeding', title: 'Healthy Solid Meals', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', order: 2, multiStates: [
        { code: 'ALL_MEALS', symbol: '✓', label: '3 Balanced Meals + Fruits', scoreWeight: 1.0, color: '#22c55e', bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500' },
        { code: 'PARTIAL_MEALS', symbol: '•', label: '2 Meals + Healthy Snacks', scoreWeight: 0.75, color: '#38bdf8', bgClass: 'bg-sky-900/60 text-sky-300 border-sky-500' },
        { code: 'PICKY_EATING', symbol: '••', label: 'Picky / Partial Eating', scoreWeight: 0.5, color: '#fbbf24', bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500' },
        { code: 'SKIPPED_MEAL', symbol: '✗', label: 'Refused Meals / Fussy', scoreWeight: 0.0, color: '#f87171', bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500' }
      ]},
      { id: 'child_water_cups', sectionId: 'nutrition_feeding', title: 'Water Intake', inputType: 'QUANTITY', unit: 'cups', targetValue: 4, step: 1, category: 'POSITIVE', cadence: 'DAILY', order: 3 },
      { id: 'child_vitamins', sectionId: 'nutrition_feeding', title: 'Vitamin D / Drops / Supplements', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 4 },

      // Sleep & Rest
      { id: 'child_night_sleep', sectionId: 'sleep_rest', title: 'Night Sleep Duration', inputType: 'QUANTITY', unit: 'hrs', targetValue: 10, step: 0.5, category: 'POSITIVE', cadence: 'DAILY', order: 5 },
      { id: 'child_nap_duration', sectionId: 'sleep_rest', title: 'Daytime Nap Time', inputType: 'DURATION', unit: 'min', targetValue: 90, step: 15, category: 'POSITIVE', cadence: 'DAILY', order: 6 },
      { id: 'child_bedtime_routine', sectionId: 'sleep_rest', title: 'Consistent Bedtime Routine', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 7 },

      // Play & Development
      { id: 'child_outdoor_play', sectionId: 'play_development', title: 'Outdoor Fresh Air & Park Play', inputType: 'DURATION', unit: 'min', targetValue: 60, step: 15, category: 'POSITIVE', cadence: 'DAILY', order: 8 },
      { id: 'child_storytime_books', sectionId: 'play_development', title: 'Storytime Reading Together', inputType: 'QUANTITY', unit: 'books', targetValue: 3, step: 1, category: 'POSITIVE', cadence: 'DAILY', order: 9 },
      { id: 'child_tummy_or_motor', sectionId: 'play_development', title: 'Sensory / Motor Play / Puzzles', inputType: 'DURATION', unit: 'min', targetValue: 30, step: 10, category: 'POSITIVE', cadence: 'DAILY', order: 10 },

      // Hygiene & Health Care
      { id: 'child_teeth_brushing', sectionId: 'hygiene_care', title: 'Teeth Brushing', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', order: 11, multiStates: [
        { code: 'BRUSH_2X', symbol: '✓', label: 'Morning & Night (2x)', scoreWeight: 1.0, color: '#22c55e', bgClass: 'bg-emerald-900/60 text-emerald-300 border-emerald-500' },
        { code: 'BRUSH_1X', symbol: '•', label: 'Once Today (1x)', scoreWeight: 0.6, color: '#fbbf24', bgClass: 'bg-amber-900/60 text-amber-300 border-amber-500' },
        { code: 'BRUSH_MISSED', symbol: '✗', label: 'Missed / Resisted', scoreWeight: 0.0, color: '#f87171', bgClass: 'bg-rose-900/60 text-rose-300 border-rose-500' }
      ]},
      { id: 'child_bath_clean', sectionId: 'hygiene_care', title: 'Bath & Gentle Skincare', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 12 },
      { id: 'child_potty_training', sectionId: 'hygiene_care', title: 'Potty Training Milestones / Clean Diapers', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 13 },

      // Screen Time & Emotional Harmony (with inverse tracking for tantrums / meltdowns)
      { id: 'child_screen_limit', sectionId: 'behavior_balance', title: 'Zero or Under 30m Screen Time', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 14 },
      { id: 'child_tantrums', sectionId: 'behavior_balance', title: 'Tantrums / Severe Meltdowns', inputType: 'QUANTITY', unit: 'incidents', targetValue: 0, step: 1, category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 15 },
      { id: 'child_tidy_toys', sectionId: 'behavior_balance', title: 'Tidied Up Toys After Playtime', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 16 }
    ]
  },
  {
    id: 'cycle_health_tracker',
    title: 'Intelligent Menstrual & Cycle Health Tracker',
    description: 'Calculates physiological stages (Menstrual, Follicular, Ovulatory, Luteal / PMS), predicts mood and stamina states, and alerts to biological vulnerabilities and cycle-synced nutrition.',
    icon: 'HeartPulse',
    badge: 'Cycle Intelligence',
    sections: [
      { id: 'cycle_flow_markers', title: 'Menstrual Flow & Cycle Markers', order: 1 },
      { id: 'physical_biomarkers', title: 'Physical Symptoms & Biomarkers', order: 2 },
      { id: 'mood_mental_balance', title: 'Mood, Energy & Emotional Harmony', order: 3 },
      { id: 'cycle_synced_care', title: 'Cycle-Synced Nutrition & Care', order: 4 }
    ],
    habits: [
      // 1. Cycle Flow & Markers
      { id: 'cycle_flow_level', sectionId: 'cycle_flow_markers', title: 'Menstrual Flow Level', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', order: 1, multiStates: CYCLE_FLOW_STATES },
      { id: 'cervical_fluid', sectionId: 'cycle_flow_markers', title: 'Cervical Fluid Quality', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', order: 2, multiStates: CERVICAL_FLUID_STATES },
      { id: 'cycle_day_log', sectionId: 'cycle_flow_markers', title: 'Cycle Day Counter', inputType: 'QUANTITY', unit: 'day', targetValue: 28, step: 1, category: 'POSITIVE', cadence: 'DAILY', order: 3 },

      // 2. Physical Symptoms & Biomarkers
      { id: 'cramps_pelvic_pain', sectionId: 'physical_biomarkers', title: 'Pelvic Cramps & Dysmenorrhea', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', order: 4, multiStates: CYCLE_PAIN_STATES },
      { id: 'bloating_fluid_retention', sectionId: 'physical_biomarkers', title: 'Bloating & Fluid Retention', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 5 },
      { id: 'hormonal_headache', sectionId: 'physical_biomarkers', title: 'Hormonal Headache / Migraine', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 6 },
      { id: 'basal_body_temp', sectionId: 'physical_biomarkers', title: 'Basal Body Temperature', inputType: 'QUANTITY', unit: '°F', targetValue: 98.2, step: 0.1, category: 'POSITIVE', cadence: 'DAILY', order: 7 },
      { id: 'breast_tenderness', sectionId: 'physical_biomarkers', title: 'Breast Tenderness / Sensitivity', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 8 },

      // 3. Mood, Energy & Emotional Harmony
      { id: 'daily_energy_level', sectionId: 'mood_mental_balance', title: 'Vitality & Energy Reserve', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', order: 9, multiStates: CYCLE_ENERGY_STATES },
      { id: 'predominant_mood', sectionId: 'mood_mental_balance', title: 'Predominant Mood State', inputType: 'MULTI_STATE', category: 'POSITIVE', cadence: 'DAILY', order: 10, multiStates: CYCLE_MOOD_STATES },
      { id: 'pms_meltdown_rage', sectionId: 'mood_mental_balance', title: 'Emotional Meltdowns / PMS Rage', inputType: 'QUANTITY', unit: 'incidents', targetValue: 0, step: 1, category: 'NEGATIVE_ABSTINENCE', cadence: 'DAILY', order: 11 },
      { id: 'mental_clarity_focus', sectionId: 'mood_mental_balance', title: 'Mental Clarity & Sharp Focus', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 12 },

      // 4. Cycle-Synced Nutrition & Care
      { id: 'magnesium_hydration', sectionId: 'cycle_synced_care', title: 'Magnesium & Electrolyte Hydration', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 13 },
      { id: 'cycle_synced_workout', sectionId: 'cycle_synced_care', title: 'Cycle-Synced Movement (Yin Yoga/HIIT)', inputType: 'DURATION', unit: 'min', targetValue: 30, step: 10, category: 'POSITIVE', cadence: 'DAILY', order: 14 },
      { id: 'restful_sleep_hours', sectionId: 'cycle_synced_care', title: 'Restful Sleep Duration', inputType: 'QUANTITY', unit: 'hrs', targetValue: 8.5, step: 0.5, category: 'POSITIVE', cadence: 'DAILY', order: 15 },
      { id: 'low_sugar_caffeine', sectionId: 'cycle_synced_care', title: 'Low Sugar & Balanced Caffeine', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 16 },
      { id: 'warm_nourishment', sectionId: 'cycle_synced_care', title: 'Warm Herbal Tea / Self-Care Warmth', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 17 }
    ]
  },
  {
    id: 'blank_custom_tracker',
    title: 'Blank Custom Tracker',
    description: 'A completely open, customizable tracker. Edit titles, create your own sections, add quantitative or duration goals, or generate routines via prompt.',
    icon: 'Sparkles',
    badge: 'Custom Canvas',
    sections: [
      { id: 'sec_custom_core', title: 'My Custom Routine', order: 1 }
    ],
    habits: [
      { id: 'custom_habit_sample_1', sectionId: 'sec_custom_core', title: 'Morning Focus & Planning', inputType: 'BOOLEAN', category: 'POSITIVE', cadence: 'DAILY', order: 1, isCustom: true },
      { id: 'custom_habit_sample_2', sectionId: 'sec_custom_core', title: 'Daily Reading or Study', inputType: 'QUANTITY', unit: 'pages', targetValue: 20, step: 5, category: 'POSITIVE', cadence: 'DAILY', order: 2, isCustom: true },
      { id: 'custom_habit_sample_3', sectionId: 'sec_custom_core', title: 'Physical Activity / Workout', inputType: 'DURATION', unit: 'min', targetValue: 30, step: 10, category: 'POSITIVE', cadence: 'DAILY', order: 3, isCustom: true }
    ]
  }
];
