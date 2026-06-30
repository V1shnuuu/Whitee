// ─────────────────────────────────────────────────────────────
// CredVault – Freighter Wallet API Wrapper
// ─────────────────────────────────────────────────────────────
// Type-safe wrapper around @stellar/freighter-api.
// Never assumes window.freighter exists; every call is guarded.
// ─────────────────────────────────────────────────────────────

import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from '@stellar/freighter-api';
import {
  WalletNotInstalledError,
  FreighterRejectedError,
  NetworkError,
} from './errors';

const STORAGE_KEY = 'credvault_wallet';

/**
 * Check if Freighter browser extension is installed.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const result = await isConnected();
    return result.isConnected;
  } catch {
    return false;
  }
}

/**
 * Request wallet connection. Returns the public address.
 * Throws WalletNotInstalledError if Freighter isn't installed.
 * Throws FreighterRejectedError if user declines.
 */
export async function connectWallet(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new WalletNotInstalledError();
  }

  try {
    const accessResult = await requestAccess();
    if ('error' in accessResult && accessResult.error) {
      throw new FreighterRejectedError();
    }

    const addressResult = await getAddress();
    if ('error' in addressResult && addressResult.error) {
      throw new FreighterRejectedError();
    }

    const address = addressResult.address;
    if (!address) {
      throw new FreighterRejectedError();
    }

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, address);
    }

    return address;
  } catch (error) {
    if (error instanceof WalletNotInstalledError) throw error;
    if (error instanceof FreighterRejectedError) throw error;
    if (error instanceof Error && error.message.includes('User declined')) {
      throw new FreighterRejectedError();
    }
    throw new NetworkError('Failed to connect to Freighter wallet.');
  }
}

/**
 * Get the currently connected wallet address (if authorized).
 * Returns null if not connected.
 */
export async function getWalletAddress(): Promise<string | null> {
  try {
    const installed = await isFreighterInstalled();
    if (!installed) return null;

    const result = await getAddress();
    if ('error' in result && result.error) return null;
    return result.address || null;
  } catch {
    return null;
  }
}

/**
 * Get the current network from Freighter.
 * Returns "TESTNET", "PUBLIC", "FUTURENET", or "STANDALONE".
 */
export async function getWalletNetwork(): Promise<string> {
  try {
    const result = await getNetwork();
    if ('error' in result && result.error) return 'TESTNET';
    return result.network || 'TESTNET';
  } catch {
    return 'TESTNET';
  }
}

/**
 * Sign a transaction XDR with Freighter.
 * Returns the signed XDR base64 string.
 */
export async function signTx(xdrBase64: string): Promise<string> {
  try {
    const result = await signTransaction(xdrBase64, {
      networkPassphrase: 'Test SDF Network ; September 2015',
    });

    if ('error' in result && result.error) {
      if (result.error.includes('decline') || result.error.includes('cancel')) {
        throw new FreighterRejectedError();
      }
      throw new NetworkError(result.error);
    }

    return result.signedTxXdr;
  } catch (error) {
    if (error instanceof FreighterRejectedError) throw error;
    if (error instanceof NetworkError) throw error;
    if (error instanceof Error) {
      if (
        error.message.includes('User declined') ||
        error.message.includes('cancel')
      ) {
        throw new FreighterRejectedError();
      }
    }
    throw new NetworkError('Failed to sign transaction with Freighter.');
  }
}

/**
 * Disconnect wallet: clear localStorage.
 */
export function disconnectWallet(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Get stored wallet address from localStorage (for auto-reconnect).
 */
export function getStoredAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}
