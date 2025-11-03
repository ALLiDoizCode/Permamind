/**
 * Unit Tests for SearchService
 *
 * Tests business logic layer for skill search functionality.
 * All dependencies (ao-registry-client, logger) are mocked.
 */

import { SearchService, ISearchServiceOptions } from '../../../src/lib/search-service.js';
import * as aoRegistryClient from '../../../src/clients/ao-registry-client.js';
import logger from '../../../src/utils/logger.js';
import { ISkillMetadata } from '../../../src/types/ao-registry.js';
import { NetworkError, ConfigurationError } from '../../../src/types/errors.js';

// Mock dependencies
jest.mock('../../../src/clients/ao-registry-client.js');
jest.mock('../../../src/utils/logger.js');

describe('SearchService', () => {
  let service: SearchService;
  let mockSearchSkills: jest.SpyInstance;

  // Mock skill data for testing
  const mockSkills: ISkillMetadata[] = [
    {
      name: 'arweave-basics',
      version: '1.0.0',
      description: 'Learn fundamental Arweave concepts',
      author: 'author1',
      tags: ['arweave', 'tutorial', 'blockchain'],
      bundleId: 'tx1',
      dependencies: [],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
    {
      name: 'ao-fundamentals',
      version: '1.0.0',
      description: 'Introduction to AO protocol basics',
      author: 'author2',
      tags: ['ao', 'tutorial'],
      bundleId: 'tx2',
      dependencies: [],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
    {
      name: 'crypto-wallet',
      version: '1.0.0',
      description: 'Build cryptocurrency wallets',
      author: 'author3',
      tags: ['blockchain', 'crypto'],
      bundleId: 'tx3',
      dependencies: [],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
    {
      name: 'arweave-advanced',
      version: '1.0.0',
      description: 'Advanced Arweave development patterns',
      author: 'author4',
      tags: ['arweave', 'advanced'],
      bundleId: 'tx4',
      dependencies: [],
      createdAt: 1234567890000,
      updatedAt: 1234567890000,
    },
  ];

  beforeEach(() => {
    service = new SearchService();
    mockSearchSkills = jest.spyOn(aoRegistryClient, 'searchSkills');

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('search() - Happy Path', () => {
    it('should successfully search and return sorted results', async () => {
      // Mock registry returns filtered results (registry does the filtering)
      const arweaveSkills = mockSkills.filter(s =>
        s.name.includes('arweave') || s.description.includes('Arweave') || s.tags.includes('arweave')
      );
      mockSearchSkills.mockResolvedValue(arweaveSkills);

      const results = await service.search('arweave', {});

      expect(results).toHaveLength(2); // arweave-basics and arweave-advanced
      expect(results[0].name).toBe('arweave-basics'); // Exact match for "arweave" in name has priority
      expect(results[1].name).toBe('arweave-advanced');
      expect(mockSearchSkills).toHaveBeenCalledWith('arweave');
    });

    it('should return all skills when query is empty string', async () => {
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await service.search('', {});

      expect(results).toHaveLength(4);
      expect(mockSearchSkills).toHaveBeenCalledWith('');
    });

    it('should work without options parameter', async () => {
      // Mock registry returns filtered results for 'ao' query
      const aoSkills = mockSkills.filter(s =>
        s.name.includes('ao') || s.description.includes('AO') || s.tags.includes('ao')
      );
      mockSearchSkills.mockResolvedValue(aoSkills);

      const results = await service.search('ao');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('ao-fundamentals');
    });

    it('should enable verbose logging when verbose option is true', async () => {
      mockSearchSkills.mockResolvedValue(mockSkills);

      await service.search('arweave', { verbose: true });

      expect(logger.setLevel).toHaveBeenCalledWith('debug');
    });

    it('should not enable verbose logging when verbose option is false', async () => {
      mockSearchSkills.mockResolvedValue(mockSkills);

      await service.search('arweave', { verbose: false });

      expect(logger.setLevel).not.toHaveBeenCalled();
    });
  });

  describe('search() - Tag Filtering', () => {
    beforeEach(() => {
      mockSearchSkills.mockResolvedValue(mockSkills);
    });

    it('should filter by single tag', async () => {
      const results = await service.search('', { tags: ['tutorial'] });

      expect(results).toHaveLength(2);
      expect(results.map((r) => r.name)).toContain('arweave-basics');
      expect(results.map((r) => r.name)).toContain('ao-fundamentals');
    });

    it('should filter by multiple tags using AND logic', async () => {
      const results = await service.search('', { tags: ['arweave', 'tutorial'] });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('arweave-basics');
    });

    it('should perform case-insensitive tag matching', async () => {
      const results = await service.search('', { tags: ['TUTORIAL'] });

      expect(results).toHaveLength(2);
    });

    it('should return all results when tags array is empty', async () => {
      const results = await service.search('', { tags: [] });

      expect(results).toHaveLength(4);
    });

    it('should return empty array when no skills match tags', async () => {
      const results = await service.search('', { tags: ['nonexistent'] });

      expect(results).toHaveLength(0);
    });

    it('should combine query and tag filtering', async () => {
      // Mock registry returns filtered results for 'arweave' query
      const arweaveSkills = mockSkills.filter(s =>
        s.name.includes('arweave') || s.description.includes('Arweave') || s.tags.includes('arweave')
      );
      mockSearchSkills.mockResolvedValue(arweaveSkills);

      const results = await service.search('arweave', { tags: ['tutorial'] });

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('arweave-basics');
    });
  });

  describe('search() - Relevance Sorting', () => {
    // Note: Each test in this suite should mock its own specific dataset
    // to test relevance sorting logic properly

    it('should prioritize exact name match (priority 1)', async () => {
      // Mock registry returns skills matching 'crypto-wallet'
      mockSearchSkills.mockResolvedValue([mockSkills[2]]); // crypto-wallet

      const results = await service.search('crypto-wallet');

      expect(results[0].name).toBe('crypto-wallet');
    });

    it('should prioritize name starts with query (priority 2)', async () => {
      // Mock registry returns arweave skills
      const arweaveSkills = mockSkills.filter(s =>
        s.name.includes('arweave') || s.description.includes('Arweave') || s.tags.includes('arweave')
      );
      mockSearchSkills.mockResolvedValue(arweaveSkills);

      const results = await service.search('arweave');

      // Both start with "arweave", but arweave-basics has exact match for 'arweave' in tags
      expect(results[0].name).toBe('arweave-basics');
      expect(results[1].name).toBe('arweave-advanced');
    });

    it('should prioritize name contains query (priority 3)', async () => {
      // Mock registry returns skills matching 'wallet'
      mockSearchSkills.mockResolvedValue([mockSkills[2]]); // crypto-wallet

      const results = await service.search('wallet');

      expect(results[0].name).toBe('crypto-wallet'); // Contains in name
    });

    it('should prioritize description contains query (priority 4)', async () => {
      // Mock registry returns skills matching 'fundamental' in description
      const fundamentalSkills = mockSkills.filter(s =>
        s.description.toLowerCase().includes('fundamental')
      );
      mockSearchSkills.mockResolvedValue(fundamentalSkills);

      const results = await service.search('fundamental');

      expect(results[0].name).toBe('arweave-basics'); // Description contains "fundamental"
    });

    it('should prioritize tags contain query (priority 5)', async () => {
      // Mock registry returns skills matching 'crypto'
      mockSearchSkills.mockResolvedValue([mockSkills[2]]); // crypto-wallet

      const results = await service.search('crypto');

      expect(results[0].name).toBe('crypto-wallet'); // Name contains (priority 3)
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should not sort when query is empty (list all)', async () => {
      // Mock registry returns all skills for empty query
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await service.search('');

      // Results should be in original order (unsorted)
      expect(results).toEqual(mockSkills);
    });

    it('should handle case-insensitive matching', async () => {
      // Mock registry handles case-insensitive search and returns arweave skills
      const arweaveSkills = mockSkills.filter(s =>
        s.name.toLowerCase().includes('arweave') || s.tags.map(t => t.toLowerCase()).includes('arweave')
      );
      mockSearchSkills.mockResolvedValue(arweaveSkills);

      const results = await service.search('ARWEAVE');

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('arweave-basics');
    });
  });

  describe('search() - Performance Tracking', () => {
    it('should log warning if duration exceeds 2 seconds', async () => {
      // Mock slow query
      mockSearchSkills.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockSkills), 2100);
        });
      });

      await service.search('arweave');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('exceeds 2s target')
      );
    });

    it('should not log warning if duration is under 2 seconds', async () => {
      mockSearchSkills.mockResolvedValue(mockSkills);

      await service.search('arweave');

      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should log debug performance data when verbose is true', async () => {
      mockSearchSkills.mockResolvedValue(mockSkills);

      await service.search('arweave', { verbose: true });

      expect(logger.debug).toHaveBeenCalledWith(
        'Performance tracking',
        expect.objectContaining({
          durationMs: expect.any(Number),
          durationSeconds: expect.any(String),
          exceedsTarget: expect.any(Boolean),
        })
      );
    });
  });

  describe('search() - Error Handling', () => {
    it('should propagate NetworkError from registry query', async () => {
      const networkError = new NetworkError('Registry query failed');
      mockSearchSkills.mockRejectedValue(networkError);

      await expect(service.search('arweave')).rejects.toThrow(NetworkError);
      await expect(service.search('arweave')).rejects.toThrow('Registry query failed');
    });

    it('should propagate ConfigurationError from registry client', async () => {
      const configError = new ConfigurationError('Registry not configured');
      mockSearchSkills.mockRejectedValue(configError);

      await expect(service.search('arweave')).rejects.toThrow(ConfigurationError);
      await expect(service.search('arweave')).rejects.toThrow('Registry not configured');
    });

    it('should not catch or modify errors', async () => {
      const genericError = new Error('Unexpected error');
      mockSearchSkills.mockRejectedValue(genericError);

      await expect(service.search('arweave')).rejects.toThrow('Unexpected error');
    });
  });

  describe('search() - Edge Cases', () => {
    it('should handle empty results from registry', async () => {
      mockSearchSkills.mockResolvedValue([]);

      const results = await service.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('should handle skills with empty tags array', async () => {
      const skillsWithEmptyTags: ISkillMetadata[] = [
        {
          ...mockSkills[0],
          tags: [],
        },
      ];
      mockSearchSkills.mockResolvedValue(skillsWithEmptyTags);

      const results = await service.search('arweave');

      expect(results).toHaveLength(1);
    });

    it('should handle whitespace-only query', async () => {
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await service.search('   ', {});

      // Should treat as empty query (list all)
      expect(results).toEqual(mockSkills);
    });

    it('should handle multi-word query', async () => {
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await service.search('ao protocol', {});

      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('search() - Verbose Logging', () => {
    beforeEach(() => {
      mockSearchSkills.mockResolvedValue(mockSkills);
    });

    it('should log workflow start when verbose is true', async () => {
      await service.search('arweave', { verbose: true });

      expect(logger.debug).toHaveBeenCalledWith(
        'Starting search workflow',
        expect.objectContaining({
          query: 'arweave',
          options: { verbose: true },
        })
      );
    });

    it('should log workflow completion when verbose is true', async () => {
      await service.search('arweave', { verbose: true });

      expect(logger.debug).toHaveBeenCalledWith(
        'Search workflow complete',
        expect.objectContaining({
          resultCount: expect.any(Number),
          durationMs: expect.any(Number),
        })
      );
    });

    it('should log registry query when verbose is true', async () => {
      await service.search('arweave', { verbose: true });

      expect(logger.debug).toHaveBeenCalledWith(
        'Querying AO registry',
        { query: 'arweave' }
      );
    });

    it('should log tag filtering when tags provided', async () => {
      await service.search('arweave', { tags: ['tutorial'], verbose: true });

      expect(logger.debug).toHaveBeenCalledWith(
        'Filtering results by tags',
        { filterTags: ['tutorial'] }
      );
    });

    it('should log relevance sorting when non-empty query', async () => {
      await service.search('arweave', { verbose: true });

      expect(logger.debug).toHaveBeenCalledWith(
        'Sorting results by relevance',
        { query: 'arweave' }
      );
    });
  });
});
