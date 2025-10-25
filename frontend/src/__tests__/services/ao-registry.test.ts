import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchSkills,
  listSkills,
  getSkill,
  getSkillVersions,
  getRegistryInfo,
  clearCache,
  RegistryError,
} from '@/services/ao-registry';
import type { SkillMetadata, PaginatedSkills, VersionInfo } from '@/types/ao';

// Mock the ao-client module
vi.mock('@/lib/ao-client', () => ({
  dryrun: vi.fn(),
  REGISTRY_PROCESS_ID: 'test-process-id',
}));

import { dryrun } from '@/lib/ao-client';

const mockDryrun = dryrun as ReturnType<typeof vi.fn>;

describe('AO Registry Service', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchSkills', () => {
    const mockSkills: SkillMetadata[] = [
      {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test skill description',
        author: 'Test Author',
        owner: 'test-owner-address',
        tags: ['test', 'example'],
        dependencies: [],
        arweaveTxId: 'test-txid-12345',
        publishedAt: 1234567890,
        updatedAt: 1234567890,
        downloads: 100,
      },
    ];

    it('should successfully search skills', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockSkills),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      const result = await searchSkills('test');

      expect(result).toEqual(mockSkills);
      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Search-Skills' },
          { name: 'Query', value: 'test' },
        ],
      });
    });

    it('should handle empty query', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockSkills),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      const result = await searchSkills('');

      expect(result).toEqual(mockSkills);
      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Search-Skills' },
          { name: 'Query', value: '' },
        ],
      });
    });

    it('should sanitize query length', async () => {
      const longQuery = 'a'.repeat(300);
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify([]),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await searchSkills(longQuery);

      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Search-Skills' },
          { name: 'Query', value: 'a'.repeat(256) },
        ],
      });
    });

    it('should cache successful results', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockSkills),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      // First call
      await searchSkills('test');
      expect(mockDryrun).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result = await searchSkills('test');
      expect(mockDryrun).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSkills);
    });

    it('should throw RegistryError on empty Messages array', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [],
        Spawns: [],
        Output: [],
      });

      await expect(searchSkills('test', 0)).rejects.toThrow(RegistryError);
      await expect(searchSkills('test', 0)).rejects.toThrow(
        'No response from registry process'
      );
    });

    it('should throw RegistryError on invalid response structure', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify({ wrong: 'structure' }),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await expect(searchSkills('test', 0)).rejects.toThrow(RegistryError);
      await expect(searchSkills('test', 0)).rejects.toThrow(
        'Invalid response structure: expected array'
      );
    });

    it('should throw RegistryError on malformed JSON', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: 'invalid json',
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      const error = await searchSkills('test', 0).catch((e) => e);
      expect(error).toBeInstanceOf(RegistryError);
      expect(error.code).toBe('PARSE_ERROR');
    });

    it('should retry on failure with exponential backoff', async () => {
      vi.useFakeTimers();

      mockDryrun
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          Messages: [
            {
              Data: JSON.stringify(mockSkills),
              Target: 'test',
              Tags: [],
            },
          ],
          Spawns: [],
          Output: [],
        });

      const promise = searchSkills('test', 3);

      // Fast-forward through the retries
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toEqual(mockSkills);
      expect(mockDryrun).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    }, 10000);

    it('should throw after all retries exhausted', async () => {
      vi.useFakeTimers();

      mockDryrun.mockRejectedValue(new Error('Network error'));

      const promise = searchSkills('test', 2);
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow(RegistryError);
      expect(mockDryrun).toHaveBeenCalledTimes(3); // Initial + 2 retries

      vi.useRealTimers();
    });
  });

  describe('listSkills', () => {
    const mockPaginated: PaginatedSkills = {
      skills: [
        {
          name: 'skill-1',
          version: '1.0.0',
          description: 'First skill',
          author: 'Author 1',
          owner: 'owner-1',
          tags: ['tag1'],
          dependencies: [],
          arweaveTxId: 'txid-1',
          publishedAt: 1234567890,
          updatedAt: 1234567890,
        },
      ],
      total: 10,
      limit: 20,
      offset: 0,
    };

    it('should list skills with default options', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockPaginated),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      const result = await listSkills();

      expect(result).toEqual(mockPaginated);
      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'List-Skills' },
          { name: 'Limit', value: '20' },
          { name: 'Offset', value: '0' },
        ],
      });
    });

    it('should include filter tags', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockPaginated),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await listSkills({ filterTags: ['blockchain', 'web3'] });

      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'List-Skills' },
          { name: 'Limit', value: '20' },
          { name: 'Offset', value: '0' },
          { name: 'FilterTags', value: 'blockchain,web3' },
        ],
      });
    });

    it('should include featured flag', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockPaginated),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await listSkills({ featured: true });

      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: expect.arrayContaining([{ name: 'Featured', value: 'true' }]),
      });
    });

    it('should cache results', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockPaginated),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await listSkills({ limit: 10 });
      await listSkills({ limit: 10 });

      expect(mockDryrun).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSkill', () => {
    const mockSkill: SkillMetadata = {
      name: 'test-skill',
      version: '1.0.0',
      description: 'Test skill',
      author: 'Test Author',
      owner: 'owner-address',
      tags: ['test'],
      dependencies: [],
      arweaveTxId: 'txid-123',
      publishedAt: 1234567890,
      updatedAt: 1234567890,
    };

    it('should get skill by name', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockSkill),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      const result = await getSkill('test-skill');

      expect(result).toEqual(mockSkill);
      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Get-Skill' },
          { name: 'Name', value: 'test-skill' },
        ],
      });
    });

    it('should include version when provided', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockSkill),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await getSkill('test-skill', '1.0.0');

      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Get-Skill' },
          { name: 'Name', value: 'test-skill' },
          { name: 'Version', value: '1.0.0' },
        ],
      });
    });

    it('should throw on empty name', async () => {
      await expect(getSkill('', undefined, 0)).rejects.toThrow(RegistryError);
      await expect(getSkill('', undefined, 0)).rejects.toThrow(
        'Skill name is required'
      );
    });

    it('should throw when skill not found', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(null),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await expect(getSkill('nonexistent', undefined, 0)).rejects.toThrow(
        'Skill not found'
      );
    });
  });

  describe('getSkillVersions', () => {
    const mockVersions: VersionInfo[] = [
      {
        version: '1.0.0',
        publishedAt: 1234567890,
        arweaveTxId: 'txid-1',
      },
      {
        version: '1.1.0',
        publishedAt: 1234567900,
        arweaveTxId: 'txid-2',
      },
    ];

    it('should get skill versions', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify({ versions: mockVersions }),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      const result = await getSkillVersions('test-skill');

      expect(result).toEqual(mockVersions);
      expect(mockDryrun).toHaveBeenCalledWith({
        process: 'test-process-id',
        tags: [
          { name: 'Action', value: 'Get-Skill-Versions' },
          { name: 'Name', value: 'test-skill' },
        ],
      });
    });

    it('should throw on empty name', async () => {
      await expect(getSkillVersions('', 0)).rejects.toThrow(
        'Skill name is required'
      );
    });
  });

  describe('getRegistryInfo', () => {
    it('should get registry information', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify({
              process: {
                name: 'Test Registry',
                version: '1.0.0',
                adpVersion: '1.0',
              },
              handlers: ['Search-Skills', 'List-Skills', 'Get-Skill'],
            }),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      const result = await getRegistryInfo();

      expect(result).toEqual({
        processId: 'test-process-id',
        adpVersion: '1.0',
        handlers: ['Search-Skills', 'List-Skills', 'Get-Skill'],
        totalSkills: 0,
      });
    });

    it('should cache registry info', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify({
              process: { adpVersion: '1.0' },
              handlers: [],
            }),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await getRegistryInfo();
      await getRegistryInfo();

      expect(mockDryrun).toHaveBeenCalledTimes(1);
    });
  });

  describe('error scenarios', () => {
    it('should handle network timeout errors', async () => {
      mockDryrun.mockRejectedValue(new Error('Request timeout'));

      await expect(searchSkills('test', 0)).rejects.toThrow(RegistryError);
    });

    it('should handle HTML error responses', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: '<html><body>Error</body></html>',
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      const error = await searchSkills('test', 0).catch((e) => e);
      expect(error).toBeInstanceOf(RegistryError);
      expect(error.code).toBe('PARSE_ERROR');
    });

    it('should handle missing Data field', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Target: 'test',
            Tags: [],
          } as any,
        ],
        Spawns: [],
        Output: [],
      });

      await expect(searchSkills('test', 0)).rejects.toThrow(RegistryError);
    });

    it('should handle registry Error field', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify([]),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
        Error: 'Process error occurred',
      });

      const error = await searchSkills('test', 0).catch((e) => e);
      expect(error).toBeInstanceOf(RegistryError);
      expect(error.code).toBe('REGISTRY_ERROR');
    });
  });

  describe('cache management', () => {
    it('should clear cache on clearCache call', async () => {
      mockDryrun.mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify([]),
            Target: 'test',
            Tags: [],
          },
        ],
        Spawns: [],
        Output: [],
      });

      await searchSkills('test');
      expect(mockDryrun).toHaveBeenCalledTimes(1);

      clearCache();

      await searchSkills('test');
      expect(mockDryrun).toHaveBeenCalledTimes(2);
    });
  });
});
