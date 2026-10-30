import React, { useEffect, useMemo, useState } from 'react';
import { BellRing, BellOff } from 'lucide-react';
import { SheetSection } from './Sheet';
import { PrayerConfig, PRAYER_LABEL, PRAYER_ORDER } from '../utils/prayerTimes';
import { buildReminderPlan, notificationPermission, PermissionState, ReminderConfig, requestNotificationPermission } from '../utils/reminders';

interface ReminderSettingsProps {
  config: ReminderConfig;
  prayerConfig: PrayerConfig;
  hijriOffset: number;
  onChange: (config: ReminderConfig) => void;
}

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; disabled?: boolean }> = ({ label, checked, onChange, hint, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-3 min-h-[48px] text-left disabled:opacity-40"
  >
    <span className="min-w-0">
      <span className="block text-[15px] text-slate-100">{label}</span>
      {hint && <span className="block text-[12px] text-slate-500">{hint}</span>}
    </span>
    <span className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 ${checked ? 'bg-emerald-600' : 'bg-slate-700'}`} aria-hidden>
      <span className={`block w-5 h-5 rounded-full bg-white transition ${checked ? 'translate-x-5' : ''}`} />
    </span>
  </button>
);

const TimeField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <input
    type="time"
    aria-label={label}
    value={value}
    onChange={e => e.target.value && onChange(e.target.value)}
    className="h-10 px-2 rounded-lg bg-slate-950 border border-slate-700 text-[15px] tabular-nums"
  />
);

const TimedToggle: React.FC<{ label: string; hint?: string; value: { on: boolean; time: string }; onChange: (v: { on: boolean; time: string }) => void }> = ({ label, hint, value, onChange }) => (
  <div>
    <Toggle label={label} hint={hint} checked={value.on} onChange={(on) => onChange({ ...value, on })} />
    {value.on && (
      <div className="flex items-center justify-between pb-2 -mt-1">
        <span className="text-[13px] text-slate-400">Time</span>
        <TimeField label={`${label} time`} value={value.time} onChange={(time) => onChange({ ...value, time })} />
      </div>
    )}
  </div>
);

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({ config, prayerConfig, hijriOffset, onChange }) => {
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [tried, setTried] = useState(false);
  useEffect(() => { notificationPermission().then(setPermission); }, []);

  const upcoming = useMemo(() => buildReminderPlan(config, prayerConfig, hijriOffset).slice(0, 4), [config, prayerConfig, hijriOffset]);
  const set = (patch: Partial<ReminderConfig>) => onChange({ ...config, ...patch });
  const hasLocation = !!prayerConfig.location;

  const enable = async (on: boolean) => {
    if (on) {
      setTried(true);
      const p = await requestNotificationPermission();
      setPermission(p);
      if (p === 'denied') return;
    }
    set({ enabled: on });
  };

  return (
    <SheetSection title="Reminders" description="Local notifications from this device. Planned a week ahead and refreshed whenever you open Wird.">
      <Toggle label="Reminders" checked={config.enabled} onChange={enable} />
      {permission === 'denied' && (tried || config.enabled) && (
        <p role="alert" className="flex items-start gap-2 text-[13px] text-amber-200 bg-amber-950/40 border border-amber-900 rounded-xl px-3 py-2 mt-1">
          <BellOff className="w-4 h-4 mt-0.5 shrink-0" />
          Notifications are off for Wird. Turn them on in iPhone Settings → Notifications → Wird.
        </p>
      )}

      {config.enabled && (
        <div className="mt-2 divide-y divide-slate-800">
          <div className="pb-2">
            <p className="text-[13px] font-medium text-slate-400 mt-1">Prayers {hasLocation ? '' : '(set a location above first)'}</p>
            {PRAYER_ORDER.map(k => (
              <Toggle
                key={k}
                label={PRAYER_LABEL[k]}
                checked={config.prayers[k]}
                disabled={!hasLocation}
                onChange={(v) => set({ prayers: { ...config.prayers, [k]: v } })}
              />
            ))}
            <label className="flex items-center justify-between min-h-[48px] text-[15px]">
              <span>Remind me</span>
              <select
                aria-label="Prayer reminder timing"
                value={config.prayerOffset}
                disabled={!hasLocation}
                onChange={e => set({ prayerOffset: Number(e.target.value) })}
                className="h-10 px-2 rounded-lg bg-slate-950 border border-slate-700 text-[15px]"
              >
                <option value={0}>At prayer time</option>
                <option value={5}>5 min before</option>
                <option value={10}>10 min before</option>
                <option value={15}>15 min before</option>
                <option value={30}>30 min before</option>
              </select>
            </label>
          </div>

          <div className="py-2">
            <Toggle label="Tahajjud" hint="When the last third of the night begins" checked={config.tahajjud} disabled={!hasLocation} onChange={(v) => set({ tahajjud: v })} />
            <TimedToggle label="Surah Al-Kahf on Fridays" value={config.kahf} onChange={(v) => set({ kahf: v })} />
            <TimedToggle label="Ayyam al-Bid fasts" hint="The evening before the 13th, 14th and 15th" value={config.ayyamAlBid} onChange={(v) => set({ ayyamAlBid: v })} />
            <TimedToggle label="Morning adhkar" value={config.morningAdhkar} onChange={(v) => set({ morningAdhkar: v })} />
            <TimedToggle label="Evening adhkar" value={config.eveningAdhkar} onChange={(v) => set({ eveningAdhkar: v })} />
          </div>

          <div className="pt-3">
            <p className="text-[13px] font-medium text-slate-400 flex items-center gap-1.5"><BellRing className="w-4 h-4" /> Coming up</p>
            {upcoming.length ? (
              <ul className="mt-1 text-[14px] text-slate-300" aria-label="Upcoming reminders">
                {upcoming.map(r => (
                  <li key={r.id} className="flex justify-between gap-2 py-1">
                    <span className="truncate">{r.title.replace(/ · \d.*$/, '')}</span>
                    <span className="text-slate-500 tabular-nums shrink-0">
                      {r.at.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-slate-500 mt-1">Nothing scheduled with these settings.</p>
            )}
          </div>
        </div>
      )}
    </SheetSection>
  );
};
