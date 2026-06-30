// ─────────────────────────────────────────────────────────────
// CredVault – Wallet Connect Button
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LogOut, Copy, Check, Loader2, ExternalLink } from 'lucide-react';
import { useWalletContext } from '@/providers/WalletProvider';
import { truncateAddress } from '@/lib/stellar';
import { useToast } from '@/hooks/useToast';

export default function WalletConnect() {
  const {
    address,
    isConnected,
    isLoading,
    error,
    isFreighterAvailable,
    connect,
    disconnect,
  } = useWalletContext();

  const { showToast } = useToast();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    showToast('Address copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowDropdown(false);
    showToast('Wallet disconnected', 'info');
  };

  // Freighter not installed
  if (isFreighterAvailable === false) {
    return (
      <a
        href="https://freighter.app"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-orange-500/50
                   text-orange-400 hover:bg-orange-500/10 transition-all text-sm font-medium"
      >
        <Wallet className="w-4 h-4" />
        Install Freighter
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  // Not connected
  if (!isConnected) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={connect}
        disabled={isLoading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                   bg-gradient-to-r from-indigo-500 to-violet-600 text-white
                   font-medium text-sm shadow-lg shadow-indigo-500/25
                   hover:shadow-xl hover:shadow-indigo-500/30
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </>
        )}
      </motion.button>
    );
  }

  // Connected — show address with dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl
                   bg-slate-800/80 border border-indigo-500/30
                   hover:border-indigo-500/50 text-white text-sm
                   font-medium transition-all backdrop-blur-sm"
      >
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
        <span className="font-mono text-sm">
          {truncateAddress(address || '', 6)}
        </span>
      </motion.button>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 text-xs text-red-400 whitespace-nowrap"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-full mt-2 right-0 w-72 p-4 rounded-xl
                       bg-slate-900/95 backdrop-blur-xl border border-slate-700/50
                       shadow-2xl z-50"
          >
            <p className="text-xs text-slate-400 mb-2">Connected Address</p>
            <div className="flex items-center gap-2 mb-4">
              <p className="font-mono text-xs text-slate-300 break-all flex-1">
                {address}
              </p>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            </div>

            <div className="border-t border-slate-700/50 pt-3">
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg
                           text-red-400 hover:bg-red-500/10 transition-colors
                           text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Disconnect Wallet
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
