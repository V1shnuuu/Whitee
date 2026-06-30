// ─────────────────────────────────────────────────────────────
// CredVault – Credential History Feed
// ─────────────────────────────────────────────────────────────

'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  ExternalLink,
  Clock,
  Inbox,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useWalletContext } from '@/providers/WalletProvider';
import TransactionSkeleton from './TransactionSkeleton';
import { truncateAddress } from '@/lib/stellar';
import { SKILL_MAP } from '@/types';

const borderColors: Record<string, string> = {
  UIUX: 'border-l-pink-400',
  BACKEND: 'border-l-blue-400',
  FRONTEND: 'border-l-cyan-400',
  SMART: 'border-l-yellow-400',
  COPY: 'border-l-orange-400',
  DATA: 'border-l-green-400',
  VIDEO: 'border-l-red-400',
  OTHER: 'border-l-slate-500',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

export default function HistoryFeed() {
  const { address } = useWalletContext();
  const { transactions, isLoading, error, refresh } = useTransactions(address);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl p-6 backdrop-blur-lg bg-slate-900/60
                 border border-indigo-500/20 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Credential Feed
        </h2>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors
                     disabled:opacity-50"
          title="Refresh history"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
          <span>{error}</span>
          <button
            onClick={refresh}
            className="text-indigo-400 underline hover:text-indigo-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && transactions.length === 0 && <TransactionSkeleton />}

      {/* Empty state */}
      {!isLoading && transactions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-500 text-sm font-medium">
            No credentials yet
          </p>
          <p className="text-slate-600 text-xs mt-1">
            Send your first credentialed payment above
          </p>
        </div>
      )}

      {/* Transaction list */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        {transactions.map((tx) => {
          const skillMeta = SKILL_MAP[tx.skillTag];
          const isOutgoing = tx.sender === address;
          const timeAgo = (() => {
            try {
              return formatDistanceToNow(new Date(tx.timestamp), {
                addSuffix: true,
              });
            } catch {
              return '—';
            }
          })();

          return (
            <motion.div
              key={tx.hash}
              variants={item}
              className={`flex items-center gap-3 p-3 rounded-xl
                         bg-slate-900/40 border-l-4 ${borderColors[tx.skillTag] || 'border-l-slate-500'}
                         border border-slate-700/20 hover:bg-slate-800/50
                         transition-colors group cursor-default`}
            >
              {/* Skill Icon */}
              <div
                className="w-10 h-10 rounded-lg bg-slate-800/80 border border-slate-700/40
                           flex items-center justify-center shrink-0 text-lg"
              >
                {skillMeta.emoji}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {skillMeta.label}
                  </span>
                  {tx.note && (
                    <span className="text-xs text-slate-500 truncate hidden sm:inline">
                      — {tx.note}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    {isOutgoing ? (
                      <ArrowUpRight className="w-3 h-3 text-orange-400" />
                    ) : (
                      <ArrowDownLeft className="w-3 h-3 text-teal-400" />
                    )}
                    {isOutgoing
                      ? `To ${truncateAddress(tx.recipient, 4)}`
                      : `From ${truncateAddress(tx.sender, 4)}`}
                  </span>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-500">{timeAgo}</span>
                </div>
              </div>

              {/* Amount + Link */}
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-sm font-semibold font-mono ${
                    isOutgoing ? 'text-orange-400' : 'text-teal-400'
                  }`}
                >
                  {isOutgoing ? '-' : '+'}
                  {tx.amount !== '—'
                    ? parseFloat(tx.amount).toFixed(2)
                    : '—'}
                </span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors
                             opacity-0 group-hover:opacity-100"
                  title="View on Stellar Expert"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
