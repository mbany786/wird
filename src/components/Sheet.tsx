import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Optional footer (sticky at the bottom, e.g. primary actions) */
  footer?: React.ReactNode;
  wide?: boolean;
}

/**
 * Full-height sheet on iPhone, centred dialog on iPad/desktop.
 * Escape closes it; the page behind doesn't scroll while it's open.
 */
// Open sheets, newest last: Escape closes only the top one
const openSheets: object[] = [];

export const Sheet: React.FC<SheetProps> = ({ title, subtitle, onClose, children, footer, wide }) => {
  const [token] = React.useState(() => ({}));
  useEffect(() => {
    openSheets.push(token);
    return () => { const i = openSheets.indexOf(token); if (i >= 0) openSheets.splice(i, 1); };
  }, [token]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && openSheets[openSheets.length - 1] === token) onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, token]);

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div
        className={`relative w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} bg-slate-900 border border-slate-700/80 sm:rounded-2xl rounded-t-2xl shadow-2xl text-slate-100 flex flex-col max-h-[calc(100dvh-env(safe-area-inset-top)-12px)] sm:max-h-[88vh]`}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4 pb-3 border-b border-slate-800">
          <div className="min-w-0">
            <h2 className="text-[20px] font-semibold text-slate-100">{title}</h2>
            {subtitle && <p className="text-[13px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">{children}</div>
        {footer && (
          <div className="px-4 sm:px-5 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] border-t border-slate-800">{footer}</div>
        )}
        {!footer && <div className="pb-[env(safe-area-inset-bottom)]" />}
      </div>
    </div>
  );
};

/** A titled group inside a sheet */
export const SheetSection: React.FC<{ title: string; description?: string; children: React.ReactNode; tone?: 'default' | 'danger' }> = ({
  title,
  description,
  children,
  tone = 'default'
}) => (
  <section className={`rounded-2xl border p-4 ${tone === 'danger' ? 'border-rose-900/70 bg-rose-950/20' : 'border-slate-800 bg-slate-950/60'}`}>
    <h3 className={`text-[15px] font-semibold ${tone === 'danger' ? 'text-rose-300' : 'text-slate-100'}`}>{title}</h3>
    {description && <p className="text-[13px] text-slate-400 mt-1 leading-snug">{description}</p>}
    <div className="mt-3">{children}</div>
  </section>
);
