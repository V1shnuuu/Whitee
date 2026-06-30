// ─────────────────────────────────────────────────────────────
// CredVault – Balance & Credibility Score Hook
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getBalance, getCredibilityScore } from '@/lib/stellar';

export interface UseBalanceReturn {
  balance: string;
  credibilityScore: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const REFRESH_INTERVAL = 30_000; // 30 seconds

export function useBalance(address: string | null): UseBalanceReturn {
  const [balance, setBalance] = useState<string>('0.00');
  const [credibilityScore, setCredibilityScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) {
      setBalance('0.00');
      setCredibilityScore(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [bal, score] = await Promise.all([
        getBalance(address),
        getCredibilityScore(address),
      ]);
      setBalance(parseFloat(bal).toFixed(2));
      setCredibilityScore(score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Fetch on address change
  useEffect(() => {
    fetchData();

    // Set up auto-refresh interval
    if (address) {
      intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [address, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { balance, credibilityScore, isLoading, error, refresh };
}
