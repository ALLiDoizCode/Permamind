import { useState, useEffect } from 'react';
import { searchSkills } from '@/services/ao-registry';
import type { SkillMetadata } from '@/types/ao';

interface UseSkillSearchResult {
  skills: SkillMetadata[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for skill search with automatic debouncing
 * @param query - Search query string
 * @param debounceMs - Debounce delay in milliseconds (default: 300)
 */
export function useSkillSearch(
  query: string,
  debounceMs = 300
): UseSkillSearchResult {
  const [skills, setSkills] = useState<SkillMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    // Allow empty queries (returns all skills)
    // Only skip queries that are 1 character (too short to be useful)
    if (query.length === 1) {
      setSkills([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Debounce the search (but no debounce for empty query)
    const delay = query.length === 0 ? 0 : debounceMs;
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await searchSkills(query);
        setSkills(results);
      } catch (err) {
        setError(err as Error);
        setSkills([]);
      } finally {
        setLoading(false);
      }
    }, delay);

    // Cleanup timeout on query change
    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, refetchTrigger]);

  return { skills, loading, error, refetch };
}
