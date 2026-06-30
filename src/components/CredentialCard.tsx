// ─────────────────────────────────────────────────────────────
// CredVault – Credential Card (Post-Payment Success Modal)
// ─────────────────────────────────────────────────────────────

'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import {
  Copy,
  ExternalLink,
  Check,
  X,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { truncateAddress } from '@/lib/stellar';
import type { TransactionResult } from '@/types';
import { useToast } from '@/hooks/useToast';

interface CredentialCardProps {
  result: TransactionResult;
  onClose: () => void;
}

export default function CredentialCard({ result, onClose }: CredentialCardProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  // Fire confetti on mount
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#6366F1', '#14B8A6', '#8B5CF6'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#6366F1', '#14B8A6', '#8B5CF6'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const explorerUrl = `https://stellar.expert/explorer/testnet/tx/${result.hash}`;

  const handleCopyDetails = useCallback(async () => {
    const details = [
      `✦ CredVault Credential`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `Skill: ${result.skillMeta.emoji} ${result.skillMeta.label}`,
      `Amount: ${parseFloat(result.amount).toFixed(2)} XLM`,
      `To: ${result.recipient}`,
      `Date: ${format(new Date(result.timestamp), 'MMMM d, yyyy')}`,
      `TX: ${result.hash}`,
      `Explorer: ${explorerUrl}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `Verified on Stellar Testnet`,
    ].join('\n');

    await navigator.clipboard.writeText(details);
    setCopied(true);
    showToast('Credential details copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  }, [result, explorerUrl, showToast]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center p-4
                   bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md overflow-hidden"
        >
          {/* Animated gradient border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r
                          from-indigo-500 via-teal-500 to-violet-500
                          animate-gradient-border opacity-80" />

          {/* Card content */}
          <div className="relative rounded-2xl bg-slate-900/95 backdrop-blur-xl p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg
                         hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-300 tracking-wide">
                CredVault
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                Stellar Testnet
              </span>
            </div>

            {/* Skill Badge */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                           bg-indigo-500/10 border border-indigo-500/20 mb-3"
              >
                <span className="text-3xl">{result.skillMeta.emoji}</span>
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-xl font-bold ${result.skillMeta.color}`}
              >
                {result.skillMeta.label}
              </motion.h3>
              <p className="text-sm text-slate-500 mt-1">Skill Credential</p>
            </div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3 mb-6"
            >
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">Amount</span>
                <span className="text-sm font-semibold text-teal-400 font-mono">
                  {parseFloat(result.amount).toFixed(2)} XLM
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">To</span>
                <span className="text-sm font-mono text-slate-300">
                  {truncateAddress(result.recipient, 8)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">Date</span>
                <span className="text-sm text-slate-300">
                  {format(new Date(result.timestamp), 'MMMM d, yyyy')}
                </span>
              </div>
              {result.note && (
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-500">Note</span>
                  <span className="text-sm text-slate-300">{result.note}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500">TX</span>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-mono text-indigo-400
                             hover:text-indigo-300 transition-colors"
                >
                  {truncateAddress(result.hash, 8)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <button
                onClick={handleCopyDetails}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                           rounded-xl border-2 border-teal-500/50 text-teal-400
                           hover:bg-teal-500/10 transition-all text-sm font-medium"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Details
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                           rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600
                           text-white font-medium text-sm shadow-lg shadow-indigo-500/25
                           hover:shadow-xl transition-all"
              >
                <Check className="w-4 h-4" />
                Done
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
