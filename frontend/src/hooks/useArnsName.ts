import { useState, useEffect } from 'react';
import { resolvePrimaryName } from '@/lib/arns-resolver';

interface UseArnsNameResult {
  arnsName: string | null;
  loading: boolean;
  error: Error | null;
}

/**
 * React hook to resolve an Arweave address to its primary ArNS name
 * @param address - Arweave address to resolve
 * @returns Object with arnsName, loading state, and error
 */
export function useArnsName(address: string): UseArnsNameResult {
  const [arnsName, setArnsName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Flag to prevent state updates after unmount
    let isMounted = true;

    // Reset state when address changes
    setArnsName(null);
    setError(null);

    // Skip resolution for invalid addresses
    if (!address || address.length !== 43) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Resolve primary name
    resolvePrimaryName(address)
      .then((name) => {
        if (isMounted) {
          setArnsName(name);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err
              : new Error('Failed to resolve ArNS name')
          );
          setLoading(false);
        }
      });

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [address]);

  return { arnsName, loading, error };
}
