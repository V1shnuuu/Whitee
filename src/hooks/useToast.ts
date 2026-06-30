// ─────────────────────────────────────────────────────────────
// CredVault – Toast Notifications Hook
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import type { Toast } from '@/types';

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextType>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

export function useToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: Toast['type'], duration = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      // Auto-dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

export function useToast() {
  return useContext(ToastContext);
}
