'use client';

import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface ToastInput {
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastMessage extends Required<ToastInput> {
  id: string;
}

interface ToastContextValue {
  showToast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-50',
  error: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-50',
  warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50',
  info: 'border-border bg-card text-card-foreground',
};

const toneIcons = {
  success: CheckCircle2,
  error: TriangleAlert,
  warning: TriangleAlert,
  info: Info,
};

export function ToastProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      const message: ToastMessage = {
        id,
        title: input.title,
        description: input.description ?? '',
        tone: input.tone ?? 'info',
      };
      setMessages((current) => [...current.slice(-3), message]);
      window.setTimeout(() => dismiss(id), input.tone === 'error' ? 6500 : 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[80] grid w-[calc(100%-2rem)] max-w-sm gap-3" aria-live="polite">
        {messages.map((message) => {
          const Icon = toneIcons[message.tone];
          return (
            <div
              key={message.id}
              className={cn(
                'rounded-lg border p-4 shadow-soft backdrop-blur animate-in fade-in slide-in-from-top-2',
                toneStyles[message.tone],
              )}
            >
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{message.title}</p>
                  {message.description ? <p className="mt-1 text-sm opacity-80">{message.description}</p> : null}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => dismiss(message.id)} aria-label="Dismiss notification">
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return context;
}
