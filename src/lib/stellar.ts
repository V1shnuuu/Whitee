// ─────────────────────────────────────────────────────────────
// CredVault – Stellar SDK Logic
// ─────────────────────────────────────────────────────────────
// All Horizon API interactions. Every function is fully typed
// with proper error handling using typed StellarError classes.
// ─────────────────────────────────────────────────────────────

import * as StellarSdk from '@stellar/stellar-sdk';
import {
  type Credential,
  type PaymentParams,
  type TestnetAccountInfo,
  type TestnetPaymentHistoryItem,
  type TransactionResult,
  type SkillTag,
  SKILL_MAP,
} from '@/types';
import { decodeMemo, encodeMemo } from './memo';
import {
  InsufficientBalanceError,
  InvalidAddressError,
  NoDestinationAccountError,
  HorizonTimeoutError,
  RateLimitedError,
  NetworkError,
  WalletStateMismatchError,
} from './errors';

export const TESTNET_HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const TESTNET_FRIENDBOT_URL = 'https://friendbot.stellar.org';
export const TESTNET_SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
export const TESTNET_NETWORK_PASSPHRASE =
  'Test SDF Network ; September 2015';
export const TESTNET_EXPLORER_BASE =
  'https://stellar.expert/explorer/testnet';

const HORIZON_URL = TESTNET_HORIZON_URL;
const FRIENDBOT_URL = TESTNET_FRIENDBOT_URL;
const NETWORK_PASSPHRASE = TESTNET_NETWORK_PASSPHRASE;

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

// ── In-memory cache ──────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<unknown>> = {};
const CACHE_TTL = 30_000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

// ── 1. Get XLM Balance ───────────────────────────────────────

export async function getBalance(address: string): Promise<string> {
  try {
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find(
      (b) => b.asset_type === 'native'
    );
    return nativeBalance ? nativeBalance.balance : '0.0000000';
  } catch (error: unknown) {
    if (error instanceof Error && 'response' in error) {
      const resp = error as { response?: { status?: number } };
      if (resp.response?.status === 404) {
        return '0.00';
      }
      if (resp.response?.status === 429) {
        throw new RateLimitedError();
      }
    }
    // Network or timeout
    throw new NetworkError('Could not fetch balance. Check your connection.');
  }
}

// ── 2. Get Credibility Score (fast: single request) ──────────

export async function getCredibilityScore(address: string): Promise<number> {
  const cacheKey = `cred_score_${address}`;
  const cached = getCached<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const response = await fetch(
      `${HORIZON_URL}/accounts/${address}/transactions?limit=1&order=desc`
    );

    if (!response.ok) {
      if (response.status === 404) return 0;
      if (response.status === 429) throw new RateLimitedError();
      throw new NetworkError();
    }

    const data = await response.json();

    // Horizon embeds paging info; we can estimate from the records
    // Since X-Total-Count may not always be present, we fetch a 
    // larger batch to get a rough score
    const countResponse = await fetch(
      `${HORIZON_URL}/accounts/${address}/transactions?limit=200&order=desc`
    );

    if (!countResponse.ok) {
      // Fallback: at least we know there's 1 transaction
      const score = data._embedded?.records?.length ?? 0;
      setCache(cacheKey, score);
      return score;
    }

    const countData = await countResponse.json();
    const score = countData._embedded?.records?.length ?? 0;
    setCache(cacheKey, score);
    return score;
  } catch (error) {
    if (error instanceof RateLimitedError) throw error;
    // Don't crash — return 0 on network failure
    console.error('Failed to fetch credibility score:', error);
    return 0;
  }
}

// ── 3. Get Recent Transactions ───────────────────────────────

