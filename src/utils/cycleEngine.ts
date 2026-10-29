import { HabitLog } from '../types';

export type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATORY' | 'LUTEAL';

export interface CyclePhaseInfo {
  phase: CyclePhase;
  phaseName: string;
  subPhase: string;
  dayRange: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  hormoneProfile: string;
  moodSummary: string;
  moodTraits: string[];
  thingsToWatchOutFor: string[];
  nutritionAdvice: string;
  movementAdvice: string;
  productivityTip: string;
  fertilityStatus: 'LOW' | 'MEDIUM' | 'PEAK' | 'POST_OVULATORY';
  isPmsWindow: boolean;
}

export interface CycleAnalysisResult {
  currentCycleDay: number;
  totalCycleLength: number;
  phaseInfo: CyclePhaseInfo;
  lastPeriodStartDate: string;
  nextPeriodEstimatedDate: string;
  daysUntilNextPeriod: number;
  totalCyclesTracked: number;
  flowCountThisMonth: number;
  averageCycleLength: number;
}

export const CYCLE_PHASE_CONFIGS: Record<CyclePhase, (day: number, cycleLength: number) => CyclePhaseInfo> = {
  MENSTRUAL: (_day, _len) => ({
    phase: 'MENSTRUAL',
    phaseName: 'Menstrual Phase',
    subPhase: 'Cleansing & Renewal',
    dayRange: 'Days 1 – 5',
    color: '#f43f5e',
    bgClass: 'bg-rose-950/70',
    borderClass: 'border-rose-600/70',
    textClass: 'text-rose-300',
    hormoneProfile: 'Estrogen and progesterone are at their lowest baseline. Uterine lining sheds.',
    moodSummary: 'Introspective, quiet, and reflective. Lower dopamine and serotonin can manifest as low social stamina and heightened sensory sensitivity.',
    moodTraits: ['Reflective & Intuitive', 'Low Social Stamina', 'Desire for Solitude', 'Physical Vulnerability'],
    thingsToWatchOutFor: [
      'Dysmenorrhea (uterine cramping) & lower back tension',
      'Iron depletion & sudden energy crashes — avoid strenuous schedules',
      'Sluggish digestion & dehydration — drink warm herbal teas',
      'Heightened emotional sensitivity — postpone non-urgent confrontations'
    ],
    nutritionAdvice: 'Warm bone broths, iron-dense leafy greens, lentils, dates, dark chocolate, and magnesium-rich pumpkin seeds. Avoid excessive iced drinks and high sodium.',
    movementAdvice: 'Restorative yin yoga, gentle pelvis opening stretches, slow walking, and prioritizing deep sleep over workouts.',
    productivityTip: 'Ideal for big-picture reflection, strategic reviews, journaling, and setting intentions. Avoid jam-packed multi-meeting days.',
    fertilityStatus: 'LOW',
    isPmsWindow: false
  }),

  FOLLICULAR: (day, _len) => ({
    phase: 'FOLLICULAR',
    phaseName: 'Follicular Phase',
    subPhase: day > 10 ? 'Late Follicular (Pre-Ovulation Surge)' : 'Early Follicular (Rising Vitality)',
    dayRange: 'Days 6 – 13',
    color: '#10b981',
    bgClass: 'bg-emerald-950/70',
    borderClass: 'border-emerald-600/70',
    textClass: 'text-emerald-300',
    hormoneProfile: 'FSH stimulates follicle growth. Estrogen climbs rapidly, boosting serotonin and neural plasticity.',
    moodSummary: 'High optimism, mental sharpness, creativity, and vibrant motivation. Rising vitality makes you eager to connect, build, and explore.',
    moodTraits: ['Optimistic & Radiant', 'Sharp Cognitive Focus', 'Creative Surge', 'Social Charisma'],
    thingsToWatchOutFor: [
      'Overcommitting your calendar because energy feels virtually limitless',
      'Neglecting proper post-workout warm-downs and adequate protein',
      'Rushing into too many parallel projects at once without prioritization'
    ],
    nutritionAdvice: 'Fresh vibrant whole foods, probiotic fermented vegetables (sauerkraut, kimchi), lean clean proteins, and cruciferous greens (broccoli, kale) to assist liver estrogen metabolism.',
    movementAdvice: 'High-intensity interval training (HIIT), progressive heavy resistance lifting, running, and dynamic athletic training.',
    productivityTip: 'Prime window for creative brainstorming, starting ambitious new habits, complex writing, pitches, and launching initiatives.',
    fertilityStatus: day >= 10 ? 'MEDIUM' : 'LOW',
    isPmsWindow: false
  }),

  OVULATORY: (_day, _len) => ({
    phase: 'OVULATORY',
    phaseName: 'Ovulatory Phase',
    subPhase: 'Peak Vitality & Fertility',
    dayRange: 'Days 14 – 16',
    color: '#f59e0b',
    bgClass: 'bg-amber-950/70',
    borderClass: 'border-amber-600/70',
    textClass: 'text-amber-300',
    hormoneProfile: 'Luteinizing Hormone (LH) surge triggers ovulation. Estrogen and testosterone reach monthly pinnacle.',
    moodSummary: 'Maximum physical confidence, verbal eloquence, magnetic presence, and extroversion. Senses are at their sharpest.',
    moodTraits: ['Peak Confidence', 'Articulate & Persuasive', 'High Physical Magnetism', 'Extroverted'],
    thingsToWatchOutFor: [
      'Mittelschmerz (sharp or dull one-sided pelvic ovulation twinges)',
      'Sudden hormonal skin blemishes / excess sebum from peak testosterone',
      'Mild basal body temperature jump (+0.5°F to 1.0°F post-ovulation)'
    ],
    nutritionAdvice: 'Antioxidant-dense berries, zinc-rich seeds (sesame & pumpkin), light fiber-rich salads, and optimal hydration to assist ovulation.',
    movementAdvice: 'Peak strength performance, group fitness classes, bootcamps, sprint sessions, and strenuous cardio.',
    productivityTip: 'Schedule high-stakes conversations, public presentations, salary negotiations, and public-facing meetings now.',
    fertilityStatus: 'PEAK',
    isPmsWindow: false
  }),

  LUTEAL: (day, cycleLength) => {
    const isLatePms = day >= (cycleLength - 6);
    return {
      phase: 'LUTEAL',
      phaseName: 'Luteal Phase',
      subPhase: isLatePms ? 'Late Luteal (Pre-Menstrual / PMS Window)' : 'Early Luteal (Grounded & Detail-Oriented)',
      dayRange: `Days 17 – ${cycleLength}`,
      color: isLatePms ? '#d946ef' : '#8b5cf6',
      bgClass: isLatePms ? 'bg-fuchsia-950/70' : 'bg-purple-950/70',
      borderClass: isLatePms ? 'border-fuchsia-600/70' : 'border-purple-600/70',
      textClass: isLatePms ? 'text-fuchsia-300' : 'text-purple-300',
      hormoneProfile: isLatePms 
        ? 'Steep drop in both progesterone and estrogen as body prepares for menstruation. GABA drops.' 
        : 'Progesterone rises to dominate, activating soothing GABA receptors and raising basal body temperature.',
      moodSummary: isLatePms
        ? 'Pre-Menstrual Sensitivity: Shorter emotional fuse, heightened emotional vulnerability, potential PMS irritability, anxiety, or tearfulness. Inner critic may be loud.'
        : 'Grounded, nesting, methodical, and detail-oriented. Calm focus turns naturally inward.',
      moodTraits: isLatePms
        ? ['Pre-Menstrual Irritability', 'Heightened Sensory Sensitivity', 'Emotional Vulnerability', 'Intolerant of Friction']
        : ['Calm & Methodical', 'Nesting Instincts', 'Organized Execution', 'Refining Details'],
      thingsToWatchOutFor: isLatePms
        ? [
            'PMS Irritability & Sudden Temper: Be gentle with yourself; avoid triggering arguments or major life choices.',
            'Bloating & Water Retention: Aldosterone shifts cause fluid buildup — reduce excess sodium.',
            'Intense Sugar & Carb Cravings: Resting metabolic rate increases by 100-300 kcal. Eat slow-burning complex carbs (sweet potatoes, oats, dark chocolate).',
            'Sleep Disturbances & Night Sweats: Elevate bedroom airflow; progesterone drops can trigger insomnia.',
            'Caffeine Sensitivity: Afternoon caffeine can amplify luteal anxiety and breast tenderness.'
          ]
        : [
            'Mild afternoon energy dips as body temperature remains elevated',
            'Gradual transition from extroversion to needing more evening downtime'
          ],
      nutritionAdvice: isLatePms
        ? 'Magnesium glycinate, vitamin B6, warm roasted root vegetables, oats, dark chocolate (>70%), ginger tea, and sunflower seeds. Minimize refined white sugars to prevent blood sugar crashes.'
        : 'Complex carbohydrates, high-fiber roasted root vegetables, magnesium, and healthy fats (avocado, olive oil).',
      movementAdvice: isLatePms
        ? 'Pilates, steady-state uphill walking, moderate resistance training, and gentle restorative mobility. Avoid exhausting high-impact HIIT.'
        : 'Moderate strength training, steady state zone-2 cardio, and pilates.',
      productivityTip: isLatePms
        ? 'Best suited for editing, debugging, auditing, cleaning, wrapping up projects, and saying "no" to non-essential obligations.'
        : 'Great for focused individual execution, organizational tasks, financial planning, and wrapping up open loops.',
      fertilityStatus: 'POST_OVULATORY',
      isPmsWindow: isLatePms
    };
  }
};

