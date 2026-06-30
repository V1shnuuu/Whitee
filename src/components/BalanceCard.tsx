// ─────────────────────────────────────────────────────────────
// CredVault – Balance Card Component
// ─────────────────────────────────────────────────────────────

'use client';

import { motion } from 'framer-motion';
import { RefreshCw, Shield, Coins, Loader2 } from 'lucide-react';
import { useBalance } from '@/hooks/useBalance';
import { useWalletContext } from '@/providers/WalletProvider';

export default function BalanceCard() {
  const { address } = useWalletContext();
  const { balance, credibilityScore, isLoading, error, refresh } =
    useBalance(address);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-6 backdrop-blur-lg bg-slate-900/60
                 border border-indigo-500/20 shadow-lg"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Account Overview
        </h2>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors
                     disabled:opacity-50"
          title="Refresh balance"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <span>{error}</span>
          <button
            onClick={refresh}
            className="text-indigo-400 underline hover:text-indigo-300"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {/* XLM Balance */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                XLM Balance
              </span>
            </div>
            <motion.p
              key={balance}
              initial={{ opacity: 0.5, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-3xl font-bold text-teal-400 font-mono tabular-nums"
            >
              {isLoading ? (
                <span className="inline-block w-32 h-8 bg-slate-700/50 rounded animate-pulse" />
              ) : (
                <>{parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
              )}
            </motion.p>
            <p className="text-xs text-slate-500">Stellar Lumens</p>
          </div>

          {/* Credibility Score */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Credentials
              </span>
            </div>
            <motion.p
              key={credibilityScore}
              initial={{ opacity: 0.5, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-3xl font-bold text-indigo-400 font-mono tabular-nums"
            >
              {isLoading ? (
                <span className="inline-block w-16 h-8 bg-slate-700/50 rounded animate-pulse" />
              ) : credibilityScore > 20 ? (
                '20+'
              ) : (
                credibilityScore
              )}
            </motion.p>
            <p className="text-xs text-slate-500">Earned on-chain</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