export async function getRecentTransactions(
  address: string,
  limit: number = 20
): Promise<Credential[]> {
  try {
    const response = await fetch(
      `${HORIZON_URL}/accounts/${address}/transactions?limit=${limit}&order=desc&include_failed=false`
    );

    if (!response.ok) {
      if (response.status === 404) return [];
      if (response.status === 429) throw new RateLimitedError();
      throw new NetworkError();
    }

    const data = await response.json();
    const records = data._embedded?.records ?? [];

    const credentials: Credential[] = records.map(
      (record: Record<string, unknown>) => {
        const memoText =
          record.memo_type === 'text' ? (record.memo as string) || '' : '';
        const { skillTag, note, isCredVault } = decodeMemo(memoText);
        const skillMeta = SKILL_MAP[skillTag];

        // Try to get amount from operations — for now use fee_charged as a 
        // signal that it's a real transaction
        return {
          hash: record.hash as string,
          amount: '—', // Will be enriched from operations endpoint
          sender: record.source_account as string,
          recipient: '', // Will be enriched from operations
          memo: memoText,
          skillTag: isCredVault ? skillTag : ('OTHER' as SkillTag),
          skillMeta,
          note: isCredVault ? note : memoText,
          timestamp: record.created_at as string,
          ledger: record.ledger as number,
        } satisfies Credential;
      }
    );

    // Enrich with operation details (amounts + recipients)
    const enriched = await Promise.all(
      credentials.map(async (cred) => {
        try {
          const opsResponse = await fetch(
            `${HORIZON_URL}/transactions/${cred.hash}/operations?limit=1`
          );
          if (opsResponse.ok) {
            const opsData = await opsResponse.json();
            const op = opsData._embedded?.records?.[0];
            if (op) {
              cred.amount = op.amount || op.starting_balance || '—';
              cred.recipient = op.to || op.account || '';
            }
          }
        } catch {
          // Silently fail enrichment — display what we have
        }
        return cred;
      })
    );

    return enriched;
  } catch (error) {
    if (error instanceof RateLimitedError) throw error;
    console.error('Failed to fetch transactions:', error);
    return [];
  }
}

// ── 4. Build Payment Transaction ─────────────────────────────

export async function buildPaymentTransaction(
  params: PaymentParams
): Promise<string> {
  const { senderAddress, recipientAddress, amountXLM, skillTag, note, memo } =
    params;

  // Validate addresses
  if (!StellarSdk.StrKey.isValidEd25519PublicKey(senderAddress)) {
    throw new InvalidAddressError(senderAddress);
  }
  if (!StellarSdk.StrKey.isValidEd25519PublicKey(recipientAddress)) {
    throw new InvalidAddressError(recipientAddress);
  }

  // Validate amount
  const amount = parseFloat(amountXLM);
  if (isNaN(amount) || amount <= 0 || amount >= 1_000_000) {
    throw new InvalidAddressError('Amount must be between 0 and 1,000,000 XLM');
  }

  // Check balance
  const balance = await getBalance(senderAddress);
  const available = parseFloat(balance);
  const needed = amount + 0.01; // base fee buffer
  if (available < needed) {
    throw new InsufficientBalanceError(
      parseFloat(balance).toFixed(2)
    );
  }

  // Build memo
  const memoText = memo || encodeMemo(skillTag, note);

  // Check if destination exists
  let isNewAccount = false;
  try {
    await server.loadAccount(recipientAddress);
  } catch {
    isNewAccount = true;
  }

  // Load sender account
  const sourceAccount = await server.loadAccount(senderAddress);

  // Build transaction
  const builder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  if (isNewAccount) {
    // Create account operation for new addresses (requires 1+ XLM)
    if (amount < 1) {
      throw new NoDestinationAccountError();
    }
    builder.addOperation(
      StellarSdk.Operation.createAccount({
        destination: recipientAddress,
        startingBalance: amountXLM,
      })
    );
  } else {
    builder.addOperation(
      StellarSdk.Operation.payment({
        destination: recipientAddress,
        asset: StellarSdk.Asset.native(),
        amount: amountXLM,
      })
    );
  }

  builder.addMemo(StellarSdk.Memo.text(memoText));
  builder.setTimeout(30);

  const transaction = builder.build();
  return transaction.toEnvelope().toXDR('base64');
}

// ── 5. Submit Signed Transaction ─────────────────────────────

