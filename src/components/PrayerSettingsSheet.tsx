import React, { useMemo, useState } from 'react';
import { LocateFixed, MapPin, Search, Minus, Plus, ChevronDown } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Sheet, SheetSection } from './Sheet';
import { CITIES } from '../data/cities';
import {
  CalcMethodName, computeDayTimes, deviceTimeZone, formatTime, METHOD_LABEL, PrayerConfig, PrayerKey, PRAYER_LABEL, suggestConventions
} from '../utils/prayerTimes';
import { todayStr } from '../utils/date';

interface PrayerSettingsSheetProps {
  config: PrayerConfig;
  onChange: (config: PrayerConfig) => void;
  onClose: () => void;
  /** Extra sections rendered below (reminders) */
  children?: React.ReactNode;
}

const field = 'w-full h-11 px-3 rounded-xl bg-slate-950 border border-slate-700 text-[15px] text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export const PrayerSettingsSheet: React.FC<PrayerSettingsSheetProps> = ({ config, onChange, onClose, children }) => {
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [showCoords, setShowCoords] = useState(false);
  const [lat, setLat] = useState(config.location ? String(config.location.lat) : '');
  const [lng, setLng] = useState(config.location ? String(config.location.lng) : '');
  const [showAdjust, setShowAdjust] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return CITIES.filter(c => `${c.name} ${c.country}`.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const preview = useMemo(() => computeDayTimes(config, todayStr()), [config]);

  const useMyLocation = async () => {
    setLocating(true);
    setLocError(null);
    try {
      const perm = await Geolocation.checkPermissions().catch(() => null);
      if (perm && perm.location === 'denied') throw new Error('denied');
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
      const la = Math.round(pos.coords.latitude * 1000) / 1000;
      const lo = Math.round(pos.coords.longitude * 1000) / 1000;
      onChange({ ...config, ...suggestConventions(la, lo), location: { name: 'My location', lat: la, lng: lo, tz: deviceTimeZone() } });
      setLat(String(la));
      setLng(String(lo));
    } catch (e) {
      const msg = String((e as Error)?.message ?? e).toLowerCase();
      setLocError(
        msg.includes('denied') || msg.includes('permission')
          ? 'Location access is off for Wird. Pick a city below, or allow location in iPhone Settings → Wird.'
          : "Couldn't get your location. Pick a city below or enter coordinates."
      );
    } finally {
      setLocating(false);
    }
  };

  const applyCoords = () => {
    const la = Number(lat), lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) {
      setLocError('Latitude must be between −90 and 90, longitude between −180 and 180.');
      return;
    }
    setLocError(null);
    onChange({ ...config, ...suggestConventions(la, lo), location: { name: `${la.toFixed(2)}, ${lo.toFixed(2)}`, lat: la, lng: lo, tz: deviceTimeZone() } });
  };

  const adjust = (k: PrayerKey | 'sunrise', delta: number) =>
    onChange({ ...config, adjustments: { ...config.adjustments, [k]: Math.max(-30, Math.min(30, (config.adjustments[k] ?? 0) + delta)) } });

  return (
    <Sheet title="Prayer times" subtitle="Calculated on this device. Nothing is sent anywhere." onClose={onClose}>
      <SheetSection title="Location">
        <div className="flex items-center gap-2 mb-3 text-[15px]">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className={config.location ? 'text-slate-100 font-medium' : 'text-slate-400'}>
            {config.location ? config.location.name : 'Not set'}
          </span>
          {config.location && <span className="text-[13px] text-slate-500 ml-auto">{config.location.tz.replace(/_/g, ' ')}</span>}
        </div>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[15px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <LocateFixed className="w-4 h-4" />
          {locating ? 'Finding you…' : 'Use my location'}
        </button>

        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            aria-label="Search city"
            placeholder="Search city (e.g. Lahore, Toronto)"
            className={`${field} pl-9`}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        {results.length > 0 && (
          <ul className="mt-2 rounded-xl border border-slate-800 divide-y divide-slate-800 overflow-hidden">
            {results.map(c => (
              <li key={`${c.name}-${c.country}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ ...config, method: c.method, madhab: c.madhab, location: { name: `${c.name}, ${c.country}`, lat: c.lat, lng: c.lng, tz: c.tz } });
                    setQuery('');
                    setLat(String(c.lat));
                    setLng(String(c.lng));
                    setLocError(null);
                  }}
                  className="w-full text-left px-3 min-h-[44px] bg-slate-950 hover:bg-slate-900 text-[15px]"
                >
                  {c.name} <span className="text-slate-500">· {c.country}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && results.length === 0 && (
          <p className="text-[13px] text-slate-400 mt-2">Not in the built-in list. Use your location or enter coordinates.</p>
        )}

        <button type="button" onClick={() => setShowCoords(s => !s)} className="mt-2 text-[13px] text-emerald-400 min-h-[36px] flex items-center gap-1" aria-expanded={showCoords}>
          Enter coordinates <ChevronDown className={`w-4 h-4 transition ${showCoords ? 'rotate-180' : ''}`} />
        </button>
        {showCoords && (
          <div className="flex gap-2 items-end">
            <label className="flex-1 text-[13px] text-slate-400">Latitude<input className={field} inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)} /></label>
            <label className="flex-1 text-[13px] text-slate-400">Longitude<input className={field} inputMode="decimal" value={lng} onChange={e => setLng(e.target.value)} /></label>
            <button type="button" onClick={applyCoords} className="h-11 px-4 rounded-xl bg-slate-800 text-[15px] font-semibold">Set</button>
          </div>
        )}
        {locError && <p role="alert" className="text-[13px] text-rose-300 mt-2">{locError}</p>}
      </SheetSection>

      <SheetSection title="Calculation" description="Chosen automatically from your location; change it to match your local mosque.">
        <label className="block text-[13px] text-slate-400 mb-1" htmlFor="ps-method">Method</label>
        <select id="ps-method" className={field} value={config.method} onChange={e => onChange({ ...config, method: e.target.value as CalcMethodName })}>
          {(Object.keys(METHOD_LABEL) as CalcMethodName[]).map(m => <option key={m} value={m}>{METHOD_LABEL[m]}</option>)}
        </select>
        <span className="block text-[13px] text-slate-400 mt-3 mb-1">Asr time</span>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Asr time">
          {([['shafi', 'Standard', "Shafi'i, Maliki, Hanbali"], ['hanafi', 'Hanafi', 'Later Asr']] as const).map(([v, t, d]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={config.madhab === v}
              onClick={() => onChange({ ...config, madhab: v })}
              className={`rounded-xl border p-2.5 text-left ${config.madhab === v ? 'border-emerald-600 bg-emerald-950/50' : 'border-slate-800 bg-slate-950'}`}
            >
              <span className="block text-[15px] font-semibold">{t}</span>
              <span className="block text-[12px] text-slate-400">{d}</span>
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setShowAdjust(s => !s)} className="mt-3 text-[13px] text-emerald-400 min-h-[36px] flex items-center gap-1" aria-expanded={showAdjust}>
          Fine-tune minutes <ChevronDown className={`w-4 h-4 transition ${showAdjust ? 'rotate-180' : ''}`} />
        </button>
        {showAdjust && (
          <div className="space-y-1.5">
            {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map(k => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-[15px]">{PRAYER_LABEL[k]}</span>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label={`${PRAYER_LABEL[k]} one minute earlier`} onClick={() => adjust(k, -1)} className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                  <span className="w-14 text-center tabular-nums text-[15px]">{(config.adjustments[k] ?? 0) > 0 ? '+' : ''}{config.adjustments[k] ?? 0} min</span>
                  <button type="button" aria-label={`${PRAYER_LABEL[k]} one minute later`} onClick={() => adjust(k, 1)} className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetSection>

      {preview && config.location && (
        <SheetSection title="Today">
          <div className="grid grid-cols-3 gap-2 text-center">
            {(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map(k => (
              <div key={k} className="rounded-xl bg-slate-900 border border-slate-800 py-2">
                <span className="block text-[13px] text-slate-400">{PRAYER_LABEL[k]}</span>
                <span className="block text-[15px] font-semibold tabular-nums" data-testid={`preview-${k}`}>{formatTime(preview[k], config.location!.tz)}</span>
              </div>
            ))}
          </div>
        </SheetSection>
      )}

      {children}
    </Sheet>
  );
};
