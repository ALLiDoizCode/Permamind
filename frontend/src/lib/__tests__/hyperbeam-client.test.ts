import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildHyperbeamUrl,
  hyperbeamFetch,
  SEARCH_SKILLS_SCRIPT_ID,
  GET_SKILL_SCRIPT_ID,
  LIST_SKILLS_SCRIPT_ID,
} from '../hyperbeam-client';

// Mock environment variables
const MOCK_HYPERBEAM_NODE = 'https://hb.randao.net';
const MOCK_REGISTRY_PROCESS_ID = '0JwigA4ZGMredBmVq0M092gT5Liic_Yxv8c6T0tiFDw';

describe('hyperbeam-client', () => {
  describe('buildHyperbeamUrl', () => {
    it('constructs correct URL without query parameters', () => {
      const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills');

      expect(url).toContain(MOCK_HYPERBEAM_NODE);
      expect(url).toContain(MOCK_REGISTRY_PROCESS_ID);
      expect(url).toContain('~process@1.0/now/~lua@5.3a');
      expect(url).toContain(`module=${SEARCH_SKILLS_SCRIPT_ID}`);
      expect(url).toContain('/searchSkills/serialize~json@1.0');
      expect(url).not.toContain('?');
    });

    it('constructs correct URL with query parameters', () => {
      const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills', {
        query: 'blockchain',
        limit: 10,
      });

      expect(url).toContain('?query=blockchain&limit=10');
    });

    it('constructs correct URL with special characters in query', () => {
      const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills', {
        query: 'test query',
      });

      expect(url).toContain('?query=test+query');
    });

    it('omits undefined query parameters', () => {
      const url = buildHyperbeamUrl(GET_SKILL_SCRIPT_ID, 'getSkill', {
        name: 'ao-basics',
        version: undefined,
      });

      expect(url).toContain('?name=ao-basics');
      expect(url).not.toContain('version');
    });

    it('handles empty query parameters object', () => {
      const url = buildHyperbeamUrl(LIST_SKILLS_SCRIPT_ID, 'listSkills', {});

      expect(url).not.toContain('?');
    });
  });

  describe('hyperbeamFetch', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      vi.clearAllMocks();
    });

    it('returns parsed JSON on successful response', async () => {
      const mockData = { results: [], total: 0 };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills');
      const data = await hyperbeamFetch(url);

      expect(data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        url,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('throws error on HTTP error response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const url = buildHyperbeamUrl(GET_SKILL_SCRIPT_ID, 'getSkill', {
        name: 'nonexistent',
      });

      await expect(hyperbeamFetch(url)).rejects.toThrow('HTTP 404');
    });

    it('throws error on response with error status code', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 404,
          error: 'Skill not found',
        }),
      });

      const url = buildHyperbeamUrl(GET_SKILL_SCRIPT_ID, 'getSkill', {
        name: 'nonexistent',
      });

      await expect(hyperbeamFetch(url)).rejects.toThrow('Skill not found');
    });

    it('calls fallback function when HyperBEAM fails', async () => {
      const mockFallbackData = { fallback: true };
      const fallbackFn = vi.fn().mockResolvedValue(mockFallbackData);

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills');
      const data = await hyperbeamFetch(url, fallbackFn);

      expect(fallbackFn).toHaveBeenCalled();
      expect(data).toEqual(mockFallbackData);
    });

    it('throws error when both HyperBEAM and fallback fail', async () => {
      const fallbackFn = vi.fn().mockRejectedValue(new Error('Fallback error'));

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills');

      await expect(hyperbeamFetch(url, fallbackFn)).rejects.toThrow(
        'Fallback error'
      );
    });

    it('throws original error when no fallback provided', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills');

      await expect(hyperbeamFetch(url)).rejects.toThrow('Network error');
    });

    it('aborts request on timeout', async () => {
      vi.useFakeTimers();

      global.fetch = vi.fn().mockImplementation((_url, options) => {
        return new Promise((_resolve, reject) => {
          // Simulate timeout by using AbortSignal timeout
          setTimeout(() => {
            reject(new Error('The operation was aborted'));
          }, 6000);

          // Also listen to abort signal if provided
          options.signal?.addEventListener('abort', () => {
            reject(new Error('Aborted'));
          });
        });
      });

      const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills');
      const fetchPromise = hyperbeamFetch(url);

      vi.advanceTimersByTime(6000);

      await expect(fetchPromise).rejects.toThrow();

      vi.useRealTimers();
    });
  });
});
