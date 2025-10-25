import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDownloadStats } from '@/hooks/useDownloadStats';
import * as aoRegistry from '@/services/ao-registry';
import type { DownloadStats } from '@/types/ao';

vi.mock('@/services/ao-registry');

describe('useDownloadStats Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Aggregate stats (scope: all)', () => {
    it('fetches aggregate stats on mount', async () => {
      const mockStats: DownloadStats = {
        totalSkills: 150,
        downloads7Days: 1234,
        downloads30Days: 5678,
        downloadsTotal: 9012,
      };

      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useDownloadStats({ scope: 'all' }));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBeNull();
      expect(aoRegistry.getDownloadStats).toHaveBeenCalledWith({ scope: 'all' });
    });
  });

  describe('Per-skill stats (skillName)', () => {
    it('fetches per-skill stats on mount', async () => {
      const mockStats: DownloadStats = {
        downloads7Days: 45,
        downloads30Days: 120,
        downloadsTotal: 500,
        skillName: 'test-skill',
      };

      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() =>
        useDownloadStats({ skillName: 'test-skill' })
      );

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats);
      expect(result.current.error).toBeNull();
      expect(aoRegistry.getDownloadStats).toHaveBeenCalledWith({
        skillName: 'test-skill',
      });
    });
  });

  describe('Loading states', () => {
    it('starts with loading=true', () => {
      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue({
        downloads7Days: 0,
        downloads30Days: 0,
        downloadsTotal: 0,
      });

      const { result } = renderHook(() => useDownloadStats({ scope: 'all' }));

      expect(result.current.loading).toBe(true);
      expect(result.current.stats).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('sets loading=false after successful fetch', async () => {
      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue({
        downloads7Days: 10,
        downloads30Days: 20,
        downloadsTotal: 30,
      });

      const { result } = renderHook(() => useDownloadStats({ scope: 'all' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).not.toBeNull();
    });
  });

  describe('Error handling', () => {
    it('handles network errors gracefully', async () => {
      const mockError = new Error('Network error');
      vi.mocked(aoRegistry.getDownloadStats).mockRejectedValue(mockError);

      const { result } = renderHook(() => useDownloadStats({ scope: 'all' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.stats).toBeNull();
    });

    it('handles null response (graceful degradation)', async () => {
      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue(null);

      const { result } = renderHook(() => useDownloadStats({ scope: 'all' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('validates options and sets error if invalid', async () => {
      const { result } = renderHook(() => useDownloadStats({}));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe(
        'Either scope or skillName must be provided'
      );
    });
  });

  describe('Refetch functionality', () => {
    it('provides refetch function that re-fetches stats', async () => {
      const mockStats1: DownloadStats = {
        downloads7Days: 10,
        downloads30Days: 20,
        downloadsTotal: 30,
      };
      const mockStats2: DownloadStats = {
        downloads7Days: 15,
        downloads30Days: 25,
        downloadsTotal: 35,
      };

      vi.mocked(aoRegistry.getDownloadStats)
        .mockResolvedValueOnce(mockStats1)
        .mockResolvedValueOnce(mockStats2);

      const { result } = renderHook(() => useDownloadStats({ scope: 'all' }));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.stats).toEqual(mockStats1);

      // Trigger refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats2);
      });

      expect(aoRegistry.getDownloadStats).toHaveBeenCalledTimes(2);
    });
  });
});
