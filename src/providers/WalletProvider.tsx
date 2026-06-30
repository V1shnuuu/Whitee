// ─────────────────────────────────────────────────────────────
// CredVault – Wallet Context Provider
// ─────────────────────────────────────────────────────────────

'use client';

import React, { createContext, useContext } from 'react';
import { useWallet, type UseWalletReturn } from '@/hooks/useWallet';

const WalletContext = createContext<UseWalletReturn>({
  address: null,
  isConnected: false,
  network: 'TESTNET',
  isLoading: false,
  error: null,
  isFreighterAvailable: null,
  connect: async () => {},
  disconnect: () => {},
  clearError: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const wallet = useWallet();

  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext(): UseWalletReturn {
  return useContext(WalletContext);
}
// Stellar wallet context provider
