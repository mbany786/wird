import { HabitLog, MonthlyRemark } from '../types';
import { todayStr } from './date';

/**
 * Opt-in sample data ("Explore with sample data").
 *
 * Generates realistic logs for every built-in template covering last month and this month up to
 * today. Every record is tagged `sample: true` so it can be removed without touching real entries.
 */

function buildMonth(monthKey: string, lastDay: number): HabitLog[] {
  const [year, month] = monthKey.split('-').map(Number);
  const logs: HabitLog[] = [];

  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
    const dt = new Date(year, month - 1, day);
    const isFriday = dt.getDay() === 5;

    // Fard Prayers (Multi-state)
    const prayerStates = ['TAKBEER_OOLA', 'TAKBEER_OOLA', 'TAKBEER_OOLA', 'JAMAT', 'INDIVIDUAL'];
    const getRandomPrayerState = () => prayerStates[Math.floor(Math.random() * prayerStates.length)];

    logs.push(
      { habitId: 'fajr', date: dateStr, status: 'COMPLETED', stateCode: getRandomPrayerState(), numericValue: 1.0, timestamp: Date.now() },
      { habitId: 'zuhar', date: dateStr, status: 'COMPLETED', stateCode: getRandomPrayerState(), numericValue: 1.0, timestamp: Date.now() },
      { habitId: 'asar', date: dateStr, status: 'COMPLETED', stateCode: getRandomPrayerState(), numericValue: 1.0, timestamp: Date.now() },
      { habitId: 'magrib', date: dateStr, status: 'COMPLETED', stateCode: 'TAKBEER_OOLA', numericValue: 1.0, timestamp: Date.now() },
      { habitId: 'isha', date: dateStr, status: 'COMPLETED', stateCode: getRandomPrayerState(), numericValue: 1.0, timestamp: Date.now() }
    );

    // Nawafil
    if (day % 2 === 1) {
      logs.push({ habitId: 'tahajjud', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
    }
    logs.push({ habitId: 'ishraq', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
    logs.push({ habitId: 'chaasht', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });

    // Quran
    logs.push({ habitId: 'surah_yaseen', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
    logs.push({ habitId: 'surah_mulk', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
    const pagesRead = [10, 12, 15, 8, 20][day % 5];
    logs.push({ habitId: 'quran_pages', date: dateStr, status: 'COMPLETED', numericValue: pagesRead, timestamp: Date.now() });

    // Zikr & Moraqiba
    logs.push({ habitId: 'kalma_3rd', date: dateStr, status: 'COMPLETED', numericValue: 100, timestamp: Date.now() });
    logs.push({ habitId: 'durood_100', date: dateStr, status: 'COMPLETED', numericValue: 100, timestamp: Date.now() });
    logs.push({ habitId: 'astaghfar_100', date: dateStr, status: 'COMPLETED', numericValue: 100, timestamp: Date.now() });
    logs.push({ habitId: 'durood_extended', date: dateStr, status: 'COMPLETED', numericValue: (day % 3 + 1) * 200, timestamp: Date.now() });
    logs.push({ habitId: 'moraqiba', date: dateStr, status: 'COMPLETED', numericValue: 20, timestamp: Date.now() });
    logs.push({ habitId: 'nafi_asbat', date: dateStr, status: 'COMPLETED', numericValue: 500, timestamp: Date.now() });

    // Lataif Lesson 1 (sample dual tracking: alternate between 5,000 count and 30 min)
    if (day % 2 === 0) {
      logs.push({ habitId: 'lataif_1', date: dateStr, status: 'COMPLETED', numericValue: 5000, unitUsed: 'count', timestamp: Date.now() });
    } else if (day % 3 === 0) {
      logs.push({ habitId: 'lataif_1', date: dateStr, status: 'COMPLETED', numericValue: 30, unitUsed: 'min', timestamp: Date.now() });
    }

    // Ahzab & Daily Litanies
    logs.push({ habitId: 'wird_latif', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
    if (day % 2 === 1) {
      logs.push({ habitId: 'hizb_al_bahr', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
    }
    if (isFriday) {
      logs.push({ habitId: 'hizb_al_nasr', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
    }
    logs.push({ habitId: 'ratib_al_haddad', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
    logs.push({ habitId: 'hizb_al_nawawi', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });

    // Negative Actions & Vices (Inverse tracking: 0 incidents = clean day, slips penalized)
    if (day === 7) {
      logs.push({ habitId: 'anger_incidents', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Felt irritated during morning commute', timestamp: Date.now() });
    } else if (day === 19) {
      logs.push({ habitId: 'anger_incidents', date: dateStr, status: 'FAILED', numericValue: 2, notes: 'Disagreement in meeting', timestamp: Date.now() });
    } else {
      logs.push({ habitId: 'anger_incidents', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
    }

    if (day === 12) {
      logs.push({ habitId: 'backbiting_avoidance', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Unintentionally indulged in gossip', timestamp: Date.now() });
    } else {
      logs.push({ habitId: 'backbiting_avoidance', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
    }

    if (day === 4) {
      logs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'FAILED', numericValue: 30, timestamp: Date.now() });
    } else if (day === 22) {
      logs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'FAILED', numericValue: 15, timestamp: Date.now() });
    } else {
      logs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
    }

    if (day === 15) {
      logs.push({ habitId: 'guarding_gaze', date: dateStr, status: 'FAILED', numericValue: 1, timestamp: Date.now() });
    } else {
      logs.push({ habitId: 'guarding_gaze', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
    }

    // Reading tracker samples
    logs.push(
      { habitId: 'book_primary', date: dateStr, status: 'COMPLETED', numericValue: 25, timestamp: Date.now() },
      { habitId: 'book_secondary', date: dateStr, status: 'COMPLETED', numericValue: [15, 20, 25][day % 3], timestamp: Date.now() },
      { habitId: 'book_classical', date: dateStr, status: 'COMPLETED', numericValue: 15, timestamp: Date.now() },
      { habitId: 'deep_immersion_time', date: dateStr, status: 'COMPLETED', numericValue: 90, timestamp: Date.now() },
      { habitId: 'book_fiction', date: dateStr, status: 'COMPLETED', numericValue: 30, timestamp: Date.now() },
      { habitId: 'reading_notes', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() }
    );

    // Baby & Child Tracker sample logs
    logs.push(
      { habitId: 'child_milk_intake', date: dateStr, status: 'COMPLETED', numericValue: [24, 26, 22, 24][day % 4], timestamp: Date.now() },
      { habitId: 'child_solid_meals', date: dateStr, status: 'COMPLETED', stateCode: day % 7 === 0 ? 'PARTIAL_MEALS' : 'ALL_MEALS', numericValue: 1.0, timestamp: Date.now() },
      { habitId: 'child_water_cups', date: dateStr, status: 'COMPLETED', numericValue: 4, timestamp: Date.now() },
      { habitId: 'child_vitamins', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() },
      { habitId: 'child_night_sleep', date: dateStr, status: 'COMPLETED', numericValue: [10, 10.5, 11, 10][day % 4], timestamp: Date.now() },
      { habitId: 'child_nap_duration', date: dateStr, status: 'COMPLETED', numericValue: [90, 75, 90, 105][day % 4], timestamp: Date.now() },
      { habitId: 'child_bedtime_routine', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() },
      { habitId: 'child_outdoor_play', date: dateStr, status: 'COMPLETED', numericValue: [60, 45, 75, 60][day % 4], timestamp: Date.now() },
      { habitId: 'child_storytime_books', date: dateStr, status: 'COMPLETED', numericValue: [3, 4, 3, 2][day % 4], timestamp: Date.now() },
      { habitId: 'child_tummy_or_motor', date: dateStr, status: 'COMPLETED', numericValue: 30, timestamp: Date.now() },
      { habitId: 'child_teeth_brushing', date: dateStr, status: 'COMPLETED', stateCode: 'BRUSH_2X', numericValue: 1.0, timestamp: Date.now() },
      { habitId: 'child_bath_clean', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() },
      { habitId: 'child_potty_training', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() },
      { habitId: 'child_screen_limit', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() },
      { habitId: 'child_tidy_toys', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() }
    );

    if (day === 8) {
      logs.push({ habitId: 'child_tantrums', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Overstimulated after late nap', timestamp: Date.now() });
    } else if (day === 21) {
      logs.push({ habitId: 'child_tantrums', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Overtired before bedtime', timestamp: Date.now() });
    } else {
      logs.push({ habitId: 'child_tantrums', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
    }

    // Friday specific
    if (isFriday) {
      logs.push({ habitId: 'surah_kahaf', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
      logs.push({ habitId: 'participation_jore', date: dateStr, status: 'COMPLETED', stateCode: 'SLOT_2', numericValue: 0.8, timestamp: Date.now() });
    }
  }

  // Menstrual & cycle health tracker

      // Current cycle: period starts on day 11
      for (let day = 1; day <= lastDay; day++) {
        const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;

        // Flow & Bleeding
        if (day === 11 || day === 12) {
          logs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_HEAVY', numericValue: 1, timestamp: Date.now() });
        } else if (day === 13) {
          logs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_MEDIUM', numericValue: 1, timestamp: Date.now() });
        } else if (day === 14) {
          logs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_LIGHT', numericValue: 1, timestamp: Date.now() });
        } else if (day === 15) {
          logs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_SPOTTING', numericValue: 1, timestamp: Date.now() });
        } else {
          logs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_NONE', numericValue: 0, timestamp: Date.now() });
        }

        // Pelvic Pain & Dysmenorrhea
        if (day === 11) {
          logs.push({ habitId: 'cramps_pelvic_pain', date: dateStr, status: 'COMPLETED', stateCode: 'PAIN_SEVERE', numericValue: 0.0, timestamp: Date.now() });
        } else if (day === 12) {
          logs.push({ habitId: 'cramps_pelvic_pain', date: dateStr, status: 'COMPLETED', stateCode: 'PAIN_MODERATE', numericValue: 0.45, timestamp: Date.now() });
        } else if (day === 13) {
          logs.push({ habitId: 'cramps_pelvic_pain', date: dateStr, status: 'COMPLETED', stateCode: 'PAIN_MILD', numericValue: 0.75, timestamp: Date.now() });
        } else {
          logs.push({ habitId: 'cramps_pelvic_pain', date: dateStr, status: 'COMPLETED', stateCode: 'PAIN_NONE', numericValue: 1.0, timestamp: Date.now() });
        }

        // Energy & Vitality
        if (day >= 11 && day <= 13) {
          logs.push({ habitId: 'daily_energy_level', date: dateStr, status: 'COMPLETED', stateCode: 'ENERGY_LOW', numericValue: 0.45, timestamp: Date.now() });
        } else if (day >= 16 && day <= 24) {
          logs.push({ habitId: 'daily_energy_level', date: dateStr, status: 'COMPLETED', stateCode: 'ENERGY_VIBRANT', numericValue: 1.0, timestamp: Date.now() });
        } else {
          logs.push({ habitId: 'daily_energy_level', date: dateStr, status: 'COMPLETED', stateCode: 'ENERGY_STEADY', numericValue: 0.8, timestamp: Date.now() });
        }

        // Mood State
        if (day >= 11 && day <= 13) {
          logs.push({ habitId: 'predominant_mood', date: dateStr, status: 'COMPLETED', stateCode: 'MOOD_SENSITIVE', numericValue: 0.5, timestamp: Date.now() });
        } else if (day >= 16 && day <= 24) {
          logs.push({ habitId: 'predominant_mood', date: dateStr, status: 'COMPLETED', stateCode: 'MOOD_JOYFUL', numericValue: 1.0, timestamp: Date.now() });
        } else if (day >= 27) {
          logs.push({ habitId: 'predominant_mood', date: dateStr, status: 'COMPLETED', stateCode: 'MOOD_SENSITIVE', numericValue: 0.5, timestamp: Date.now() });
        } else {
          logs.push({ habitId: 'predominant_mood', date: dateStr, status: 'COMPLETED', stateCode: 'MOOD_FOCUSED', numericValue: 0.8, timestamp: Date.now() });
        }

        // Cervical Fluid
        if (day >= 23 && day <= 25) {
          logs.push({ habitId: 'cervical_fluid', date: dateStr, status: 'COMPLETED', stateCode: 'CF_EGGWHITE', numericValue: 1.0, timestamp: Date.now() });
        } else if (day >= 16 && day <= 22) {
          logs.push({ habitId: 'cervical_fluid', date: dateStr, status: 'COMPLETED', stateCode: 'CF_CREAMY', numericValue: 0.6, timestamp: Date.now() });
        }

        // Basal Body Temp
        const bbt = day >= 25 ? 98.4 : 97.6;
        logs.push({ habitId: 'basal_body_temp', date: dateStr, status: 'COMPLETED', numericValue: bbt, timestamp: Date.now() });

        // Sleep & Nourishment
        logs.push(
          { habitId: 'restful_sleep_hours', date: dateStr, status: 'COMPLETED', numericValue: day >= 11 && day <= 14 ? 9.0 : 8.5, timestamp: Date.now() },
          { habitId: 'magnesium_hydration', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() },
          { habitId: 'low_sugar_caffeine', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() }
        );

        // Workouts
        if (day >= 16 && day <= 25) {
          logs.push({ habitId: 'cycle_synced_workout', date: dateStr, status: 'COMPLETED', numericValue: 40, timestamp: Date.now() });
        } else if (day >= 11 && day <= 15) {
          logs.push({ habitId: 'cycle_synced_workout', date: dateStr, status: 'COMPLETED', numericValue: 15, timestamp: Date.now() });
        } else {
          logs.push({ habitId: 'cycle_synced_workout', date: dateStr, status: 'COMPLETED', numericValue: 30, timestamp: Date.now() });
        }

        // Negative Habit: PMS Meltdowns (0 incidents = clean, peaceful emotional regulation)
        if (day === 28) {
          logs.push({ habitId: 'pms_meltdown_rage', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Felt overwhelmed and snapped before dinner; recognized PMS fatigue', timestamp: Date.now() });
        } else {
          logs.push({ habitId: 'pms_meltdown_rage', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
        }
      }

  return logs;
}

function buildRemarks(monthKey: string): MonthlyRemark[] {
  return [
    { templateId: 'daily_spiritual_schedule', monthKey, remarks: 'الحمد لله، feeling steady improvement in Fajr Takbeer-e-Oola. Need to maintain better consistency in Tahajjud and increase evening Moraqiba from 20 to 30 minutes.' },
    { templateId: 'multi_book_reading_tracker', monthKey, remarks: 'Completed 3 books this month. Average pacing is 70-80 pages daily across morning philosophy and evening literature. Taking marginalia notes consistently improved retention.' },
    { templateId: 'baby_child_routine_tracker', monthKey, remarks: 'Night sleep stabilized well at ~10.5 hrs. Storytime before bed (reading 3-4 board books) helped smooth the transition to lights out by 8:00 PM. Clean teeth brushing 2x daily and steady potty progress.' },
    { templateId: 'cycle_health_tracker', monthKey, remarks: 'Cycle sync tracking has been deeply insightful. Energy was radiant during the Follicular and Ovulation phases (Oct 16-24), allowing intense workouts. Currently on Cycle Day 19 (Luteal phase): prioritizing magnesium glycinate, warm soups, and extra sleep to soften PMS mood sensitivity.' }
  ];
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Sample logs + remarks for last month (full) and this month up to today, all tagged `sample`. */
export function generateSampleData(today: string = todayStr()): { logs: HabitLog[]; remarks: MonthlyRemark[] } {
  const [y, m, d] = today.split('-').map(Number);
  const thisMonth = `${y}-${pad(m)}`;
  const prev = new Date(y, m - 2, 1);
  const prevMonth = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;
  const prevDays = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();

  const logs = [...buildMonth(prevMonth, prevDays), ...buildMonth(thisMonth, d)].map(l => ({ ...l, sample: true }));
  const remarks = [...buildRemarks(prevMonth), ...buildRemarks(thisMonth)].map(r => ({ ...r, sample: true }));
  return { logs, remarks };
}
