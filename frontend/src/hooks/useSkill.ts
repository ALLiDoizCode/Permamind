import { useState, useEffect, useCallback } from 'react';
import { getSkill } from '@/services/ao-registry';
import type { SkillMetadata } from '@/types/ao';

interface UseSkillResult {
  skill: SkillMetadata | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useSkill(name: string, version?: string): UseSkillResult {
  const [skill, setSkill] = useState<SkillMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSkill = useCallback(async () => {
    if (!name) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getSkill(name, version);
      setSkill(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch skill'));
      setSkill(null);
    } finally {
      setLoading(false);
    }
  }, [name, version]);

  useEffect(() => {
    fetchSkill();
  }, [fetchSkill]);

  return {
    skill,
    loading,
    error,
    refetch: fetchSkill,
  };
}
