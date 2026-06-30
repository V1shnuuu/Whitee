// ─────────────────────────────────────────────────────────────
// CredVault – Payment Form Component
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useWalletContext } from '@/providers/WalletProvider';
import { useBalance } from '@/hooks/useBalance';
import { useToast } from '@/hooks/useToast';
import {
  isValidStellarAddress,
  buildPaymentTransaction,
  submitSignedTransaction,
} from '@/lib/stellar';
import { signTx } from '@/lib/freighter';
import { previewMemo, getMaxNoteLength } from '@/lib/memo';
import { getErrorMessage, getErrorCode } from '@/lib/errors';
import { type SkillTag, type TransactionResult, SKILL_MAP } from '@/types';

interface PaymentFormProps {
  onSuccess: (result: TransactionResult) => void;
}

const skillOptions = Object.values(SKILL_MAP);

export default function PaymentForm({ onSuccess }: PaymentFormProps) {
  const { address } = useWalletContext();
  const { balance, refresh: refreshBalance } = useBalance(address);
  const { showToast } = useToast();

  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [skillTag, setSkillTag] = useState<SkillTag>('UIUX');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Validation states
  const isAddressValid = recipient.length > 0 && isValidStellarAddress(recipient);
  const isAddressTouched = recipient.length > 0;
  const isNotSelf = recipient !== address;
  const parsedAmount = parseFloat(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const isAmountTouched = amount.length > 0;
  const availableBalance = parseFloat(balance);
  const isBalanceSufficient = isAmountValid && parsedAmount <= availableBalance - 0.01;

  const maxNoteLen = getMaxNoteLength(skillTag);
  const memoPreview = useMemo(
    () => previewMemo(skillTag, note),
    [skillTag, note]
  );

  const canSubmit =
    isAddressValid &&
    isNotSelf &&
    isAmountValid &&
    isBalanceSufficient &&
    !isSubmitting &&
    address !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !address) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      // 1. Build the transaction
      const xdr = await buildPaymentTransaction({
        senderAddress: address,
        recipientAddress: recipient,
        amountXLM: parsedAmount.toFixed(7),
        skillTag,
        note: note || undefined,
      });

      // 2. Sign with Freighter
      const signedXdr = await signTx(xdr);

      // 3. Submit to Horizon
      const result = await submitSignedTransaction(signedXdr);

      // 4. Success!
      showToast('Credential payment sent successfully!', 'success');
      refreshBalance();
      onSuccess(result);

      // Reset form
      setRecipient('');
      setAmount('');
      setNote('');
    } catch (error) {
      const code = getErrorCode(error);
      const message = getErrorMessage(error);

      if (code === 'FREIGHTER_REJECTED') {
        showToast('Transaction cancelled', 'warning');
      } else if (code === 'INSUFFICIENT_BALANCE') {
        refreshBalance();
        setFormError(message);
      } else if (code === 'NO_DESTINATION_ACCOUNT') {
        setFormError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl p-6 backdrop-blur-lg bg-slate-900/60
                 border border-indigo-500/20 shadow-lg"
    >
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Send className="w-5 h-5 text-indigo-400" />
        Send Credentialed Payment
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Recipient Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setFormError(null);
              }}
              placeholder="Recipient's Stellar address (G...)"
              className={`w-full bg-slate-800 border rounded-lg px-4 py-2.5
                         text-white placeholder:text-slate-500 text-sm font-mono
                         focus:outline-none focus:ring-1 transition-all ${
                           isAddressTouched
                             ? isAddressValid && isNotSelf
                               ? 'border-teal-500/50 focus:ring-teal-500/50'
                               : 'border-red-500/50 focus:ring-red-500/50'
                             : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/50'
                         }`}
            />
            {isAddressTouched && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isAddressValid ? (
                  <CheckCircle className="w-4 h-4 text-teal-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            )}
          </div>
          <AnimatePresence>
            {isAddressTouched && !isAddressValid && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-xs font-medium mt-1"
              >
                Invalid Stellar address. Must start with G and be 56 characters.
              </motion.p>
            )}
            {isAddressTouched && isAddressValid && !isNotSelf && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-xs font-medium mt-1"
              >
                Cannot send payment to your own address.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Amount (XLM)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setFormError(null);
            }}
            placeholder="Enter amount"
            step="0.01"
            min="0"
            className={`w-full bg-slate-800 border rounded-lg px-4 py-2.5
                       text-white placeholder:text-slate-500 text-sm
                       focus:outline-none focus:ring-1 transition-all ${
                         isAmountTouched && !isBalanceSufficient
                           ? 'border-red-500/50 focus:ring-red-500/50'
                           : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/50'
                       }`}
          />
          <div className="flex items-center justify-between mt-1">
            <AnimatePresence>
              {isAmountTouched && !isAmountValid && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs font-medium"
                >
                  Amount must be greater than 0
                </motion.p>
              )}
              {isAmountValid && !isBalanceSufficient && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-xs font-medium"
                >
                  Insufficient balance
                </motion.p>
              )}
            </AnimatePresence>
            <p className="text-xs text-teal-400 ml-auto">
              Available: {parseFloat(balance).toLocaleString()} XLM
            </p>
          </div>
        </div>

        {/* Skill Category */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Skill Category
          </label>
          <div className="relative">
            <select
              value={skillTag}
              onChange={(e) => setSkillTag(e.target.value as SkillTag)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg
                         px-4 py-2.5 text-white text-sm appearance-none cursor-pointer
                         focus:outline-none focus:ring-1 focus:border-indigo-500
                         focus:ring-indigo-500/50 transition-all"
            >
              {skillOptions.map((skill) => (
                <option key={skill.code} value={skill.code}>
                  {skill.emoji} {skill.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Optional Note */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            Optional Note
          </label>
          <div className="relative">
            <input
              type="text"
              value={note}
              onChange={(e) =>
                setNote(e.target.value.slice(0, maxNoteLen))
              }
              placeholder={`Optional note (${maxNoteLen} chars max)`}
              maxLength={maxNoteLen}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg
                         px-4 py-2.5 text-white placeholder:text-slate-500 text-sm
                         focus:outline-none focus:ring-1 focus:border-indigo-500
                         focus:ring-indigo-500/50 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {note.length}/{maxNoteLen}
            </span>
          </div>
        </div>

        {/* Memo Preview */}
        <div className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40">
          <p className="text-xs text-slate-500 mb-1">Memo Preview</p>
          <p className="text-sm font-mono text-indigo-300">{memoPreview}</p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10
                         border border-red-500/20"
            >
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{formError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!canSubmit}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600
                     text-white font-semibold shadow-lg shadow-indigo-500/25
                     hover:shadow-xl transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing in Freighter...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send &amp; Certify
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
