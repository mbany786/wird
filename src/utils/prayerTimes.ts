import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';
import { parseLocalDate } from './date';

/** Offline prayer-time calculation (adhan library). */

export type CalcMethodName =
  | 'MuslimWorldLeague' | 'Egyptian' | 'Karachi' | 'UmmAlQura' | 'Dubai' | 'MoonsightingCommittee'
  | 'NorthAmerica' | 'Kuwait' | 'Qatar' | 'Singapore' | 'Tehran' | 'Turkey';
export type MadhabName = 'shafi' | 'hanafi';
export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerLocation {
  name: string;
  lat: number;
  lng: number;
  /** IANA time zone used to display times (the city's, or the device's for "my location") */
  tz: string;
}

export interface PrayerConfig {
  location?: PrayerLocation;
  method: CalcMethodName;
  madhab: MadhabName;
  /** Minutes added to each calculated time (e.g. mosque iqamah habits) */
  adjustments: Partial<Record<PrayerKey | 'sunrise', number>>;
}

export const DEFAULT_PRAYER_CONFIG: PrayerConfig = { method: 'MuslimWorldLeague', madhab: 'shafi', adjustments: {} };

export const METHOD_LABEL: Record<CalcMethodName, string> = {
  NorthAmerica: 'ISNA (North America)',
  MuslimWorldLeague: 'Muslim World League',
  MoonsightingCommittee: 'Moonsighting Committee',
  Karachi: 'University of Islamic Sciences, Karachi',
  UmmAlQura: 'Umm al-Qura (Makkah)',
  Egyptian: 'Egyptian General Authority',
  Dubai: 'Dubai',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Singapore: 'Singapore / Malaysia / Indonesia',
  Turkey: 'Diyanet (Türkiye)',
  Tehran: 'Tehran (Institute of Geophysics)'
};

export const PRAYER_LABEL: Record<PrayerKey | 'sunrise', string> = {
  fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Zuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha'
};

/** Sensible defaults for a location the user picked by GPS or coordinates. */
export function suggestConventions(lat: number, lng: number): { method: CalcMethodName; madhab: MadhabName } {
  if (lng < -30) return { method: 'NorthAmerica', madhab: 'shafi' };
  if (lng >= 60 && lng <= 93 && lat >= 5 && lat <= 38) return { method: 'Karachi', madhab: 'hanafi' };
  if (lng >= 26 && lng <= 45 && lat >= 36 && lat <= 42) return { method: 'Turkey', madhab: 'hanafi' };
  if (lng >= 25 && lng < 35 && lat >= 20 && lat < 32) return { method: 'Egyptian', madhab: 'shafi' };
  if (lng >= 34 && lng <= 60 && lat >= 12 && lat < 33) return { method: 'UmmAlQura', madhab: 'shafi' };
  if (lng >= 95 && lng <= 141 && lat >= -11 && lat <= 8) return { method: 'Singapore', madhab: 'shafi' };
  if (lng >= -11 && lng <= 2 && lat >= 49 && lat <= 61) return { method: 'MoonsightingCommittee', madhab: 'hanafi' };
  return { method: 'MuslimWorldLeague', madhab: 'shafi' };
}

export interface DayTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  /** Start of the last third of the night before this day's Fajr (Tahajjud) */
  tahajjud: Date;
  /** ~15 minutes after sunrise */
  ishraq: Date;
  /** Chasht / Duha: about a quarter of the way from sunrise to Zuhr */
  chasht: Date;
}

/** Calculates times for a local date (YYYY-MM-DD) at the configured location. */
export function computeDayTimes(config: PrayerConfig, dateStr: string): DayTimes | null {
  if (!config.location) return null;
  const coords = new Coordinates(config.location.lat, config.location.lng);
  const params = CalculationMethod[config.method]();
  params.madhab = config.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule = HighLatitudeRule.recommended(coords);
  params.adjustments = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, ...config.adjustments };

  const date = parseLocalDate(dateStr);
  const today = new PrayerTimes(coords, date, params);
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  const yesterday = new PrayerTimes(coords, prev, params);
  // Last third of the night between yesterday's Maghrib and today's Fajr
  const night = today.fajr.getTime() - yesterday.maghrib.getTime();
  const tahajjud = new Date(yesterday.maghrib.getTime() + (night * 2) / 3);

  return {
    fajr: today.fajr,
    sunrise: today.sunrise,
    dhuhr: today.dhuhr,
    asr: today.asr,
    maghrib: today.maghrib,
    isha: today.isha,
    tahajjud,
    ishraq: new Date(today.sunrise.getTime() + 15 * 60_000),
    chasht: new Date(today.sunrise.getTime() + (today.dhuhr.getTime() - today.sunrise.getTime()) / 4)
  };
}

export function formatTime(d: Date, tz?: string): string {
  try {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', timeZone: tz });
  } catch {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
}

export const PRAYER_ORDER: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Next obligatory prayer after `now` today (null after Isha). */
export function nextPrayer(times: DayTimes, now = new Date()): PrayerKey | null {
  return PRAYER_ORDER.find(k => times[k].getTime() > now.getTime()) ?? null;
}

export function deviceTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
}

/** "1h 20m" / "35m" until a time. */
export function untilLabel(target: Date, now = new Date()): string {
  const mins = Math.max(0, Math.round((target.getTime() - now.getTime()) / 60_000));
  const h = Math.floor(mins / 60);
  return h ? `${h}h ${mins % 60}m` : `${mins}m`;
}

/** Matches the template's prayer habits to prayer times by id, then by name. */
const NAME_PATTERNS: Record<PrayerKey, RegExp> = {
  fajr: /^fajr\b/i, dhuhr: /^(zuhr|zuhar|dhuhr|duhr|zohar)\b/i, asr: /^(asr|asar)\b/i, maghrib: /^(maghrib|magrib)\b/i, isha: /^isha\b/i
};
const ID_MATCH: Record<PrayerKey, string[]> = { fajr: ['fajr'], dhuhr: ['zuhar', 'dhuhr', 'zuhr'], asr: ['asar', 'asr'], maghrib: ['magrib', 'maghrib'], isha: ['isha'] };

export function findPrayerHabit<T extends { id: string; title: string; multiStates?: unknown[] }>(habits: T[], key: PrayerKey): T | undefined {
  return habits.find(h => ID_MATCH[key].includes(h.id)) ?? habits.find(h => NAME_PATTERNS[key].test(h.title.trim()) && !!h.multiStates?.length);
}
