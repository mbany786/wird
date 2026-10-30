import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { computeDayTimes, formatTime, PrayerConfig, PrayerKey, PRAYER_LABEL, PRAYER_ORDER } from './prayerTimes';
import { addDays, parseLocalDate, todayStr } from './date';
import { getHijriDate } from './hijri';

/** Local reminders: planned for the next week and re-planned each time the app opens. */

export interface ReminderConfig {
  enabled: boolean;
  prayers: Record<PrayerKey, boolean>;
  /** Minutes before the prayer time (0 = at the time) */
  prayerOffset: number;
  tahajjud: boolean;
  kahf: { on: boolean; time: string };            // Friday, HH:MM
  ayyamAlBid: { on: boolean; time: string };      // evening before 13/14/15 Hijri
  morningAdhkar: { on: boolean; time: string };
  eveningAdhkar: { on: boolean; time: string };
}

export const DEFAULT_REMINDERS: ReminderConfig = {
  enabled: false,
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  prayerOffset: 0,
  tahajjud: false,
  kahf: { on: true, time: '10:00' },
  ayyamAlBid: { on: true, time: '20:00' },
  morningAdhkar: { on: false, time: '07:00' },
  eveningAdhkar: { on: false, time: '17:30' }
};

export interface PlannedReminder {
  id: number;
  at: Date;
  title: string;
  body: string;
}

const PLAN_DAYS = 7;
const MAX_PENDING = 60; // iOS allows 64 pending local notifications per app

function atTime(dateStr: string, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  const d = parseLocalDate(dateStr);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** Pure: everything that should fire in the next week, soonest first. */
export function buildReminderPlan(
  config: ReminderConfig,
  prayer: PrayerConfig,
  hijriOffset = 0,
  now = new Date(),
  startDate = todayStr()
): PlannedReminder[] {
  if (!config.enabled) return [];
  const out: PlannedReminder[] = [];
  const tz = prayer.location?.tz;

  for (let i = 0; i < PLAN_DAYS; i++) {
    const dateStr = addDays(startDate, i);
    const base = (i + 1) * 100; // stable ids per day slot
    const times = computeDayTimes(prayer, dateStr);

    if (times) {
      PRAYER_ORDER.forEach((k, idx) => {
        if (!config.prayers[k]) return;
        const at = new Date(times[k].getTime() - config.prayerOffset * 60_000);
        out.push({
          id: base + idx,
          at,
          title: config.prayerOffset ? `${PRAYER_LABEL[k]} in ${config.prayerOffset} min` : `${PRAYER_LABEL[k]} · ${formatTime(times[k], tz)}`,
          body: config.prayerOffset ? `${PRAYER_LABEL[k]} is at ${formatTime(times[k], tz)}.` : `It's time for ${PRAYER_LABEL[k]}.`
        });
      });
      if (config.tahajjud) {
        out.push({ id: base + 10, at: times.tahajjud, title: 'Tahajjud', body: 'The last third of the night has begun.' });
      }
    }

    const weekday = parseLocalDate(dateStr).getDay();
    if (config.kahf.on && weekday === 5) {
      out.push({ id: base + 20, at: atTime(dateStr, config.kahf.time), title: 'Friday · Surah Al-Kahf', body: 'Jumu‘ah Mubarak. A reminder to recite Surah Al-Kahf today.' });
    }
    if (config.ayyamAlBid.on) {
      const tomorrow = getHijriDate(addDays(dateStr, 1), hijriOffset);
      if (tomorrow.day >= 13 && tomorrow.day <= 15) {
        out.push({
          id: base + 30,
          at: atTime(dateStr, config.ayyamAlBid.time),
          title: 'Fast tomorrow · Ayyam al-Bid',
          body: `Tomorrow is ${tomorrow.day} ${tomorrow.monthName}, one of the white days.`
        });
      }
    }
    if (config.morningAdhkar.on) out.push({ id: base + 40, at: atTime(dateStr, config.morningAdhkar.time), title: 'Morning adhkar', body: 'Time for your morning remembrance.' });
    if (config.eveningAdhkar.on) out.push({ id: base + 41, at: atTime(dateStr, config.eveningAdhkar.time), title: 'Evening adhkar', body: 'Time for your evening remembrance.' });
  }

  return out
    .filter(r => r.at.getTime() > now.getTime() + 30_000)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_PENDING);
}

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';

export async function notificationPermission(): Promise<PermissionState> {
  try {
    const r = await LocalNotifications.checkPermissions();
    return r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'unavailable';
  }
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  try {
    const r = await LocalNotifications.requestPermissions();
    return r.display === 'granted' ? 'granted' : r.display === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'unavailable';
  }
}

/** Replaces all pending Wird reminders with the given plan. Returns how many were scheduled. */
export async function applyReminderPlan(plan: PlannedReminder[]): Promise<number> {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
    }
    if (!plan.length) return 0;
    if ((await notificationPermission()) !== 'granted') return 0;
    await LocalNotifications.schedule({
      notifications: plan.map(r => ({
        id: r.id,
        title: r.title,
        body: r.body,
        schedule: { at: r.at, allowWhileIdle: true },
        ...(Capacitor.getPlatform() === 'ios' ? { sound: undefined } : {})
      }))
    });
    return plan.length;
  } catch {
    return 0;
  }
}
