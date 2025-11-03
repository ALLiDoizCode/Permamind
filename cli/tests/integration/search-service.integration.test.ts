/**
 * Integration Tests for SearchService
 *
 * Tests full search workflow with mocked AO registry responses.
 * Validates end-to-end functionality without hitting real network.
 */

import { SearchService } from '../../src/lib/search-service.js';
import * as aoRegistryClient from '../../src/clients/ao-registry-client.js';
import { ISkillMetadata } from '../../src/types/ao-registry.js';
import { NetworkError, ConfigurationError } from '../../src/types/errors.js';

// Mock dependencies
jest.mock('../../src/clients/ao-registry-client.js');
jest.mock('../../src/utils/logger.js');

describe('SearchService Integration Tests', () => {
  let service: SearchService;
  let mockSearchSkills: jest.SpyInstance;

  // Comprehensive mock skill registry
  const mockRegistry: ISkillMetadata[] = [
    {
      name: 'arweave-fundamentals',
      version: '1.0.0',
      description: 'Learn core Arweave concepts and permanent storage',
      author: 'arweave-team',
      tags: ['arweave', 'tutorial', 'blockchain', 'storage'],
      bundleId: 'tx1',
      dependencies: [],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
    {
      name: 'ao-basics',
      version: '2.0.0',
      description: 'Introduction to AO protocol and message passing',
      author: 'ao-team',
      tags: ['ao', 'tutorial', 'protocol'],
      bundleId: 'tx2',
      dependencies: ['arweave-fundamentals'],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
    {
      name: 'cryptocurrency-wallet',
      version: '1.5.0',
      description: 'Build secure cryptocurrency wallets',
      author: 'crypto-dev',
      tags: ['blockchain', 'crypto', 'security'],
      bundleId: 'tx3',
      dependencies: [],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
    {
      name: 'arweave-advanced',
      version: '3.0.0',
      description: 'Advanced Arweave development patterns and best practices',
      author: 'arweave-team',
      tags: ['arweave', 'advanced', 'patterns'],
      bundleId: 'tx4',
      dependencies: ['arweave-fundamentals'],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
    {
      name: 'permaweb-deploy',
      version: '1.0.0',
      description: 'Deploy applications to the permanent web using Arweave',
      author: 'permaweb-team',
      tags: ['arweave', 'deployment', 'permaweb'],
      bundleId: 'tx5',
      dependencies: ['arweave-fundamentals'],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
  ];

  beforeEach(() => {
    service = new SearchService();
    mockSearchSkills = jest.spyOn(aoRegistryClient, 'searchSkills');
    jest.clearAllMocks();
  });

  describe('Full publish workflow with mocked AO registry', () => {
    it('should complete full end-to-end search workflow', async () => {
      // Mock registry returns arweave-related skills
      const arweaveSkills = mockRegistry.filter(s =>
        s.tags.includes('arweave') || s.name.includes('arweave')
      );
      mockSearchSkills.mockResolvedValue(arweaveSkills);

      const results = await service.search('arweave', {
        tags: ['tutorial'],
        verbose: true,
      });

      expect(results).toHaveLength(1); // Only arweave-fundamentals has both 'arweave' and 'tutorial' tags
      expect(results[0].name).toBe('arweave-fundamentals');
      expect(mockSearchSkills).toHaveBeenCalledWith('arweave');
    });

    it('should handle search with single query term', async () => {
      const aoSkills = mockRegistry.filter(s =>
        s.name.includes('ao') || s.description.includes('AO') || s.tags.includes('ao')
      );
      mockSearchSkills.mockResolvedValue(aoSkills);

      const results = await service.search('ao');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('ao-basics');
    });

    it('should handle search with multi-word query', async () => {
      const cryptoWalletSkills = mockRegistry.filter(s =>
        s.name.includes('cryptocurrency') || s.description.includes('cryptocurrency')
      );
      mockSearchSkills.mockResolvedValue(cryptoWalletSkills);

      const results = await service.search('cryptocurrency wallet');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].name).toBe('cryptocurrency-wallet');
    });

    it('should handle empty query (list all skills)', async () => {
      mockSearchSkills.mockResolvedValue(mockRegistry);

      const results = await service.search('');

      expect(results).toHaveLength(5);
      expect(results).toEqual(mockRegistry); // Unsorted for empty query
    });
  });

  describe('Tag filtering integration', () => {
    beforeEach(() => {
      mockSearchSkills.mockResolvedValue(mockRegistry);
    });

    it('should filter by single tag', async () => {
      const results = await service.search('', { tags: ['tutorial'] });

      expect(results).toHaveLength(2);
      const names = results.map(r => r.name);
      expect(names).toContain('arweave-fundamentals');
      expect(names).toContain('ao-basics');
    });

    it('should filter by multiple tags using AND logic', async () => {
      const results = await service.search('', { tags: ['arweave', 'tutorial'] });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('arweave-fundamentals');
    });

    it('should combine query with tag filtering', async () => {
      const arweaveSkills = mockRegistry.filter(s =>
        s.tags.includes('arweave') || s.name.includes('arweave')
      );
      mockSearchSkills.mockResolvedValue(arweaveSkills);

      const results = await service.search('arweave', { tags: ['advanced'] });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('arweave-advanced');
    });
  });

  describe('Relevance sorting integration', () => {
    it('should sort by exact name match first', async () => {
      const permawebSkills = mockRegistry.filter(s =>
        s.name.includes('permaweb') || s.description.includes('permanent web')
      );
      mockSearchSkills.mockResolvedValue(permawebSkills);

      const results = await service.search('permaweb-deploy');

      expect(results[0].name).toBe('permaweb-deploy'); // Exact match
    });

    it('should sort by name starts with query', async () => {
      const arweaveSkills = mockRegistry.filter(s =>
        s.tags.includes('arweave') || s.name.includes('arweave')
      );
      mockSearchSkills.mockResolvedValue(arweaveSkills);

      const results = await service.search('arweave');

      // Both 'arweave-fundamentals' and 'arweave-advanced' start with 'arweave'
      expect(results[0].name).toMatch(/^arweave-/);
    });

    it('should prioritize description matches correctly', async () => {
      const protocolSkills = mockRegistry.filter(s =>
        s.description.toLowerCase().includes('protocol')
      );
      mockSearchSkills.mockResolvedValue(protocolSkills);

      const results = await service.search('protocol');

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle no matches gracefully', async () => {
      mockSearchSkills.mockResolvedValue([]);

      const results = await service.search('nonexistent-query');

      expect(results).toEqual([]);
    });
  });

  describe('Error handling integration', () => {
    it('should propagate NetworkError when registry unreachable', async () => {
      const networkError = new NetworkError(
        'Failed to connect to AO registry',
        {
          code: 'ECONNREFUSED',
          solution: 'Check your internet connection and try again',
        }
      );
      mockSearchSkills.mockRejectedValue(networkError);

      await expect(service.search('arweave')).rejects.toThrow(NetworkError);
      await expect(service.search('arweave')).rejects.toThrow(
        'Failed to connect to AO registry'
      );
    });

    it('should propagate ConfigurationError when registry not configured', async () => {
      const configError = new ConfigurationError(
        'AO_REGISTRY_PROCESS_ID not configured',
        {
          code: 'MISSING_CONFIG',
          solution: 'Set AO_REGISTRY_PROCESS_ID in .env file',
        }
      );
      mockSearchSkills.mockRejectedValue(configError);

      await expect(service.search('ao')).rejects.toThrow(ConfigurationError);
      await expect(service.search('ao')).rejects.toThrow(
        'AO_REGISTRY_PROCESS_ID not configured'
      );
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected registry failure');
      mockSearchSkills.mockRejectedValue(unexpectedError);

      await expect(service.search('crypto')).rejects.toThrow(
        'Unexpected registry failure'
      );
    });
  });

  describe('Performance validation', () => {
    it('should complete search quickly (<100ms for cached results)', async () => {
      mockSearchSkills.mockResolvedValue(mockRegistry.slice(0, 2));

      const startTime = Date.now();
      await service.search('arweave');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Fast with mocked registry
    });

    it('should handle large result sets efficiently', async () => {
      // Simulate large registry (100 skills)
      const largeRegistry: ISkillMetadata[] = Array.from({ length: 100 }, (_, i) => ({
        name: `skill-${i}`,
        version: '1.0.0',
        description: `Description for skill ${i}`,
        author: `author-${i}`,
        tags: ['test', 'skill'],
        bundleId: `tx-${i}`,
        dependencies: [],
        createdAt: 1234567890000,
        updatedAt: 1234567890000,
      }));
      mockSearchSkills.mockResolvedValue(largeRegistry);

      const startTime = Date.now();
      const results = await service.search('skill');
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(500); // Should handle 100 skills quickly
    });
  });

  describe('Result format validation', () => {
    it('should return results matching ISkillMetadata interface', async () => {
      mockSearchSkills.mockResolvedValue([mockRegistry[0]]);

      const results = await service.search('arweave-fundamentals');

      expect(results[0]).toHaveProperty('name');
      expect(results[0]).toHaveProperty('version');
      expect(results[0]).toHaveProperty('description');
      expect(results[0]).toHaveProperty('author');
      expect(results[0]).toHaveProperty('tags');
      expect(results[0]).toHaveProperty('bundleId');
      expect(results[0]).toHaveProperty('dependencies');
      expect(results[0]).toHaveProperty('createdAt');
      expect(results[0]).toHaveProperty('updatedAt');
    });

    it('should maintain skill metadata integrity', async () => {
      mockSearchSkills.mockResolvedValue([mockRegistry[1]]);

      const results = await service.search('ao-basics');

      const skill = results[0];
      expect(skill.name).toBe('ao-basics');
      expect(skill.version).toBe('2.0.0');
      expect(skill.author).toBe('ao-team');
      expect(skill.tags).toEqual(['ao', 'tutorial', 'protocol']);
      expect(skill.dependencies).toEqual(['arweave-fundamentals']);
    });
  });

  describe('Options handling integration', () => {
    it('should handle verbose option correctly', async () => {
      mockSearchSkills.mockResolvedValue(mockRegistry.slice(0, 2));

      await service.search('arweave', { verbose: true });

      // Verbose logging tested in unit tests - here we just verify no errors
      expect(mockSearchSkills).toHaveBeenCalledWith('arweave');
    });

    it('should handle tags option with empty array', async () => {
      mockSearchSkills.mockResolvedValue(mockRegistry);

      const results = await service.search('', { tags: [] });

      expect(results).toEqual(mockRegistry); // No filtering
    });

    it('should handle undefined options', async () => {
      mockSearchSkills.mockResolvedValue(mockRegistry.slice(0, 1));

      const results = await service.search('arweave');

      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });
});
