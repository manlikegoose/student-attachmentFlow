import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, XIcon } from 'lucide-react';
import { cn } from '../utils/cn';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: {children: React.ReactNode;}) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      nextId += 1;
      const id = nextId;
      setToasts((current) => [...current.slice(-3), { id, tone, title, description }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4500);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      info: (title, description) => push('info', title, description)
    }),
    [push]
  );

  const icons: Record<ToastTone, React.ReactNode> = {
    success: <CheckCircle2Icon className="h-4 w-4 text-approved-fg" aria-hidden />,
    error: <AlertTriangleIcon className="h-4 w-4 text-rejected-fg" aria-hidden />,
    info: <InfoIcon className="h-4 w-4 text-navy-600" aria-hidden />
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
        role="region"
        aria-label="Notifications"
        aria-live="polite">
        
        <AnimatePresence initial={false}>
          {toasts.map((toast) =>
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-white p-3.5 shadow-pop',
              toast.tone === 'error' ? 'border-rejected-border' : 'border-slate-200'
            )}>
            
              <span className="mt-0.5">{icons[toast.tone]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-navy-900">{toast.title}</p>
                {toast.description &&
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">
                    {toast.description}
                  </p>
              }
              </div>
              <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-slate-400 transition-colors duration-150 ease-smooth hover:text-slate-700">
              
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>);

}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}