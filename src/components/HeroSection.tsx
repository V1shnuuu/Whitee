// ─────────────────────────────────────────────────────────────
// CredVault – Hero Section (shown when wallet NOT connected)
// ─────────────────────────────────────────────────────────────

'use client';

import { motion } from 'framer-motion';
import { Zap, Lock, ClipboardList } from 'lucide-react';
import { useWalletContext } from '@/providers/WalletProvider';

const features = [
  { icon: Zap, label: 'Instant Settlement', color: 'text-yellow-400' },
  { icon: Lock, label: 'On-Chain Proof', color: 'text-teal-400' },
  { icon: ClipboardList, label: 'Portable Resume', color: 'text-indigo-400' },
];

export default function HeroSection() {
  const { connect, isLoading } = useWalletContext();

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center text-center px-4 py-20 sm:py-32"
    >
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                   bg-indigo-500/10 border border-indigo-500/20 mb-8"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">
          Built on Stellar Testnet
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-4xl sm:text-5xl md:text-6xl font-bold max-w-3xl leading-tight"
      >
        <span className="text-white">Your Work. </span>
        <span
          className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-400
                     bg-clip-text text-transparent"
        >
          Verified On-Chain.
        </span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed"
      >
        Send XLM. Tag a skill. Earn a credential. Every payment becomes{' '}
        <span className="text-teal-400 font-medium">
          permanent proof of your expertise
        </span>{' '}
        on the Stellar blockchain.
      </motion.p>

      {/* CTA Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}
        whileTap={{ scale: 0.98 }}
        onClick={connect}
        disabled={isLoading}
        className="mt-10 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600
                   text-white font-semibold text-lg shadow-xl shadow-indigo-500/25
                   hover:shadow-2xl transition-all disabled:opacity-50"
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet to Start'}
      </motion.button>

      {/* Feature Pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-3 mt-12"
      >
        {features.map((feature) => (
          <div
            key={feature.label}
            className="flex items-center gap-2 px-4 py-2 rounded-full
                       bg-slate-900/60 border border-slate-700/40
                       backdrop-blur-sm"
          >
            <feature.icon className={`w-4 h-4 ${feature.color}`} />
            <span className="text-sm font-medium text-slate-300">
              {feature.label}
            </span>
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
}
