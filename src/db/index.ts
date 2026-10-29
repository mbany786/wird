import Dexie, { Table } from 'dexie';
import { Habit, HabitSection, HabitLog, TrackerTemplate, MonthlyRemark } from '../types';
import { TEMPLATES } from '../data/templates';

export class HabitTrackerDatabase extends Dexie {
  templates!: Table<TrackerTemplate, string>;
  sections!: Table<HabitSection, string>;
  habits!: Table<Habit, string>;
  logs!: Table<HabitLog, number>;
  remarks!: Table<MonthlyRemark, number>;

  constructor() {
    super('AegisLocalHabitDB');
    this.version(1).stores({
      templates: 'id',
      sections: 'id, order',
      habits: 'id, sectionId, order, category, inputType',
      logs: '++id, habitId, date, [habitId+date], status, timestamp',
      remarks: '++id, [templateId+monthKey], monthKey'
    });
  }

  async seedDefaultTemplates() {
    // Ensure all default templates are present and updated
    for (const t of TEMPLATES) {
      await this.templates.put(t);
      for (const s of t.sections) {
        await this.sections.put(s);
      }
      for (const h of t.habits) {
        await this.habits.put(h);
      }
    }

    // Clean up any unlisted templates (preserving user-created custom trackers)
    const allDbTemplates = await this.templates.toArray();
    const validIds = new Set(TEMPLATES.map(t => t.id));
    for (const dbt of allDbTemplates) {
      if (!validIds.has(dbt.id) && !dbt.id.startsWith('custom_tracker_')) {
        await this.templates.delete(dbt.id);
      }
    }

    // Seed realistic sample logs for Daily Spiritual schedule if no logs exist
    const logCount = await this.logs.count();
    if (logCount === 0) {
      const sampleLogs: HabitLog[] = [];
      const currentMonth = '2026-10';
      const daysInMonth = 29; // Up to today

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
        const dt = new Date(2026, 9, day);
        const isFriday = dt.getDay() === 5;

        // Fard Prayers (Multi-state)
        const prayerStates = ['TAKBEER_OOLA', 'TAKBEER_OOLA', 'TAKBEER_OOLA', 'JAMAT', 'INDIVIDUAL'];
        const getRandomPrayerState = () => prayerStates[Math.floor(Math.random() * prayerStates.length)];

        sampleLogs.push(
          { habitId: 'fajr', date: dateStr, status: 'COMPLETED', stateCode: getRandomPrayerState(), numericValue: 1.0, timestamp: Date.now() },
          { habitId: 'zuhar', date: dateStr, status: 'COMPLETED', stateCode: getRandomPrayerState(), numericValue: 1.0, timestamp: Date.now() },
          { habitId: 'asar', date: dateStr, status: 'COMPLETED', stateCode: getRandomPrayerState(), numericValue: 1.0, timestamp: Date.now() },
          { habitId: 'magrib', date: dateStr, status: 'COMPLETED', stateCode: 'TAKBEER_OOLA', numericValue: 1.0, timestamp: Date.now() },
          { habitId: 'isha', date: dateStr, status: 'COMPLETED', stateCode: getRandomPrayerState(), numericValue: 1.0, timestamp: Date.now() }
        );

        // Nawafil
        if (day % 2 === 1) {
          sampleLogs.push({ habitId: 'tahajjud', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        }
        sampleLogs.push({ habitId: 'ishraq', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        sampleLogs.push({ habitId: 'chaasht', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });

        // Quran
        sampleLogs.push({ habitId: 'surah_yaseen', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        sampleLogs.push({ habitId: 'surah_mulk', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        const pagesRead = [10, 12, 15, 8, 20][day % 5];
        sampleLogs.push({ habitId: 'quran_pages', date: dateStr, status: 'COMPLETED', numericValue: pagesRead, timestamp: Date.now() });

        // Zikr & Moraqiba
        sampleLogs.push({ habitId: 'kalma_3rd', date: dateStr, status: 'COMPLETED', numericValue: 100, timestamp: Date.now() });
        sampleLogs.push({ habitId: 'durood_100', date: dateStr, status: 'COMPLETED', numericValue: 100, timestamp: Date.now() });
        sampleLogs.push({ habitId: 'astaghfar_100', date: dateStr, status: 'COMPLETED', numericValue: 100, timestamp: Date.now() });
        sampleLogs.push({ habitId: 'durood_extended', date: dateStr, status: 'COMPLETED', numericValue: (day % 3 + 1) * 200, timestamp: Date.now() });
        sampleLogs.push({ habitId: 'moraqiba', date: dateStr, status: 'COMPLETED', numericValue: 20, timestamp: Date.now() });
        sampleLogs.push({ habitId: 'nafi_asbat', date: dateStr, status: 'COMPLETED', numericValue: 500, timestamp: Date.now() });

        // Lataif Lesson 1 (sample dual tracking: alternate between 5,000 count and 30 min)
        if (day % 2 === 0) {
          sampleLogs.push({ habitId: 'lataif_1', date: dateStr, status: 'COMPLETED', numericValue: 5000, unitUsed: 'count', timestamp: Date.now() });
        } else if (day % 3 === 0) {
          sampleLogs.push({ habitId: 'lataif_1', date: dateStr, status: 'COMPLETED', numericValue: 30, unitUsed: 'min', timestamp: Date.now() });
        }

        // Ahzab & Daily Litanies
        sampleLogs.push({ habitId: 'wird_latif', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        if (day % 2 === 1) {
          sampleLogs.push({ habitId: 'hizb_al_bahr', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        }
        if (isFriday) {
          sampleLogs.push({ habitId: 'hizb_al_nasr', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        }
        sampleLogs.push({ habitId: 'ratib_al_haddad', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        sampleLogs.push({ habitId: 'hizb_al_nawawi', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });

        // Negative Actions & Vices (Inverse tracking: 0 incidents = clean day, slips penalized)
        if (day === 7) {
          sampleLogs.push({ habitId: 'anger_incidents', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Felt irritated during morning commute', timestamp: Date.now() });
        } else if (day === 19) {
          sampleLogs.push({ habitId: 'anger_incidents', date: dateStr, status: 'FAILED', numericValue: 2, notes: 'Disagreement in meeting', timestamp: Date.now() });
        } else {
          sampleLogs.push({ habitId: 'anger_incidents', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
        }

        if (day === 12) {
          sampleLogs.push({ habitId: 'backbiting_avoidance', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Unintentionally indulged in gossip', timestamp: Date.now() });
        } else {
          sampleLogs.push({ habitId: 'backbiting_avoidance', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
        }

        if (day === 4) {
          sampleLogs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'FAILED', numericValue: 30, timestamp: Date.now() });
        } else if (day === 22) {
          sampleLogs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'FAILED', numericValue: 15, timestamp: Date.now() });
        } else {
          sampleLogs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
        }

        if (day === 15) {
          sampleLogs.push({ habitId: 'guarding_gaze', date: dateStr, status: 'FAILED', numericValue: 1, timestamp: Date.now() });
        } else {
          sampleLogs.push({ habitId: 'guarding_gaze', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
        }

        // Reading tracker samples
        sampleLogs.push(
          { habitId: 'book_primary', date: dateStr, status: 'COMPLETED', numericValue: 25, timestamp: Date.now() },
          { habitId: 'book_secondary', date: dateStr, status: 'COMPLETED', numericValue: [15, 20, 25][day % 3], timestamp: Date.now() },
          { habitId: 'book_classical', date: dateStr, status: 'COMPLETED', numericValue: 15, timestamp: Date.now() },
          { habitId: 'deep_immersion_time', date: dateStr, status: 'COMPLETED', numericValue: 90, timestamp: Date.now() },
          { habitId: 'book_fiction', date: dateStr, status: 'COMPLETED', numericValue: 30, timestamp: Date.now() },
          { habitId: 'reading_notes', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() }
        );

        // Baby & Child Tracker sample logs
        sampleLogs.push(
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
          sampleLogs.push({ habitId: 'child_tantrums', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Overstimulated after late nap', timestamp: Date.now() });
        } else if (day === 21) {
          sampleLogs.push({ habitId: 'child_tantrums', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Overtired before bedtime', timestamp: Date.now() });
        } else {
          sampleLogs.push({ habitId: 'child_tantrums', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
        }

        // Friday specific
        if (isFriday) {
          sampleLogs.push({ habitId: 'surah_kahaf', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
          sampleLogs.push({ habitId: 'participation_jore', date: dateStr, status: 'COMPLETED', stateCode: 'SLOT_2', numericValue: 0.8, timestamp: Date.now() });
        }
      }

      await this.logs.bulkPut(sampleLogs);

      // Seed sample reflection remarks
      await this.remarks.put({
        templateId: 'daily_spiritual_schedule',
        monthKey: '2026-10',
        remarks: 'الحمد لله، feeling steady improvement in Fajr Takbeer-e-Oola. Need to maintain better consistency in Tahajjud and increase evening Moraqiba from 20 to 30 minutes.'
      });

      await this.remarks.put({
        templateId: 'multi_book_reading_tracker',
        monthKey: '2026-10',
        remarks: 'Completed 3 books this month. Average pacing is 70-80 pages daily across morning philosophy and evening literature. Taking marginalia notes consistently improved retention.'
      });

      await this.remarks.put({
        templateId: 'baby_child_routine_tracker',
        monthKey: '2026-10',
        remarks: 'Night sleep stabilized well at ~10.5 hrs. Storytime before bed (reading 3-4 board books) helped smooth the transition to lights out by 8:00 PM. Clean teeth brushing 2x daily and steady potty progress.'
      });
    } else {
      // Backfill negative action logs if they don't exist yet in the database
      const angerCount = await this.logs.where('habitId').equals('anger_incidents').count();
      if (angerCount === 0) {
        const backfillLogs: HabitLog[] = [];
        const currentMonth = '2026-10';
        for (let day = 1; day <= 29; day++) {
          const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
          if (day === 7) {
            backfillLogs.push({ habitId: 'anger_incidents', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Felt irritated during morning commute', timestamp: Date.now() });
          } else if (day === 19) {
            backfillLogs.push({ habitId: 'anger_incidents', date: dateStr, status: 'FAILED', numericValue: 2, notes: 'Disagreement in meeting', timestamp: Date.now() });
          } else {
            backfillLogs.push({ habitId: 'anger_incidents', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
          }

          if (day === 12) {
            backfillLogs.push({ habitId: 'backbiting_avoidance', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Unintentionally indulged in gossip', timestamp: Date.now() });
          } else {
            backfillLogs.push({ habitId: 'backbiting_avoidance', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
          }

          if (day === 4) {
            backfillLogs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'FAILED', numericValue: 30, timestamp: Date.now() });
          } else if (day === 22) {
            backfillLogs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'FAILED', numericValue: 15, timestamp: Date.now() });
          } else {
            backfillLogs.push({ habitId: 'idle_talk_time', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
          }

          if (day === 15) {
            backfillLogs.push({ habitId: 'guarding_gaze', date: dateStr, status: 'FAILED', numericValue: 1, timestamp: Date.now() });
          } else {
            backfillLogs.push({ habitId: 'guarding_gaze', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
          }
        }
        await this.logs.bulkPut(backfillLogs);
      }

      // Backfill baby tracker logs if they don't exist yet
      const babyCount = await this.logs.where('habitId').equals('child_milk_intake').count();
      if (babyCount === 0) {
        const babyLogs: HabitLog[] = [];
        const currentMonth = '2026-10';
        for (let day = 1; day <= 29; day++) {
          const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
          babyLogs.push(
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
            babyLogs.push({ habitId: 'child_tantrums', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Overstimulated after late nap', timestamp: Date.now() });
          } else if (day === 21) {
            babyLogs.push({ habitId: 'child_tantrums', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Overtired before bedtime', timestamp: Date.now() });
          } else {
            babyLogs.push({ habitId: 'child_tantrums', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
          }
        }
        await this.logs.bulkPut(babyLogs);

        await this.remarks.put({
          templateId: 'baby_child_routine_tracker',
          monthKey: '2026-10',
          remarks: 'Night sleep stabilized well at ~10.5 hrs. Storytime before bed (reading 3-4 board books) helped smooth the transition to lights out by 8:00 PM. Clean teeth brushing 2x daily and steady potty progress.'
        });
      }

      // Backfill ahzab logs if they don't exist yet
      const ahzabCount = await this.logs.where('habitId').equals('wird_latif').count();
      if (ahzabCount === 0) {
        const ahzabLogs: HabitLog[] = [];
        const currentMonth = '2026-10';
        for (let day = 1; day <= 29; day++) {
          const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;
          const dt = new Date(2026, 9, day);
          const isFri = dt.getDay() === 5;
          ahzabLogs.push({ habitId: 'wird_latif', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
          if (day % 2 === 1) {
            ahzabLogs.push({ habitId: 'hizb_al_bahr', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
          }
          if (isFri) {
            ahzabLogs.push({ habitId: 'hizb_al_nasr', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
          }
          ahzabLogs.push({ habitId: 'ratib_al_haddad', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
          ahzabLogs.push({ habitId: 'hizb_al_nawawi', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() });
        }
        await this.logs.bulkPut(ahzabLogs);
      }

      // Backfill cycle tracker sample logs if they don't exist yet
      const cycleFlowCount = await this.logs.where('habitId').equals('cycle_flow_level').count();
      if (cycleFlowCount === 0) {
        const cycleLogs: HabitLog[] = [];
        const currentMonth = '2026-10';

        // Prior cycle period: Sept 13-17, 2026
        cycleLogs.push(
          { habitId: 'cycle_flow_level', date: '2026-09-13', status: 'COMPLETED', stateCode: 'FLOW_HEAVY', numericValue: 1, timestamp: Date.now() },
          { habitId: 'cycle_flow_level', date: '2026-09-14', status: 'COMPLETED', stateCode: 'FLOW_HEAVY', numericValue: 1, timestamp: Date.now() },
          { habitId: 'cycle_flow_level', date: '2026-09-15', status: 'COMPLETED', stateCode: 'FLOW_MEDIUM', numericValue: 1, timestamp: Date.now() },
          { habitId: 'cycle_flow_level', date: '2026-09-16', status: 'COMPLETED', stateCode: 'FLOW_LIGHT', numericValue: 1, timestamp: Date.now() },
          { habitId: 'cycle_flow_level', date: '2026-09-17', status: 'COMPLETED', stateCode: 'FLOW_SPOTTING', numericValue: 1, timestamp: Date.now() }
        );

        // Current cycle: Period started on Oct 11, 2026
        for (let day = 1; day <= 29; day++) {
          const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`;

          // Flow & Bleeding
          if (day === 11 || day === 12) {
            cycleLogs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_HEAVY', numericValue: 1, timestamp: Date.now() });
          } else if (day === 13) {
            cycleLogs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_MEDIUM', numericValue: 1, timestamp: Date.now() });
          } else if (day === 14) {
            cycleLogs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_LIGHT', numericValue: 1, timestamp: Date.now() });
          } else if (day === 15) {
            cycleLogs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_SPOTTING', numericValue: 1, timestamp: Date.now() });
          } else {
            cycleLogs.push({ habitId: 'cycle_flow_level', date: dateStr, status: 'COMPLETED', stateCode: 'FLOW_NONE', numericValue: 0, timestamp: Date.now() });
          }

          // Pelvic Pain & Dysmenorrhea
          if (day === 11) {
            cycleLogs.push({ habitId: 'cramps_pelvic_pain', date: dateStr, status: 'COMPLETED', stateCode: 'PAIN_SEVERE', numericValue: 0.0, timestamp: Date.now() });
          } else if (day === 12) {
            cycleLogs.push({ habitId: 'cramps_pelvic_pain', date: dateStr, status: 'COMPLETED', stateCode: 'PAIN_MODERATE', numericValue: 0.45, timestamp: Date.now() });
          } else if (day === 13) {
            cycleLogs.push({ habitId: 'cramps_pelvic_pain', date: dateStr, status: 'COMPLETED', stateCode: 'PAIN_MILD', numericValue: 0.75, timestamp: Date.now() });
          } else {
            cycleLogs.push({ habitId: 'cramps_pelvic_pain', date: dateStr, status: 'COMPLETED', stateCode: 'PAIN_NONE', numericValue: 1.0, timestamp: Date.now() });
          }

          // Energy & Vitality
          if (day >= 11 && day <= 13) {
            cycleLogs.push({ habitId: 'daily_energy_level', date: dateStr, status: 'COMPLETED', stateCode: 'ENERGY_LOW', numericValue: 0.45, timestamp: Date.now() });
          } else if (day >= 16 && day <= 24) {
            cycleLogs.push({ habitId: 'daily_energy_level', date: dateStr, status: 'COMPLETED', stateCode: 'ENERGY_VIBRANT', numericValue: 1.0, timestamp: Date.now() });
          } else {
            cycleLogs.push({ habitId: 'daily_energy_level', date: dateStr, status: 'COMPLETED', stateCode: 'ENERGY_STEADY', numericValue: 0.8, timestamp: Date.now() });
          }

          // Mood State
          if (day >= 11 && day <= 13) {
            cycleLogs.push({ habitId: 'predominant_mood', date: dateStr, status: 'COMPLETED', stateCode: 'MOOD_SENSITIVE', numericValue: 0.5, timestamp: Date.now() });
          } else if (day >= 16 && day <= 24) {
            cycleLogs.push({ habitId: 'predominant_mood', date: dateStr, status: 'COMPLETED', stateCode: 'MOOD_JOYFUL', numericValue: 1.0, timestamp: Date.now() });
          } else if (day >= 27) {
            cycleLogs.push({ habitId: 'predominant_mood', date: dateStr, status: 'COMPLETED', stateCode: 'MOOD_SENSITIVE', numericValue: 0.5, timestamp: Date.now() });
          } else {
            cycleLogs.push({ habitId: 'predominant_mood', date: dateStr, status: 'COMPLETED', stateCode: 'MOOD_FOCUSED', numericValue: 0.8, timestamp: Date.now() });
          }

          // Cervical Fluid
          if (day >= 23 && day <= 25) {
            cycleLogs.push({ habitId: 'cervical_fluid', date: dateStr, status: 'COMPLETED', stateCode: 'CF_EGGWHITE', numericValue: 1.0, timestamp: Date.now() });
          } else if (day >= 16 && day <= 22) {
            cycleLogs.push({ habitId: 'cervical_fluid', date: dateStr, status: 'COMPLETED', stateCode: 'CF_CREAMY', numericValue: 0.6, timestamp: Date.now() });
          }

          // Basal Body Temp
          const bbt = day >= 25 ? 98.4 : 97.6;
          cycleLogs.push({ habitId: 'basal_body_temp', date: dateStr, status: 'COMPLETED', numericValue: bbt, timestamp: Date.now() });

          // Sleep & Nourishment
          cycleLogs.push(
            { habitId: 'restful_sleep_hours', date: dateStr, status: 'COMPLETED', numericValue: day >= 11 && day <= 14 ? 9.0 : 8.5, timestamp: Date.now() },
            { habitId: 'magnesium_hydration', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() },
            { habitId: 'low_sugar_caffeine', date: dateStr, status: 'COMPLETED', numericValue: 1, timestamp: Date.now() }
          );

          // Workouts
          if (day >= 16 && day <= 25) {
            cycleLogs.push({ habitId: 'cycle_synced_workout', date: dateStr, status: 'COMPLETED', numericValue: 40, timestamp: Date.now() });
          } else if (day >= 11 && day <= 15) {
            cycleLogs.push({ habitId: 'cycle_synced_workout', date: dateStr, status: 'COMPLETED', numericValue: 15, timestamp: Date.now() });
          } else {
            cycleLogs.push({ habitId: 'cycle_synced_workout', date: dateStr, status: 'COMPLETED', numericValue: 30, timestamp: Date.now() });
          }

          // Negative Habit: PMS Meltdowns (0 incidents = clean, peaceful emotional regulation)
          if (day === 28) {
            cycleLogs.push({ habitId: 'pms_meltdown_rage', date: dateStr, status: 'FAILED', numericValue: 1, notes: 'Felt overwhelmed and snapped before dinner; recognized PMS fatigue', timestamp: Date.now() });
          } else {
            cycleLogs.push({ habitId: 'pms_meltdown_rage', date: dateStr, status: 'COMPLETED', numericValue: 0, timestamp: Date.now() });
          }
        }

        await this.logs.bulkPut(cycleLogs);

        await this.remarks.put({
          templateId: 'cycle_health_tracker',
          monthKey: '2026-10',
          remarks: 'Cycle sync tracking has been deeply insightful. Energy was radiant during the Follicular and Ovulation phases (Oct 16-24), allowing intense workouts. Currently on Cycle Day 19 (Luteal phase): prioritizing magnesium glycinate, warm soups, and extra sleep to soften PMS mood sensitivity.'
        });
      }
    }
  }
}

export const db = new HabitTrackerDatabase();
