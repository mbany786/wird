import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface SampleDataPromptProps {
  onLoad: () => Promise<void>;
  onDismiss: () => void;
}

/** Shown on a fresh install with no entries: start clean, or explore with removable sample data. */
export const SampleDataPrompt: React.FC<SampleDataPromptProps> = ({ onLoad, onDismiss }) => {
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-2xl border border-emerald-800/70 bg-emerald-950/30 p-4">
      <div className="flex items-start gap-3">
        <FlaskConical className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-100">Welcome to Wird</p>
          <p className="text-[13px] text-slate-400 mt-0.5 leading-snug">
            Start logging today, or explore first with a month of example entries. You can remove the examples at any time from
            Backup &amp; data.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 sm:pl-8">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await onLoad(); } finally { setBusy(false); }
          }}
          className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[15px] font-semibold disabled:opacity-60"
        >
          {busy ? 'Loading…' : 'Explore with sample data'}
        </button>
        <button type="button" onClick={onDismiss} className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[15px] font-semibold">
          Start fresh
        </button>
      </div>
    </div>
  );
};
