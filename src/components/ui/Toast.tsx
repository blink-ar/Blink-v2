import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ToastMessage {
  id: number;
  text: string;
  icon?: string;
}

type ShowToast = (text: string, options?: { icon?: string }) => void;

const ToastContext = createContext<ShowToast | null>(null);

const TOAST_DURATION_MS = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = useCallback<ShowToast>((text, options) => {
    clearTimeout(timerRef.current);
    setToast({ id: Date.now(), text, icon: options?.icon });
    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* Live region stays mounted so screen readers announce each message. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-28 z-[300] flex justify-center px-4 lg:bottom-8"
      >
        {toast && (
          <div
            key={toast.id}
            className="flex max-w-sm items-center gap-2 rounded-2xl bg-blink-ink px-4 py-3 text-sm font-semibold text-white shadow-soft-lg animate-slide-up"
          >
            {toast.icon && (
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>
                {toast.icon}
              </span>
            )}
            {toast.text}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

/** Falls back to a no-op outside the provider so isolated component tests keep working. */
export function useToast(): ShowToast {
  return useContext(ToastContext) ?? noopToast;
}

const noopToast: ShowToast = () => {};
