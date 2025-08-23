'use client';

import * as React from 'react';

type Toast = {
  id: string;
  title?: string;
  description?: string;
  onClick?: () => void;
};

const ToastContext = React.createContext<{
  push: (t: Omit<Toast, 'id'>) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <Toaster/>');
  return ctx;
}

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((t: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      3500,
    );
  }, []);
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed top-16 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <button
            key={t.id}
            className="pointer-events-auto block w-72 text-left bg-card border rounded-md shadow p-3 text-sm hover:bg-accent transition"
            onClick={t.onClick}
          >
            {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
            {t.description && (
              <div className="text-muted-foreground">{t.description}</div>
            )}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