export async function submitSignedTransaction(
  signedXdrBase64: string
): Promise<TransactionResult> {
  try {
    const transaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXdrBase64,
      NETWORK_PASSPHRASE
    );

    const result = await server.submitTransaction(
      transaction as StellarSdk.Transaction
    );

    // Parse the submitted transaction to extract details
    const tx = transaction as StellarSdk.Transaction;
    const ops = tx.operations;
    const paymentOp = ops[0];

    let amount = '0';
    let recipient = '';
    if (paymentOp.type === 'payment') {
      amount = paymentOp.amount;
      recipient = paymentOp.destination;
    } else if (paymentOp.type === 'createAccount') {
      amount = paymentOp.startingBalance;
      recipient = paymentOp.destination;
    }

    // Decode memo from the transaction
    const memoText = tx.memo.type === 'text' ? (tx.memo.value as string) || '' : '';
    const { skillTag, note } = decodeMemo(memoText);
    const skillMeta = SKILL_MAP[skillTag];

    return {
      hash: result.hash,
      ledger: result.ledger,
      timestamp: new Date().toISOString(),
      amount,
      recipient,
      skillTag,
      skillMeta,
      note,
    };
  } catch (error: unknown) {
    // Parse Horizon error responses
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();

      if (msg.includes('op_no_destination')) {
        throw new NoDestinationAccountError();
      }
      if (msg.includes('op_underfunded') || msg.includes('insufficient')) {
        throw new InsufficientBalanceError();
      }
      if (msg.includes('tx_bad_seq')) {
        throw new WalletStateMismatchError();
      }
      if (msg.includes('timeout') || msg.includes('503')) {
        throw new HorizonTimeoutError();
      }
    }

    // Check for response-based errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'response' in error
    ) {
      const resp = error as {
        response?: { status?: number; data?: { extras?: { result_codes?: { operations?: string[] } } } };
      };
      
      const opCodes = resp.response?.data?.extras?.result_codes?.operations;
      if (opCodes) {
        if (opCodes.includes('op_no_destination')) {
          throw new NoDestinationAccountError();
        }
        if (opCodes.includes('op_underfunded')) {
          throw new InsufficientBalanceError();
        }
      }
      
      if (resp.response?.status === 503) {
        throw new HorizonTimeoutError();
      }
    }

    throw new NetworkError(
      error instanceof Error ? error.message : 'Transaction submission failed'
    );
  }
}

// ── 6. Address Validation ────────────────────────────────────

export function isValidStellarAddress(address: string): boolean {
  return StellarSdk.StrKey.isValidEd25519PublicKey(address);
}

// ── 7. Fund via Friendbot ────────────────────────────────────

