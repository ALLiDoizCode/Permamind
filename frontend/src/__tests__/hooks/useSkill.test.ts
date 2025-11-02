import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSkill } from '@/hooks/useSkill';
import * as aoRegistry from '@/services/ao-registry';

vi.mock('@/services/ao-registry');

describe('useSkill Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches skill data on mount', async () => {
    const mockSkill = {
      name: 'test-skill',
      version: '1.0.0',
      author: 'test-author',
      owner: 'test-owner',
      description: 'Test description',
      tags: ['test'],
      dependencies: [],
      arweaveTxId: 'test-tx-id',
      publishedAt: 123456,
      updatedAt: 123456,
      downloads: 100,
    };

    vi.mocked(aoRegistry.getSkill).mockResolvedValue(mockSkill);

    const { result } = renderHook(() => useSkill('test-skill'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.skill).toEqual(mockSkill);
    expect(result.current.error).toBeNull();
  });

  it('handles errors correctly', async () => {
    const mockError = new Error('Skill not found');
    vi.mocked(aoRegistry.getSkill).mockRejectedValue(mockError);

    const { result } = renderHook(() => useSkill('nonexistent'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.skill).toBeNull();
  });
});
