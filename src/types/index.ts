// ─────────────────────────────────────────────────────────────
// CredVault – Core Type Definitions
// ─────────────────────────────────────────────────────────────

/** Skill categories available for credential tagging */
export type SkillTag =
  | 'UIUX'
  | 'BACKEND'
  | 'FRONTEND'
  | 'SMART'
  | 'COPY'
  | 'DATA'
  | 'VIDEO'
  | 'OTHER';

/** Human-readable skill metadata */
export interface SkillMeta {
  code: SkillTag;
  label: string;
  emoji: string;
  color: string; // Tailwind color class
}

/** Map of all supported skill categories */
export const SKILL_MAP: Record<SkillTag, SkillMeta> = {
  UIUX: { code: 'UIUX', label: 'UI/UX Design', emoji: '🎨', color: 'text-pink-400' },
  BACKEND: { code: 'BACKEND', label: 'Backend Development', emoji: '⚙️', color: 'text-blue-400' },
  FRONTEND: { code: 'FRONTEND', label: 'Frontend Development', emoji: '📱', color: 'text-cyan-400' },
  SMART: { code: 'SMART', label: 'Smart Contract Dev', emoji: '🔐', color: 'text-yellow-400' },
  COPY: { code: 'COPY', label: 'Copywriting', emoji: '✍️', color: 'text-orange-400' },
  DATA: { code: 'DATA', label: 'Data Analysis', emoji: '📊', color: 'text-green-400' },
  VIDEO: { code: 'VIDEO', label: 'Video Editing', emoji: '🎬', color: 'text-red-400' },
  OTHER: { code: 'OTHER', label: 'Other', emoji: '🔧', color: 'text-gray-400' },
};

/** Parsed credential from a Stellar transaction */
export interface Credential {
  hash: string;
  amount: string;
  sender: string;
  recipient: string;
  memo: string;
  skillTag: SkillTag;
  skillMeta: SkillMeta;
  note: string;
  timestamp: string;
  ledger: number;
}

/** Parameters for building a payment transaction */
export interface PaymentParams {
  senderAddress: string;
  recipientAddress: string;
  amountXLM: string;
  skillTag: SkillTag;
  note?: string;
  memo?: string; // pre-encoded memo (for testing)
}

/** Result from a submitted transaction */
export interface TransactionResult {
  hash: string;
  ledger: number;
  timestamp: string;
  amount: string;
  recipient: string;
  skillTag: SkillTag;
  skillMeta: SkillMeta;
  note: string;
}

/** Testnet account details fetched from Horizon */
export interface TestnetAccountInfo {
  accountId: string;
  sequenceNumber: string;
  balanceXLM: string;
  status: 'FUNDED' | 'UNFUNDED';
}

/** Payment transaction row for testnet history table */
export interface TestnetPaymentHistoryItem {
  hash: string;
  sender: string;
  receiver: string;
  amount: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

/** Wallet connection state */
export interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string;
  isLoading: boolean;
  error: string | null;
}

/** Toast notification */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

/** Async operation state */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}
