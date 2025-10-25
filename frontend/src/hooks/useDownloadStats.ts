import { useState, useEffect, useCallback } from 'react';
import { getDownloadStats } from '@/services/ao-registry';
import type { DownloadStats } from '@/types/ao';

interface UseDownloadStatsOptions {
  scope?: 'all';
  skillName?: string;
}

interface UseDownloadStatsResult {
  stats: DownloadStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch download statistics from the AO registry
 * @param options - Either { scope: 'all' } for aggregate stats or { skillName: 'name' } for per-skill stats
 */
export function useDownloadStats(
  options: UseDownloadStatsOptions
): UseDownloadStatsResult {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    // Validate options
    if (!options.scope && !options.skillName) {
      setLoading(false);
      setError(new Error('Either scope or skillName must be provided'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryOptions = options.scope
        ? { scope: options.scope as 'all' }
        : { skillName: options.skillName! };

      const data = await getDownloadStats(queryOptions);

      if (data === null) {
        // Graceful degradation - no error thrown, just no data
        setStats(null);
      } else {
        setStats(data);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch download stats')
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [options.scope, options.skillName]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
