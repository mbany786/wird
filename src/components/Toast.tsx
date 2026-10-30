import React, { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  tone?: 'info' | 'error';
  action?: { label: string; onClick: () => void };
  /** ms before it disappears (default 4000; actions get 6000) */
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

/** Bottom message bar (sits above the iPhone tab bar). */
export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, toast.duration ?? (toast.action ? 6000 : 4000));
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-24px)] max-w-md bottom-[calc(env(safe-area-inset-bottom)+49px+12px)] sm:bottom-[max(env(safe-area-inset-bottom),20px)]"
    >
      <div
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl border text-[15px] ${
          toast.tone === 'error' ? 'bg-rose-950 border-rose-800 text-rose-100' : 'bg-slate-800 border-slate-700 text-slate-100'
        }`}
      >
        <span className="flex-1 min-w-0">{toast.text}</span>
        {toast.action && (
          <button
            type="button"
            onClick={() => { toast.action!.onClick(); onDismiss(); }}
            className="h-9 px-3 -my-1 rounded-xl text-emerald-300 font-semibold hover:bg-slate-700 shrink-0"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
};