export async function fundAccountWithFriendbot(
  address: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`
    );
    if (response.ok) {
      console.log(`✅ Account ${address.slice(0, 8)}... funded with 10,000 XLM`);
      return true;
    }
    console.warn('Friendbot returned non-OK:', response.status);
    return false;
  } catch (error) {
    console.warn('Friendbot funding failed (may be rate-limited):', error);
    return false;
  }
}

export function generateTestnetKeypair(): {
  publicKey: string;
  secretKey: string;
} {
  const pair = StellarSdk.Keypair.random();
  return {
    publicKey: pair.publicKey(),
    secretKey: pair.secret(),
  };
}

export async function getTestnetAccountInfo(
  address: string
): Promise<TestnetAccountInfo> {
  if (!isValidStellarAddress(address)) {
    throw new InvalidAddressError(address);
  }

  try {
    const account = await server.loadAccount(address);
    const nativeBalance = account.balances.find(
      (b) => b.asset_type === 'native'
    );

    return {
      accountId: account.accountId(),
      sequenceNumber: account.sequenceNumber(),
      balanceXLM: parseFloat(nativeBalance?.balance || '0').toFixed(7),
      status: 'FUNDED',
    };
  } catch (error: unknown) {
    if (error instanceof Error && 'response' in error) {
      const resp = error as { response?: { status?: number } };
      if (resp.response?.status === 404) {
        return {
          accountId: address,
          sequenceNumber: '0',
          balanceXLM: '0.0000000',
          status: 'UNFUNDED',
        };
      }
    }
    throw new NetworkError('Failed to load account information from Horizon.');
  }
}

export async function fundAndConfirmTestnetAccount(
  address: string,
  timeoutMs: number = 45_000
): Promise<TestnetAccountInfo> {
  if (!isValidStellarAddress(address)) {
    throw new InvalidAddressError(address);
  }

  const funded = await fundAccountWithFriendbot(address);
  if (!funded) {
    throw new NetworkError(
      'Friendbot funding failed. Please retry in a few seconds.'
    );
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const info = await getTestnetAccountInfo(address);
    if (info.status === 'FUNDED') {
      return info;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new HorizonTimeoutError();
}

export async function sendXlmOnTestnet(params: {
  senderSecretKey: string;
  recipientAddress: string;
  amountXLM: string;
  memoText?: string;
}): Promise<TransactionResult> {
  const { senderSecretKey, recipientAddress, amountXLM, memoText } = params;

  if (!StellarSdk.StrKey.isValidEd25519SecretSeed(senderSecretKey)) {
    throw new InvalidAddressError('Invalid secret key format. Expected S...');
  }
  if (!isValidStellarAddress(recipientAddress)) {
    throw new InvalidAddressError(recipientAddress);
  }

  const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecretKey);
  const senderAddress = senderKeypair.publicKey();

  const parsedAmount = parseFloat(amountXLM);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new InvalidAddressError('Amount must be greater than 0 XLM.');
  }

  const senderInfo = await getTestnetAccountInfo(senderAddress);
  if (senderInfo.status !== 'FUNDED') {
    throw new NetworkError('Sender account is not funded on Stellar Testnet.');
  }

  const available = parseFloat(senderInfo.balanceXLM);
  const required = parsedAmount + 0.01;
  if (available < required) {
    throw new InsufficientBalanceError(available.toFixed(2));
  }

  const destinationInfo = await getTestnetAccountInfo(recipientAddress);
  if (destinationInfo.status !== 'FUNDED') {
    throw new NoDestinationAccountError();
  }

  const sourceAccount = await server.loadAccount(senderAddress);
  const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: recipientAddress,
        asset: StellarSdk.Asset.native(),
        amount: parsedAmount.toFixed(7),
      })
    )
    .setTimeout(30);

  if (memoText) {
    txBuilder.addMemo(StellarSdk.Memo.text(memoText.slice(0, 28)));
  }

  const transaction = txBuilder.build();
  transaction.sign(senderKeypair);

  try {
    const result = await server.submitTransaction(transaction);
    return {
      hash: result.hash,
      ledger: result.ledger,
      timestamp: new Date().toISOString(),
      amount: parsedAmount.toFixed(7),
      recipient: recipientAddress,
      skillTag: 'OTHER',
      skillMeta: SKILL_MAP.OTHER,
      note: memoText || '',
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.toLowerCase().includes('underfunded')) {
      throw new InsufficientBalanceError(available.toFixed(2));
    }
    throw new NetworkError('Failed to submit payment transaction to Testnet.');
  }
}

export async function getTestnetPaymentHistory(
  address: string,
  limit: number = 20
): Promise<TestnetPaymentHistoryItem[]> {
  if (!isValidStellarAddress(address)) {
    throw new InvalidAddressError(address);
  }

  const response = await fetch(
    `${HORIZON_URL}/accounts/${address}/payments?limit=${limit}&order=desc&include_failed=true`
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    throw new NetworkError('Failed to fetch payment history from Horizon.');
  }

  const data = await response.json();
  const records = (data._embedded?.records ?? []) as Array<Record<string, unknown>>;

  return records
    .filter((record) => record.type === 'payment' || record.type === 'create_account')
    .map((record) => {
      const isCreate = record.type === 'create_account';
      const sender = isCreate
        ? (record.funder as string)
        : (record.from as string);
      const receiver = isCreate
        ? (record.account as string)
        : (record.to as string);
      const amount = isCreate
        ? (record.starting_balance as string)
        : (record.amount as string);

      return {
        hash: (record.transaction_hash as string) || (record.id as string),
        sender,
        receiver,
        amount: amount || '0.0000000',
        timestamp: (record.created_at as string) || new Date().toISOString(),
        status: record.transaction_successful === false ? 'FAILED' : 'SUCCESS',
      } satisfies TestnetPaymentHistoryItem;
    });
}

export function getTestnetAccountExplorerUrl(address: string): string {
  return `${TESTNET_EXPLORER_BASE}/account/${address}`;
}

export function getTestnetTransactionExplorerUrl(hash: string): string {
  return `${TESTNET_EXPLORER_BASE}/tx/${hash}`;
}

// ── 8. Truncate Address ──────────────────────────────────────

export function truncateAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
