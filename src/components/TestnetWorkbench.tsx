'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as StellarSdk from '@stellar/stellar-sdk';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Send,
  Wallet,
} from 'lucide-react';
import {
  TESTNET_HORIZON_URL,
  TESTNET_NETWORK_PASSPHRASE,
  TESTNET_SOROBAN_RPC_URL,
  fundAndConfirmTestnetAccount,
  generateTestnetKeypair,
  getTestnetAccountExplorerUrl,
  getTestnetAccountInfo,
  getTestnetPaymentHistory,
  getTestnetTransactionExplorerUrl,
  isValidStellarAddress,
  sendXlmOnTestnet,
} from '@/lib/stellar';
import type { TestnetAccountInfo, TestnetPaymentHistoryItem } from '@/types';
import { useToast } from '@/hooks/useToast';

const STORAGE_KEY = 'credvault_dev_secret_key';

function maskSecret(secretKey: string): string {
  if (!secretKey) return '';
  return `${secretKey.slice(0, 4)}...${secretKey.slice(-4)}`;
}

export default function TestnetWorkbench() {
  const { showToast } = useToast();

  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [accountInfo, setAccountInfo] = useState<TestnetAccountInfo | null>(null);
  const [history, setHistory] = useState<TestnetPaymentHistoryItem[]>([]);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memoText, setMemoText] = useState('');

  const [isCreating, setIsCreating] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipientValid = recipient.length > 0 && isValidStellarAddress(recipient);
  const parsedAmount = parseFloat(amount);
  const amountValid = !isNaN(parsedAmount) && parsedAmount > 0;

  const canFund = publicKey.length > 0 && !isFunding;
  const canRefresh = publicKey.length > 0 && !isRefreshing;
  const canSend =
    secretKey.length > 0 && recipientValid && amountValid && !isSending && accountInfo?.status === 'FUNDED';

  const accountExplorerUrl = useMemo(() => {
    if (!publicKey) return null;
    return getTestnetAccountExplorerUrl(publicKey);
  }, [publicKey]);

  const loadHistory = useCallback(async (address: string) => {
    setIsHistoryLoading(true);
    try {
      const rows = await getTestnetPaymentHistory(address, 20);
      setHistory(rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load history';
      setError(message);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!publicKey) return;
    setIsRefreshing(true);
    setError(null);
    try {
      const info = await getTestnetAccountInfo(publicKey);
      setAccountInfo(info);
      await loadHistory(publicKey);
      showToast('Account refreshed from Horizon', 'info');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh account';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadHistory, publicKey, showToast]);

  useEffect(() => {
    const savedSecret = sessionStorage.getItem(STORAGE_KEY);
    if (!savedSecret) return;

    try {
      const derivedPublic = StellarSdk.Keypair.fromSecret(savedSecret).publicKey();
      setSecretKey(savedSecret);
      setPublicKey(derivedPublic);
      void loadHistory(derivedPublic);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [loadHistory]);

  useEffect(() => {
    if (!publicKey) return;
    void refreshAccount();
  }, [publicKey, refreshAccount]);

  const handleCreateWallet = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const pair = generateTestnetKeypair();
      setPublicKey(pair.publicKey);
      setSecretKey(pair.secretKey);
      sessionStorage.setItem(STORAGE_KEY, pair.secretKey);
      setAccountInfo(null);
      setHistory([]);
      showToast('New testnet wallet created', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create wallet';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleFundWallet = async () => {
    if (!publicKey) return;
    setIsFunding(true);
    setError(null);
    try {
      const info = await fundAndConfirmTestnetAccount(publicKey);
      setAccountInfo(info);
      await loadHistory(publicKey);
      showToast('Wallet funded by Friendbot', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Funding failed';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsFunding(false);
    }
  };

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;

    setIsSending(true);
    setError(null);
    try {
      const result = await sendXlmOnTestnet({
        senderSecretKey: secretKey,
        recipientAddress: recipient,
        amountXLM: parsedAmount.toFixed(7),
        memoText: memoText || undefined,
      });

      showToast(`Payment submitted: ${result.hash.slice(0, 12)}...`, 'success');
      setRecipient('');
      setAmount('');
      setMemoText('');
      await refreshAccount();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const copyText = async (value: string, label: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    showToast(`${label} copied`, 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-6 bg-slate-900/60 border border-indigo-500/20"
      >
        <h1 className="text-2xl font-bold text-white">Stellar Testnet Workspace</h1>
        <p className="text-sm text-slate-400 mt-2">
          This app is configured for Testnet only. It does not use Mainnet or real XLM.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-5 text-sm">
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
            <p className="text-slate-400">Network Passphrase</p>
            <p className="font-mono text-indigo-300 mt-1 break-all">{TESTNET_NETWORK_PASSPHRASE}</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
            <p className="text-slate-400">Horizon URL</p>
            <p className="font-mono text-indigo-300 mt-1 break-all">{TESTNET_HORIZON_URL}</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
            <p className="text-slate-400">Soroban RPC URL</p>
            <p className="font-mono text-indigo-300 mt-1 break-all">{TESTNET_SOROBAN_RPC_URL}</p>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl p-6 bg-slate-900/60 border border-indigo-500/20"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-400" />
            Development Wallet
          </h2>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleCreateWallet}
              disabled={isCreating}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium"
            >
              {isCreating ? 'Creating...' : 'Create New Wallet'}
            </button>
            <button
              onClick={handleFundWallet}
              disabled={!canFund}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm font-medium"
            >
              {isFunding ? 'Funding...' : 'Fund with Friendbot'}
            </button>
            <button
              onClick={refreshAccount}
              disabled={!canRefresh}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2"
            >
              {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh Balance
            </button>
          </div>

          <div className="space-y-3 mt-5">
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
              <p className="text-xs text-slate-400 mb-1">Public Key (G...)</p>
              <div className="flex items-start gap-2">
                <p className="font-mono text-xs text-slate-200 break-all flex-1">{publicKey || 'Not created yet'}</p>
                <button
                  onClick={() => copyText(publicKey, 'Public key')}
                  disabled={!publicKey}
                  className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-50"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3">
              <p className="text-xs text-slate-400 mb-1">Secret Key (S...) stored in session storage for development only</p>
              <div className="flex items-start gap-2">
                <p className="font-mono text-xs text-orange-300 break-all flex-1">
                  {secretKey ? `${maskSecret(secretKey)} (click copy to reveal in clipboard)` : 'Not created yet'}
                </p>
                <button
                  onClick={() => copyText(secretKey, 'Secret key')}
                  disabled={!secretKey}
                  className="p-1.5 rounded hover:bg-slate-700 disabled:opacity-50"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {accountInfo && (
            <div className="mt-5 rounded-xl bg-slate-800/60 border border-slate-700/60 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-white">Account Info</h3>
              <p className="text-sm text-slate-300">
                Status:{' '}
                <span className={accountInfo.status === 'FUNDED' ? 'text-teal-400' : 'text-orange-400'}>
                  {accountInfo.status}
                </span>
              </p>
              <p className="text-sm text-slate-300">XLM Balance: {parseFloat(accountInfo.balanceXLM).toFixed(4)}</p>
              <p className="text-sm text-slate-300 font-mono break-all">Account ID: {accountInfo.accountId}</p>
              <p className="text-sm text-slate-300 font-mono break-all">Sequence: {accountInfo.sequenceNumber}</p>
              {accountExplorerUrl && (
                <a
                  href={accountExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 text-sm"
                >
                  View account on Stellar Expert
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 bg-slate-900/60 border border-indigo-500/20"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-400" />
            Send XLM (Testnet)
          </h2>

          <form onSubmit={handleSendPayment} className="space-y-4 mt-5">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Recipient Address</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
                placeholder="G..."
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white font-mono"
              />
              {recipient.length > 0 && !recipientValid && (
                <p className="text-xs text-red-400 mt-1">Recipient must be a valid Stellar address.</p>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Amount (XLM)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.00"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
              />
              {amount.length > 0 && !amountValid && (
                <p className="text-xs text-red-400 mt-1">Enter a valid amount greater than 0.</p>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Memo (optional)</label>
              <input
                value={memoText}
                onChange={(e) => setMemoText(e.target.value.slice(0, 28))}
                placeholder="Optional memo"
                className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white"
              />
            </div>

            <button
              type="submit"
              disabled={!canSend}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-2.5 font-semibold disabled:opacity-50"
            >
              {isSending ? 'Submitting transaction...' : 'Send XLM'}
            </button>
          </form>
        </motion.section>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl p-6 bg-slate-900/60 border border-indigo-500/20"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Transaction History</h2>
          <button
            onClick={() => publicKey && loadHistory(publicKey)}
            disabled={!publicKey || isHistoryLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-sm text-white flex items-center gap-2"
          >
            {isHistoryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>

        {!publicKey && (
          <p className="text-sm text-slate-500 mt-4">Create a wallet first to view transaction history.</p>
        )}

        {publicKey && history.length === 0 && !isHistoryLoading && (
          <p className="text-sm text-slate-500 mt-4">No transactions yet for this testnet account.</p>
        )}

        <div className="mt-4 overflow-x-auto">
          {history.length > 0 && (
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-800">
                  <th className="py-2 pr-3">Hash</th>
                  <th className="py-2 pr-3">Sender</th>
                  <th className="py-2 pr-3">Receiver</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Timestamp</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Explorer</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx) => (
                  <tr key={`${tx.hash}-${tx.timestamp}`} className="border-b border-slate-800/60 text-slate-300">
                    <td className="py-2 pr-3 font-mono">{tx.hash.slice(0, 12)}...</td>
                    <td className="py-2 pr-3 font-mono">{tx.sender.slice(0, 8)}...{tx.sender.slice(-6)}</td>
                    <td className="py-2 pr-3 font-mono">{tx.receiver.slice(0, 8)}...{tx.receiver.slice(-6)}</td>
                    <td className="py-2 pr-3">{parseFloat(tx.amount).toFixed(4)} XLM</td>
                    <td className="py-2 pr-3">{new Date(tx.timestamp).toLocaleString()}</td>
                    <td className="py-2 pr-3">
                      <span className={tx.status === 'SUCCESS' ? 'text-teal-400' : 'text-red-400'}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-2">
                      <a
                        href={getTestnetTransactionExplorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200"
                      >
                        Open
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.section>

      {error && (
        <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/25 text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!error && accountInfo?.status === 'FUNDED' && (
        <div className="rounded-xl p-3 bg-teal-500/10 border border-teal-500/25 text-teal-200 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5" />
          <p className="text-sm">Wallet is funded on Stellar Testnet and ready for transactions.</p>
        </div>
      )}
    </div>
  );
}
