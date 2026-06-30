// ─────────────────────────────────────────────────────────────
// CredVault – Toast Provider (client component wrapper)
// ─────────────────────────────────────────────────────────────

'use client';

import React from 'react';
import { ToastContext, useToastProvider } from '@/hooks/useToast';
import ToastContainer from '@/components/Toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastState = useToastProvider();

  return (
    <ToastContext.Provider value={toastState}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}
