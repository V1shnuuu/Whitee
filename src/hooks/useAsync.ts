// ─────────────────────────────────────────────────────────────
// CredVault – Generic Async State Hook
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react';

interface UseAsyncReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  setData: (data: T | null) => void;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction?: (...args: unknown[]) => Promise<T>
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | null> => {
      if (!asyncFunction) return null;
      setIsLoading(true);
      setError(null);
      try {
        const result = await asyncFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return { data, isLoading, error, execute, setData, reset };
}
