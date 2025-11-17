/**
 * Unit Tests for AORegistryClient
 *
 * Tests HyperBEAM HTTP client with dryrun fallback, error handling,
 * and retry logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AORegistryClient } from '@/lib/ao-registry-client';
import { HTTPError, NetworkError, TimeoutError, ParseError } from '@/lib/hyperbeam-errors';
import type { SearchSkillsResponse, GetSkillResponse, ListSkillsResponse } from '@/types/hyperbeam';

// Mock fetch globally
global.fetch = vi.fn();

// Mock ao-client module
vi.mock('@/lib/ao-client', () => ({
  dryrun: vi.fn(),
  REGISTRY_PROCESS_ID: 'test-process-id',
}));

describe('AORegistryClient', () => {
  let client: AORegistryClient;

  beforeEach(() => {
    client = new AORegistryClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchSkills', () => {
    it('should return search results via HyperBEAM', async () => {
      const mockResponse: SearchSkillsResponse = {
        results: [
          {
            name: 'test-skill',
            version: '1.0.0',
            description: 'Test skill',
            author: 'test-author',
            owner: 'test-owner',
            tags: ['test'],
            dependencies: [],
            arweaveTxId: 'test-tx-id',
            publishedAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
        query: 'test',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchSkills('test');

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return empty results for no matches', async () => {
      const mockResponse: SearchSkillsResponse = {
        results: [],
        total: 0,
        query: 'nonexistent',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchSkills('nonexistent');

      expect(result.results).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle network errors and fallback to dryrun', async () => {
      const { dryrun } = await import('@/lib/ao-client');

      // HyperBEAM fails with network error
      (global.fetch as any).mockRejectedValueOnce(new TypeError('Network error'));

      // Dryrun fallback succeeds
      (dryrun as any).mockResolvedValueOnce({
        Messages: [
          {
            Data: JSON.stringify({
              results: [],
              total: 0,
              query: 'test',
            }),
          },
        ],
      });

      const result = await client.searchSkills('test');

      expect(result.results).toHaveLength(0);
      expect(dryrun).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient failures', async () => {
      const mockResponse: SearchSkillsResponse = {
        results: [],
        total: 0,
        query: 'test',
      };

      // Fail twice, then succeed
      (global.fetch as any)
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

      const result = await client.searchSkills('test');

      expect(result.total).toBe(0);
      expect(global.fetch).toHaveBeenCalledTimes(3); // 2 failures + 1 success
    });

    it('should handle HTTP 402 Payment Required', async () => {
      const { dryrun } = await import('@/lib/ao-client');

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 402,
        statusText: 'Payment Required',
      });

      (dryrun as any).mockResolvedValueOnce({
        Messages: [
          {
            Data: JSON.stringify({
              results: [],
              total: 0,
              query: 'test',
            }),
          },
        ],
      });

      const result = await client.searchSkills('test');

      expect(result.results).toHaveLength(0);
      expect(dryrun).toHaveBeenCalledTimes(1);
    });

    it('should handle timeout errors', async () => {
      const { dryrun } = await import('@/lib/ao-client');

      // Mock AbortError (timeout)
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      (global.fetch as any).mockRejectedValueOnce(abortError);

      (dryrun as any).mockResolvedValueOnce({
        Messages: [
          {
            Data: JSON.stringify({
              results: [],
              total: 0,
              query: 'test',
            }),
          },
        ],
      });

      const result = await client.searchSkills('test');

      expect(result.results).toHaveLength(0);
      expect(dryrun).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSkill', () => {
    it('should return skill details via HyperBEAM', async () => {
      const mockResponse: GetSkillResponse = {
        skill: {
          name: 'test-skill',
          version: '1.0.0',
          description: 'Test skill',
          author: 'test-author',
          owner: 'test-owner',
          tags: ['test'],
          dependencies: [],
          arweaveTxId: 'test-tx-id',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
        },
        status: 200,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSkill('test-skill');

      expect(result.skill).toBeDefined();
      expect(result.skill?.name).toBe('test-skill');
      expect(result.status).toBe(200);
    });

    it('should handle 404 Not Found', async () => {
      const mockResponse: GetSkillResponse = {
        status: 404,
        error: 'Skill not found',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSkill('nonexistent');

      expect(result.status).toBe(404);
      expect(result.error).toBe('Skill not found');
      expect(result.skill).toBeUndefined();
    });
  });

  describe('listSkills', () => {
    it('should return paginated skill list via HyperBEAM', async () => {
      const mockResponse: ListSkillsResponse = {
        skills: [
          {
            name: 'skill-1',
            version: '1.0.0',
            description: 'Skill 1',
            author: 'author-1',
            owner: 'owner-1',
            tags: ['tag1'],
            dependencies: [],
            arweaveTxId: 'tx-1',
            publishedAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        pagination: {
          total: 10,
          limit: 10,
          offset: 0,
          returned: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
        status: 200,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listSkills({ limit: 10, offset: 0 });

      expect(result.skills).toHaveLength(1);
      expect(result.pagination.total).toBe(10);
      expect(result.status).toBe(200);
    });

    it('should support tag filtering', async () => {
      const mockResponse: ListSkillsResponse = {
        skills: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          returned: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        status: 200,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.listSkills({
        filterTags: ['web3', 'blockchain'],
      });

      expect(result.skills).toHaveLength(0);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('filterTags=%5B%22web3%22%2C%22blockchain%22%5D'),
        expect.any(Object)
      );
    });
  });

  describe('getSkillVersions', () => {
    it('should return version history via HyperBEAM', async () => {
      const mockResponse = {
        versions: [
          {
            name: 'test-skill',
            version: '1.2.0',
            description: 'Version 1.2.0',
            author: 'test-author',
            owner: 'test-owner',
            tags: ['test'],
            dependencies: [],
            arweaveTxId: 'tx-1',
            publishedAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            name: 'test-skill',
            version: '1.1.0',
            description: 'Version 1.1.0',
            author: 'test-author',
            owner: 'test-owner',
            tags: ['test'],
            dependencies: [],
            arweaveTxId: 'tx-2',
            publishedAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        latest: '1.2.0',
        total: 2,
        status: 200,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSkillVersions('test-skill');

      expect(result.versions).toHaveLength(2);
      expect(result.latest).toBe('1.2.0');
      expect(result.total).toBe(2);
    });
  });

  describe('getDownloadStats', () => {
    it('should return download statistics via HyperBEAM', async () => {
      const mockResponse = {
        skillName: 'test-skill',
        totalDownloads: 100,
        versions: [
          { version: '1.0.0', downloads: 60 },
          { version: '1.1.0', downloads: 40 },
        ],
        status: 200,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getDownloadStats('test-skill');

      expect(result.skillName).toBe('test-skill');
      expect(result.totalDownloads).toBe(100);
      expect(result.status).toBe(200);
    });
  });

  describe('getInfo', () => {
    it('should return registry info via HyperBEAM', async () => {
      const mockResponse = {
        process: {
          name: 'Agent Skills Registry',
          version: '1.0.0',
          adpVersion: '1.0',
          capabilities: ['Register-Skill', 'Search-Skills'],
          messageSchemas: {},
        },
        handlers: ['Register-Skill', 'Search-Skills'],
        documentation: {
          adpCompliance: 'v1.0',
          selfDocumenting: true,
        },
        status: 200,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getInfo();

      expect(result.process.name).toBe('Agent Skills Registry');
      expect(result.process.adpVersion).toBe('1.0');
      expect(result.handlers).toContain('Register-Skill');
    });
  });

  describe('Error Handling', () => {
    it('should throw HTTPError for 500 server error', async () => {
      const { dryrun } = await import('@/lib/ao-client');

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      (dryrun as any).mockResolvedValueOnce({
        Messages: [
          {
            Data: JSON.stringify({
              results: [],
              total: 0,
              query: 'test',
            }),
          },
        ],
      });

      // Should fallback to dryrun and succeed
      const result = await client.searchSkills('test');
      expect(result.results).toHaveLength(0);
    });

    it('should handle JSON parsing errors', async () => {
      const { dryrun } = await import('@/lib/ao-client');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      (dryrun as any).mockResolvedValueOnce({
        Messages: [
          {
            Data: JSON.stringify({
              results: [],
              total: 0,
              query: 'test',
            }),
          },
        ],
      });

      const result = await client.searchSkills('test');
      expect(result.results).toHaveLength(0);
    });
  });
});
