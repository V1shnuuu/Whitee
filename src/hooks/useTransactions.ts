// ─────────────────────────────────────────────────────────────
// CredVault – Transaction History Hook
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback, useEffect } from 'react';
import { getRecentTransactions } from '@/lib/stellar';
import type { Credential } from '@/types';

export interface UseTransactionsReturn {
  transactions: Credential[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTransactions(address: string | null): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Credential[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const txns = await getRecentTransactions(address, 20);
      setTransactions(txns);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch transactions'
      );
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Fetch on address change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refresh = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, isLoading, error, refresh };
}
