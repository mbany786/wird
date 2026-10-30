/**
 * Built-in city list for offline prayer times (no network lookup).
 * Coordinates are city centres (2 decimals ≈ 1 km, well under a minute of prayer-time difference).
 * `method` / `madhab` are the conventions most commonly used there; users can change both.
 */
import type { CalcMethodName, MadhabName } from '../utils/prayerTimes';

export interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
  method: CalcMethodName;
  madhab: MadhabName;
}

const NA = { method: 'NorthAmerica' as const, madhab: 'shafi' as const };
const EU = { method: 'MuslimWorldLeague' as const, madhab: 'shafi' as const };
const UK = { method: 'MoonsightingCommittee' as const, madhab: 'hanafi' as const };
const PK = { method: 'Karachi' as const, madhab: 'hanafi' as const };
const GULF = { method: 'UmmAlQura' as const, madhab: 'shafi' as const };
const SEA = { method: 'Singapore' as const, madhab: 'shafi' as const };

export const CITIES: City[] = [
  // United States
  { name: 'New York', country: 'United States', lat: 40.71, lng: -74.01, tz: 'America/New_York', ...NA },
  { name: 'Princeton, NJ', country: 'United States', lat: 40.36, lng: -74.67, tz: 'America/New_York', ...NA },
  { name: 'Edison, NJ', country: 'United States', lat: 40.52, lng: -74.41, tz: 'America/New_York', ...NA },
  { name: 'Jersey City, NJ', country: 'United States', lat: 40.73, lng: -74.08, tz: 'America/New_York', ...NA },
  { name: 'Philadelphia', country: 'United States', lat: 39.95, lng: -75.17, tz: 'America/New_York', ...NA },
  { name: 'Washington, DC', country: 'United States', lat: 38.91, lng: -77.04, tz: 'America/New_York', ...NA },
  { name: 'Baltimore', country: 'United States', lat: 39.29, lng: -76.61, tz: 'America/New_York', ...NA },
  { name: 'Boston', country: 'United States', lat: 42.36, lng: -71.06, tz: 'America/New_York', ...NA },
  { name: 'Atlanta', country: 'United States', lat: 33.75, lng: -84.39, tz: 'America/New_York', ...NA },
  { name: 'Miami', country: 'United States', lat: 25.76, lng: -80.19, tz: 'America/New_York', ...NA },
  { name: 'Dearborn, MI', country: 'United States', lat: 42.32, lng: -83.18, tz: 'America/Detroit', ...NA },
  { name: 'Chicago', country: 'United States', lat: 41.88, lng: -87.63, tz: 'America/Chicago', ...NA },
  { name: 'Minneapolis', country: 'United States', lat: 44.98, lng: -93.27, tz: 'America/Chicago', ...NA },
  { name: 'Houston', country: 'United States', lat: 29.76, lng: -95.37, tz: 'America/Chicago', ...NA },
  { name: 'Dallas', country: 'United States', lat: 32.78, lng: -96.8, tz: 'America/Chicago', ...NA },
  { name: 'Denver', country: 'United States', lat: 39.74, lng: -104.99, tz: 'America/Denver', ...NA },
  { name: 'Phoenix', country: 'United States', lat: 33.45, lng: -112.07, tz: 'America/Phoenix', ...NA },
  { name: 'Los Angeles', country: 'United States', lat: 34.05, lng: -118.24, tz: 'America/Los_Angeles', ...NA },
  { name: 'San Francisco', country: 'United States', lat: 37.77, lng: -122.42, tz: 'America/Los_Angeles', ...NA },
  { name: 'Seattle', country: 'United States', lat: 47.61, lng: -122.33, tz: 'America/Los_Angeles', ...NA },
  // Canada
  { name: 'Toronto', country: 'Canada', lat: 43.65, lng: -79.38, tz: 'America/Toronto', ...NA },
  { name: 'Mississauga', country: 'Canada', lat: 43.59, lng: -79.64, tz: 'America/Toronto', ...NA },
  { name: 'Montreal', country: 'Canada', lat: 45.5, lng: -73.57, tz: 'America/Toronto', ...NA },
  { name: 'Calgary', country: 'Canada', lat: 51.05, lng: -114.07, tz: 'America/Edmonton', ...NA },
  { name: 'Vancouver', country: 'Canada', lat: 49.28, lng: -123.12, tz: 'America/Vancouver', ...NA },
  // United Kingdom & Ireland
  { name: 'London', country: 'United Kingdom', lat: 51.51, lng: -0.13, tz: 'Europe/London', ...UK },
  { name: 'Birmingham', country: 'United Kingdom', lat: 52.49, lng: -1.89, tz: 'Europe/London', ...UK },
  { name: 'Manchester', country: 'United Kingdom', lat: 53.48, lng: -2.24, tz: 'Europe/London', ...UK },
  { name: 'Bradford', country: 'United Kingdom', lat: 53.8, lng: -1.76, tz: 'Europe/London', ...UK },
  { name: 'Leicester', country: 'United Kingdom', lat: 52.64, lng: -1.13, tz: 'Europe/London', ...UK },
  { name: 'Glasgow', country: 'United Kingdom', lat: 55.86, lng: -4.25, tz: 'Europe/London', ...UK },
  { name: 'Dublin', country: 'Ireland', lat: 53.35, lng: -6.26, tz: 'Europe/Dublin', ...EU },
  // Europe
  { name: 'Paris', country: 'France', lat: 48.86, lng: 2.35, tz: 'Europe/Paris', ...EU },
  { name: 'Brussels', country: 'Belgium', lat: 50.85, lng: 4.35, tz: 'Europe/Brussels', ...EU },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.37, lng: 4.9, tz: 'Europe/Amsterdam', ...EU },
  { name: 'Berlin', country: 'Germany', lat: 52.52, lng: 13.4, tz: 'Europe/Berlin', ...EU },
  { name: 'Oslo', country: 'Norway', lat: 59.91, lng: 10.75, tz: 'Europe/Oslo', ...EU },
  { name: 'Stockholm', country: 'Sweden', lat: 59.33, lng: 18.07, tz: 'Europe/Stockholm', ...EU },
  { name: 'Istanbul', country: 'Türkiye', lat: 41.01, lng: 28.98, tz: 'Europe/Istanbul', method: 'Turkey', madhab: 'hanafi' },
  // Middle East & North Africa
  { name: 'Makkah', country: 'Saudi Arabia', lat: 21.42, lng: 39.83, tz: 'Asia/Riyadh', ...GULF },
  { name: 'Madinah', country: 'Saudi Arabia', lat: 24.47, lng: 39.61, tz: 'Asia/Riyadh', ...GULF },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.71, lng: 46.68, tz: 'Asia/Riyadh', ...GULF },
  { name: 'Jeddah', country: 'Saudi Arabia', lat: 21.49, lng: 39.19, tz: 'Asia/Riyadh', ...GULF },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2, lng: 55.27, tz: 'Asia/Dubai', method: 'Dubai', madhab: 'shafi' },
  { name: 'Abu Dhabi', country: 'United Arab Emirates', lat: 24.45, lng: 54.38, tz: 'Asia/Dubai', method: 'Dubai', madhab: 'shafi' },
  { name: 'Doha', country: 'Qatar', lat: 25.29, lng: 51.53, tz: 'Asia/Qatar', method: 'Qatar', madhab: 'shafi' },
  { name: 'Kuwait City', country: 'Kuwait', lat: 29.38, lng: 47.99, tz: 'Asia/Kuwait', method: 'Kuwait', madhab: 'shafi' },
  { name: 'Amman', country: 'Jordan', lat: 31.95, lng: 35.93, tz: 'Asia/Amman', ...EU },
  { name: 'Cairo', country: 'Egypt', lat: 30.04, lng: 31.24, tz: 'Africa/Cairo', method: 'Egyptian', madhab: 'shafi' },
  // South Asia
  { name: 'Karachi', country: 'Pakistan', lat: 24.86, lng: 67.01, tz: 'Asia/Karachi', ...PK },
  { name: 'Lahore', country: 'Pakistan', lat: 31.55, lng: 74.34, tz: 'Asia/Karachi', ...PK },
  { name: 'Islamabad', country: 'Pakistan', lat: 33.68, lng: 73.05, tz: 'Asia/Karachi', ...PK },
  { name: 'Rawalpindi', country: 'Pakistan', lat: 33.6, lng: 73.04, tz: 'Asia/Karachi', ...PK },
  { name: 'Faisalabad', country: 'Pakistan', lat: 31.42, lng: 73.08, tz: 'Asia/Karachi', ...PK },
  { name: 'Multan', country: 'Pakistan', lat: 30.2, lng: 71.47, tz: 'Asia/Karachi', ...PK },
  { name: 'Peshawar', country: 'Pakistan', lat: 34.01, lng: 71.58, tz: 'Asia/Karachi', ...PK },
  { name: 'Hyderabad', country: 'Pakistan', lat: 25.4, lng: 68.37, tz: 'Asia/Karachi', ...PK },
  { name: 'Delhi', country: 'India', lat: 28.61, lng: 77.21, tz: 'Asia/Kolkata', ...PK },
  { name: 'Mumbai', country: 'India', lat: 19.08, lng: 72.88, tz: 'Asia/Kolkata', ...PK },
  { name: 'Hyderabad', country: 'India', lat: 17.39, lng: 78.49, tz: 'Asia/Kolkata', ...PK },
  { name: 'Lucknow', country: 'India', lat: 26.85, lng: 80.95, tz: 'Asia/Kolkata', ...PK },
  { name: 'Bengaluru', country: 'India', lat: 12.97, lng: 77.59, tz: 'Asia/Kolkata', ...PK },
  { name: 'Dhaka', country: 'Bangladesh', lat: 23.81, lng: 90.41, tz: 'Asia/Dhaka', ...PK },
  { name: 'Chattogram', country: 'Bangladesh', lat: 22.36, lng: 91.78, tz: 'Asia/Dhaka', ...PK },
  // South-East Asia
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.14, lng: 101.69, tz: 'Asia/Kuala_Lumpur', ...SEA },
  { name: 'Singapore', country: 'Singapore', lat: 1.35, lng: 103.82, tz: 'Asia/Singapore', ...SEA },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.21, lng: 106.85, tz: 'Asia/Jakarta', ...SEA },
  // Africa
  { name: 'Lagos', country: 'Nigeria', lat: 6.52, lng: 3.38, tz: 'Africa/Lagos', ...EU },
  { name: 'Nairobi', country: 'Kenya', lat: -1.29, lng: 36.82, tz: 'Africa/Nairobi', ...EU },
  { name: 'Johannesburg', country: 'South Africa', lat: -26.2, lng: 28.05, tz: 'Africa/Johannesburg', ...EU },
  { name: 'Cape Town', country: 'South Africa', lat: -33.92, lng: 18.42, tz: 'Africa/Johannesburg', ...EU },
  // Australia
  { name: 'Sydney', country: 'Australia', lat: -33.87, lng: 151.21, tz: 'Australia/Sydney', ...EU },
  { name: 'Melbourne', country: 'Australia', lat: -37.81, lng: 144.96, tz: 'Australia/Melbourne', ...EU }
];
