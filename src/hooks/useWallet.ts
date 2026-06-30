// ─────────────────────────────────────────────────────────────
// CredVault – Wallet Connection Hook
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  connectWallet as freighterConnect,
  disconnectWallet as freighterDisconnect,
  getStoredAddress,
  getWalletNetwork,
  isFreighterInstalled,
} from '@/lib/freighter';
import { getErrorMessage } from '@/lib/errors';

export interface UseWalletReturn {
  address: string | null;
  isConnected: boolean;
  network: string;
  isLoading: boolean;
  error: string | null;
  isFreighterAvailable: boolean | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearError: () => void;
}

export function useWallet(): UseWalletReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>('TESTNET');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFreighterAvailable, setIsFreighterAvailable] = useState<
    boolean | null
  >(null);

  const isConnected = address !== null;

  // Check Freighter availability on mount
  useEffect(() => {
    const checkFreighter = async () => {
      const installed = await isFreighterInstalled();
      setIsFreighterAvailable(installed);
    };
    checkFreighter();
  }, []);

  // Auto-reconnect from localStorage on mount
  useEffect(() => {
    const stored = getStoredAddress();
    if (stored) {
      setAddress(stored);
      // Fetch network in background
      getWalletNetwork()
        .then((net) => setNetwork(net))
        .catch(() => {});
    }
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const addr = await freighterConnect();
      setAddress(addr);
      const net = await getWalletNetwork();
      setNetwork(net);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    freighterDisconnect();
    setAddress(null);
    setNetwork('TESTNET');
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    address,
    isConnected,
    network,
    isLoading,
    error,
    isFreighterAvailable,
    connect,
    disconnect,
    clearError,
  };
}
// Stellar wallet hook
