import { describe, expect, test } from 'bun:test';
import { buildReminderPlan, DEFAULT_REMINDERS } from '../../src/utils/reminders';
import { computeDayTimes, PrayerConfig } from '../../src/utils/prayerTimes';
import { getHijriDate } from '../../src/utils/hijri';
import { addDays } from '../../src/utils/date';

const princeton: PrayerConfig = {
  method: 'NorthAmerica', madhab: 'shafi', adjustments: {},
  location: { name: 'Princeton, NJ', lat: 40.36, lng: -74.67, tz: 'America/New_York' }
};
const start = '2026-10-30'; // a Friday
const startOfDay = new Date(2026, 9, 30, 0, 0, 0);

describe('reminder plan', () => {
  test('nothing when reminders are off', () => {
    expect(buildReminderPlan({ ...DEFAULT_REMINDERS, enabled: false }, princeton, 0, startOfDay, start)).toEqual([]);
  });

  test('five prayers a day for a week, at the calculated times, soonest first, under the iOS limit', () => {
    const plan = buildReminderPlan({ ...DEFAULT_REMINDERS, enabled: true, kahf: { on: false, time: '10:00' }, ayyamAlBid: { on: false, time: '20:00' } }, princeton, 0, startOfDay, start);
    expect(plan.length).toBe(35);
    expect(plan.length).toBeLessThanOrEqual(64);
    const t = computeDayTimes(princeton, start)!;
    expect(plan[0].at.getTime()).toBe(t.fajr.getTime());
    expect(plan[0].title.startsWith('Fajr')).toBe(true);
    for (let i = 1; i < plan.length; i++) expect(plan[i].at.getTime()).toBeGreaterThanOrEqual(plan[i - 1].at.getTime());
    expect(new Set(plan.map(r => r.id)).size).toBe(plan.length); // unique ids
  });

  test('offset fires before the prayer and says so', () => {
    const plan = buildReminderPlan({ ...DEFAULT_REMINDERS, enabled: true, prayerOffset: 10 }, princeton, 0, startOfDay, start);
    const t = computeDayTimes(princeton, start)!;
    const fajr = plan.find(r => r.title.startsWith('Fajr'))!;
    expect(fajr.at.getTime()).toBe(t.fajr.getTime() - 10 * 60_000);
    expect(fajr.title).toBe('Fajr in 10 min');
  });

  test('past times are skipped', () => {
    const t = computeDayTimes(princeton, start)!;
    const afterAsr = new Date(t.asr.getTime() + 60_000);
    const plan = buildReminderPlan({ ...DEFAULT_REMINDERS, enabled: true }, princeton, 0, afterAsr, start);
    expect(plan.every(r => r.at.getTime() > afterAsr.getTime())).toBe(true);
    expect(plan[0].title.startsWith('Maghrib')).toBe(true);
  });

  test('Friday Kahf reminder on Fridays only, at the chosen time', () => {
    const plan = buildReminderPlan({ ...DEFAULT_REMINDERS, enabled: true, prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false }, ayyamAlBid: { on: false, time: '20:00' } }, princeton, 0, startOfDay, start);
    const kahf = plan.filter(r => r.title.includes('Kahf'));
    expect(kahf.length).toBe(1);
    expect(kahf[0].at.getDay()).toBe(5);
    expect(kahf[0].at.getHours()).toBe(10);
  });

  test('Ayyam al-Bid reminders the evening before Hijri 13, 14 and 15', () => {
    // find a window containing the white days
    let s = start;
    for (let i = 0; i < 30 && getHijriDate(addDays(s, 1)).day !== 13; i++) s = addDays(s, 1);
    const plan = buildReminderPlan(
      { ...DEFAULT_REMINDERS, enabled: true, prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false }, kahf: { on: false, time: '10:00' } },
      princeton, 0, new Date(2000, 0, 1), s
    );
    const bid = plan.filter(r => r.title.includes('Ayyam al-Bid'));
    expect(bid.length).toBe(3);
    expect(bid.map(r => r.body.match(/Tomorrow is (\d+)/)![1])).toEqual(['13', '14', '15']);
    expect(bid.every(r => r.at.getHours() === 20)).toBe(true);
  });

  test('no prayer reminders without a location', () => {
    const plan = buildReminderPlan({ ...DEFAULT_REMINDERS, enabled: true }, { ...princeton, location: undefined }, 0, startOfDay, start);
    expect(plan.some(r => r.title.startsWith('Fajr'))).toBe(false);
    expect(plan.some(r => r.title.includes('Kahf'))).toBe(true);
  });
});
