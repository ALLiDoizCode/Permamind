/**
 * Performance Benchmark Tests for Search Command
 *
 * Measures search command performance with various query patterns.
 * Tests response time for different result set sizes.
 */

import { searchSkills } from '../../src/clients/ao-registry-client.js';

// Mock AO registry client
jest.mock('../../src/clients/ao-registry-client.js');

const mockSearchSkills = searchSkills as jest.MockedFunction<typeof searchSkills>;

describe('Search Command Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Query Performance', () => {
    it('should search with empty results quickly (<500ms)', async () => {
      mockSearchSkills.mockResolvedValueOnce([]);

      const start = performance.now();

      const results = await searchSkills('nonexistent-skill-xyz');

      const duration = performance.now() - start;

      console.log(`Search (0 results): ${duration.toFixed(2)} ms`);

      expect(results).toEqual([]);
      expect(duration).toBeLessThan(500); // <500ms for empty results
    });

    it('should search with small result set efficiently (<1s)', async () => {
      // Mock 5 results
      const mockResults = Array(5)
        .fill(0)
        .map((_, i) => ({
          name: `skill-${i}`,
          version: '1.0.0',
          description: `Test skill ${i}`,
          author: 'test',
          license: 'MIT',
          arweaveTxId: `tx_id_43_chars_skill_${i}_000000000000000`.slice(0, 43),
          registeredAt: Date.now(),
        }));

      mockSearchSkills.mockResolvedValueOnce(mockResults);

      const start = performance.now();

      const results = await searchSkills('test');

      const duration = performance.now() - start;

      console.log(`Search (5 results): ${duration.toFixed(2)} ms`);

      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(1000); // <1s for small results
    });

    it('should search with medium result set efficiently (<2s)', async () => {
      // Mock 20 results
      const mockResults = Array(20)
        .fill(0)
        .map((_, i) => ({
          name: `skill-${i}`,
          version: '1.0.0',
          description: `Test skill ${i} with longer description for testing`,
          author: 'test-author',
          license: 'MIT',
          arweaveTxId: `tx_id_43_chars_skill_${String(i).padStart(2, '0')}_00000000000`.slice(0, 43),
          registeredAt: Date.now(),
        }));

      mockSearchSkills.mockResolvedValueOnce(mockResults);

      const start = performance.now();

      const results = await searchSkills('skill');

      const duration = performance.now() - start;

      console.log(`Search (20 results): ${duration.toFixed(2)} ms`);

      expect(results).toHaveLength(20);
      expect(duration).toBeLessThan(2000); // <2s target
    });

    it('should search with large result set within target (<2s)', async () => {
      // Mock 50 results (maximum typical result set)
      const mockResults = Array(50)
        .fill(0)
        .map((_, i) => ({
          name: `skill-${i}`,
          version: '1.0.0',
          description: `Test skill ${i} with detailed description for comprehensive testing`,
          author: 'test-author',
          license: 'MIT',
          tags: ['test', 'performance', 'benchmark'],
          arweaveTxId: `tx_id_43_chars_skill_${String(i).padStart(2, '0')}_00000000000`.slice(0, 43),
          registeredAt: Date.now(),
        }));

      mockSearchSkills.mockResolvedValueOnce(mockResults);

      const start = performance.now();

      const results = await searchSkills('*');

      const duration = performance.now() - start;

      console.log(`Search (50 results): ${duration.toFixed(2)} ms`);

      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(2000); // <2s target
    });
  });

  describe('Query Pattern Performance', () => {
    it('should handle exact match queries quickly', async () => {
      mockSearchSkills.mockResolvedValueOnce([
        {
          name: 'exact-match-skill',
          version: '1.0.0',
          description: 'Exact match test',
          author: 'test',
          license: 'MIT',
          arweaveTxId: 'tx_id_43_chars_exact_match_000000000000',
          registeredAt: Date.now(),
        },
      ]);

      const start = performance.now();

      const results = await searchSkills('exact-match-skill');

      const duration = performance.now() - start;

      console.log(`Exact match query: ${duration.toFixed(2)} ms`);

      expect(results).toHaveLength(1);
      expect(duration).toBeLessThan(1000);
    });

    it('should handle partial match queries efficiently', async () => {
      const mockResults = Array(10)
        .fill(0)
        .map((_, i) => ({
          name: `partial-skill-${i}`,
          version: '1.0.0',
          description: 'Partial match test',
          author: 'test',
          license: 'MIT',
          arweaveTxId: `tx_id_43_chars_partial_${i}_0000000000000`.slice(0, 43),
          registeredAt: Date.now(),
        }));

      mockSearchSkills.mockResolvedValueOnce(mockResults);

      const start = performance.now();

      const results = await searchSkills('partial');

      const duration = performance.now() - start;

      console.log(`Partial match query: ${duration.toFixed(2)} ms`);

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Concurrent Query Performance', () => {
    it('should handle multiple concurrent queries efficiently', async () => {
      // Mock responses for 3 concurrent queries
      mockSearchSkills
        .mockResolvedValueOnce([
          {
            name: 'query1-skill',
            version: '1.0.0',
            description: 'Query 1 result',
            author: 'test',
            license: 'MIT',
            arweaveTxId: 'tx_id_43_chars_query1_0000000000000000',
            registeredAt: Date.now(),
          },
        ])
        .mockResolvedValueOnce([
          {
            name: 'query2-skill',
            version: '1.0.0',
            description: 'Query 2 result',
            author: 'test',
            license: 'MIT',
            arweaveTxId: 'tx_id_43_chars_query2_0000000000000000',
            registeredAt: Date.now(),
          },
        ])
        .mockResolvedValueOnce([
          {
            name: 'query3-skill',
            version: '1.0.0',
            description: 'Query 3 result',
            author: 'test',
            license: 'MIT',
            arweaveTxId: 'tx_id_43_chars_query3_0000000000000000',
            registeredAt: Date.now(),
          },
        ]);

      const start = performance.now();

      const results = await Promise.all([
        searchSkills('query1'),
        searchSkills('query2'),
        searchSkills('query3'),
      ]);

      const duration = performance.now() - start;

      console.log(`3 concurrent queries: ${duration.toFixed(2)} ms`);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveLength(1);
      expect(results[1]).toHaveLength(1);
      expect(results[2]).toHaveLength(1);
      expect(duration).toBeLessThan(3000); // Should benefit from parallelization
    });
  });
});
