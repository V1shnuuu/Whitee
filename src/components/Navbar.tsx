// ─────────────────────────────────────────────────────────────
// CredVault – Navbar Component
// ─────────────────────────────────────────────────────────────

'use client';

import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import WalletConnect from './WalletConnect';

export default function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/70
                 border-b border-slate-800/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600
                          flex items-center justify-center shadow-lg shadow-indigo-500/25"
            >
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Cred<span className="text-indigo-400">Vault</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full
                          bg-teal-500/10 border border-teal-500/20"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-medium text-teal-300 uppercase tracking-wider hidden sm:inline">
                TESTNET ONLY
              </span>
            </div>
            <WalletConnect />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
