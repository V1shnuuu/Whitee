// ─────────────────────────────────────────────────────────────
// CredVault – Toast Notification Component
// ─────────────────────────────────────────────────────────────

'use client';

import { useToast } from '@/hooks/useToast';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: 'border-teal-500/50 bg-teal-500/10 text-teal-300',
  error: 'border-red-500/50 bg-red-500/10 text-red-300',
  warning: 'border-orange-500/50 bg-orange-500/10 text-orange-300',
  info: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300',
};

const iconColor = {
  success: 'text-teal-400',
  error: 'text-red-400',
  warning: 'text-orange-400',
  info: 'text-indigo-400',
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`
                flex items-start gap-3 px-4 py-3 rounded-xl border
                backdrop-blur-lg shadow-xl ${colorMap[toast.type]}
              `}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor[toast.type]}`} />
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 hover:opacity-70 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