/**
 * Given user habit logs and a target date, calculates the exact cycle stage,
 * day of cycle, mood predictions, and things to watch out for.
 */
export function analyzeMenstrualCycle(
  logs: HabitLog[],
  targetDate: string,
  configuredCycleLength: number = 28
): CycleAnalysisResult {
  const targetDateObj = new Date(targetDate);

  // 1. Find all active bleeding / period start days
  // Checks for `cycle_flow_level` or `flow_level` or any habit with stateCode FLOW_HEAVY, FLOW_MEDIUM, FLOW_LIGHT, FLOW_SPOTTING
  // or numericValue > 0 on a period habit.
  const bleedingDates: string[] = [];

  for (const log of logs) {
    const isPeriodHabit = 
      log.habitId === 'cycle_flow_level' || 
      log.habitId === 'flow_level' ||
      log.habitId.includes('period') ||
      log.habitId.includes('flow');

    const hasBleedingState = 
      log.stateCode === 'FLOW_HEAVY' || 
      log.stateCode === 'FLOW_MEDIUM' || 
      log.stateCode === 'FLOW_LIGHT' ||
      log.stateCode === 'FLOW_SPOTTING' ||
      (log.status === 'COMPLETED' && log.numericValue && log.numericValue > 0 && isPeriodHabit);

    if (hasBleedingState && !bleedingDates.includes(log.date)) {
      bleedingDates.push(log.date);
    }
  }

  // Sort chronologically
  bleedingDates.sort();

  // Find period start clusters (days with flow separated by at least 15 days)
  const periodStartDates: string[] = [];
  let lastRecordedDate: Date | null = null;

  for (const dateStr of bleedingDates) {
    const d = new Date(dateStr);
    if (!lastRecordedDate || (d.getTime() - lastRecordedDate.getTime()) > (15 * 24 * 60 * 60 * 1000)) {
      periodStartDates.push(dateStr);
    }
    lastRecordedDate = d;
  }

  // Find the most recent period start date on or before targetDate
  let mostRecentStart: string | null = null;
  for (let i = periodStartDates.length - 1; i >= 0; i--) {
    if (periodStartDates[i] <= targetDate) {
      mostRecentStart = periodStartDates[i];
      break;
    }
  }

  // Fallback if no period log found before targetDate:
  // Check if there are any period logs in future, or establish a default anchor
  // E.g., if target date is Oct 29, 2026, and no period found, anchor to 18 days prior so user sees active luteal stage demo
  if (!mostRecentStart) {
    if (periodStartDates.length > 0) {
      mostRecentStart = periodStartDates[0];
    } else {
      const fallbackDate = new Date(targetDateObj);
      fallbackDate.setDate(fallbackDate.getDate() - 18);
      mostRecentStart = fallbackDate.toISOString().split('T')[0];
    }
  }

  // Calculate day difference
  const startDateObj = new Date(mostRecentStart);
  const diffTime = targetDateObj.getTime() - startDateObj.getTime();
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));

  const totalCycleLength = configuredCycleLength > 0 ? configuredCycleLength : 28;
  const rawCycleDay = (diffDays % totalCycleLength) + 1;
  const currentCycleDay = rawCycleDay <= 0 ? (totalCycleLength + rawCycleDay) : rawCycleDay;

  // Determine Cycle Phase based on day
  let phase: CyclePhase = 'LUTEAL';
  if (currentCycleDay >= 1 && currentCycleDay <= 5) {
    phase = 'MENSTRUAL';
  } else if (currentCycleDay >= 6 && currentCycleDay <= 13) {
    phase = 'FOLLICULAR';
  } else if (currentCycleDay >= 14 && currentCycleDay <= 16) {
    phase = 'OVULATORY';
  } else {
    phase = 'LUTEAL';
  }

  const phaseInfo = CYCLE_PHASE_CONFIGS[phase](currentCycleDay, totalCycleLength);

  // Compute estimated next period date
  const nextPeriodDateObj = new Date(startDateObj);
  const completedCycles = Math.floor(diffDays / totalCycleLength);
  nextPeriodDateObj.setDate(startDateObj.getDate() + ((completedCycles + 1) * totalCycleLength));
  const nextPeriodEstimatedDate = nextPeriodDateObj.toISOString().split('T')[0];

  const daysUntilNextPeriod = Math.max(0, totalCycleLength - currentCycleDay + 1);

  return {
    currentCycleDay,
    totalCycleLength,
    phaseInfo,
    lastPeriodStartDate: mostRecentStart,
    nextPeriodEstimatedDate,
    daysUntilNextPeriod,
    totalCyclesTracked: Math.max(1, periodStartDates.length),
    flowCountThisMonth: bleedingDates.length,
    averageCycleLength: totalCycleLength
  };
}
