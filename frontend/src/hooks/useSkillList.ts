import { useState, useEffect } from 'react';
import { listSkills } from '@/services/ao-registry';
import type { PaginatedSkills, ListSkillsOptions } from '@/types/ao';

interface UseSkillListResult {
  data: PaginatedSkills | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for paginated skill listing
 * @param options - List options (limit, offset, filters)
 */
export function useSkillList(
  options: ListSkillsOptions = {}
): UseSkillListResult {
  const [data, setData] = useState<PaginatedSkills | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchSkills() {
      setLoading(true);
      setError(null);

      try {
        const result = await listSkills(options);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSkills();

    return () => {
      cancelled = true;
    };
  }, [
    options.limit,
    options.offset,
    options.filterName,
    options.featured,
    // Join filterTags to avoid infinite loop from array reference changes
    options.filterTags?.join(','),
    refetchTrigger,
  ]);

  return { data, loading, error, refetch };
}
