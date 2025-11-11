/**
 * Performance Benchmark Tests for Install Command
 *
 * Measures install command performance with dependency resolution.
 * Tests single skills and dependency chains.
 */

import { resolve } from '../../src/lib/dependency-resolver.js';
import { getSkill } from '../../src/clients/ao-registry-client.js';

// Mock AO registry client
jest.mock('../../src/clients/ao-registry-client.js');

const mockGetSkill = getSkill as jest.MockedFunction<typeof getSkill>;

describe('Install Command Performance Benchmarks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock to clear any mockImplementation from previous tests
    mockGetSkill.mockReset();
  });

  describe('Dependency Resolution Performance', () => {
    it('should resolve single skill quickly (<1s)', async () => {
      // Mock single skill with no dependencies
      mockGetSkill.mockResolvedValueOnce({
        name: 'single-skill',
        version: '1.0.0',
        description: 'Test skill',
        author: 'test',
        license: 'MIT',
        arweaveTxId: 'tx_id_43_chars_single_skill_0000000000',
        registeredAt: Date.now(),
      });

      const start = performance.now();

      const tree = await resolve('single-skill', {
        maxDepth: 10,
        skipInstalled: false,
        verbose: false,
      });

      const duration = performance.now() - start;

      console.log(`Single skill resolution: ${duration.toFixed(2)} ms`);

      expect(tree.root).toBeDefined();
      expect(tree.totalCount).toBe(1);
      expect(duration).toBeLessThan(1100); // <1.1s target (CI buffer)
    });

    it('should resolve 3-dependency chain efficiently (<5s)', async () => {
      // Mock 3-skill dependency chain: A -> B -> C
      mockGetSkill
        .mockResolvedValueOnce({
          name: 'skill-a',
          version: '1.0.0',
          description: 'Skill A',
          author: 'test',
          license: 'MIT',
          dependencies: ['skill-b@^1.0.0'],
          arweaveTxId: 'tx_id_43_chars_skill_a_00000000000000',
          registeredAt: Date.now(),
        })
        .mockResolvedValueOnce({
          name: 'skill-b',
          version: '1.0.0',
          description: 'Skill B',
          author: 'test',
          license: 'MIT',
          dependencies: ['skill-c@^1.0.0'],
          arweaveTxId: 'tx_id_43_chars_skill_b_00000000000000',
          registeredAt: Date.now(),
        })
        .mockResolvedValueOnce({
          name: 'skill-c',
          version: '1.0.0',
          description: 'Skill C',
          author: 'test',
          license: 'MIT',
          arweaveTxId: 'tx_id_43_chars_skill_c_00000000000000',
          registeredAt: Date.now(),
        });

      const start = performance.now();

      const tree = await resolve('skill-a', {
        maxDepth: 10,
        skipInstalled: false,
        verbose: false,
      });

      const duration = performance.now() - start;

      console.log(`3-dependency chain resolution: ${duration.toFixed(2)} ms, ${tree.totalCount} total skills`);

      expect(tree.root).toBeDefined();
      expect(tree.totalCount).toBe(3);
      expect(duration).toBeLessThan(5000); // <5s target
    });

    it.skip('should resolve 5-dependency tree efficiently (<10s)', async () => {
      // Mock 5-skill tree: A -> [B, C], B -> D, C -> E
      // Use mockImplementation to return different skills based on name parameter
      mockGetSkill.mockImplementation((name: string) => {
        // Extract skill name from version spec (e.g., "skill-b@^1.0.0" -> "skill-b")
        const skillName = name.split('@')[0];
        const skills: Record<string, any> = {
          'skill-a': {
            name: 'skill-a',
            version: '1.0.0',
            description: 'Skill A',
            author: 'test',
            license: 'MIT',
            dependencies: ['skill-b@^1.0.0', 'skill-c@^1.0.0'],
            arweaveTxId: 'tx_id_43_chars_skill_a_00000000000000',
            registeredAt: Date.now(),
          },
          'skill-b': {
            name: 'skill-b',
            version: '1.0.0',
            description: 'Skill B',
            author: 'test',
            license: 'MIT',
            dependencies: ['skill-d@^1.0.0'],
            arweaveTxId: 'tx_id_43_chars_skill_b_00000000000000',
            registeredAt: Date.now(),
          },
          'skill-c': {
            name: 'skill-c',
            version: '1.0.0',
            description: 'Skill C',
            author: 'test',
            license: 'MIT',
            dependencies: ['skill-e@^1.0.0'],
            arweaveTxId: 'tx_id_43_chars_skill_c_00000000000000',
            registeredAt: Date.now(),
          },
          'skill-d': {
            name: 'skill-d',
            version: '1.0.0',
            description: 'Skill D',
            author: 'test',
            license: 'MIT',
            dependencies: [],
            arweaveTxId: 'tx_id_43_chars_skill_d_00000000000000',
            registeredAt: Date.now(),
          },
          'skill-e': {
            name: 'skill-e',
            version: '1.0.0',
            description: 'Skill E',
            author: 'test',
            license: 'MIT',
            dependencies: [],
            arweaveTxId: 'tx_id_43_chars_skill_e_00000000000000',
            registeredAt: Date.now(),
          },
        };
        return Promise.resolve(skills[skillName] || null);
      });

      const start = performance.now();

      const tree = await resolve('skill-a', {
        maxDepth: 10,
        skipInstalled: false,
        verbose: false,
      });

      const duration = performance.now() - start;

      console.log(`5-dependency tree resolution: ${duration.toFixed(2)} ms, ${tree.totalCount} total skills`);

      expect(tree.root).toBeDefined();
      expect(tree.totalCount).toBe(5);
      expect(duration).toBeLessThan(10000); // <10s target
    });
  });

  describe('Cache Performance', () => {
    it.skip('should benefit from metadata caching on duplicate dependencies', async () => {
      // Mock tree with duplicate dependency: A -> [B, C], B -> D, C -> D (D is shared)
      mockGetSkill.mockImplementation((name: string) => {
        // Extract skill name from version spec (e.g., "skill-b@^1.0.0" -> "skill-b")
        const skillName = name.split('@')[0];
        const skills: Record<string, any> = {
          'skill-a': {
            name: 'skill-a',
            version: '1.0.0',
            description: 'Skill A',
            author: 'test',
            license: 'MIT',
            dependencies: ['skill-b@^1.0.0', 'skill-c@^1.0.0'],
            arweaveTxId: 'tx_id_43_chars_skill_a_00000000000000',
            registeredAt: Date.now(),
          },
          'skill-b': {
            name: 'skill-b',
            version: '1.0.0',
            description: 'Skill B',
            author: 'test',
            license: 'MIT',
            dependencies: ['skill-d@^1.0.0'],
            arweaveTxId: 'tx_id_43_chars_skill_b_00000000000000',
            registeredAt: Date.now(),
          },
          'skill-c': {
            name: 'skill-c',
            version: '1.0.0',
            description: 'Skill C',
            author: 'test',
            license: 'MIT',
            dependencies: ['skill-d@^1.0.0'],
            arweaveTxId: 'tx_id_43_chars_skill_c_00000000000000',
            registeredAt: Date.now(),
          },
          'skill-d': {
            name: 'skill-d',
            version: '1.0.0',
            description: 'Shared Skill D',
            author: 'test',
            license: 'MIT',
            dependencies: [],
            arweaveTxId: 'tx_id_43_chars_skill_d_00000000000000',
            registeredAt: Date.now(),
          },
        };
        return Promise.resolve(skills[skillName] || null);
      });

      const start = performance.now();

      const tree = await resolve('skill-a', {
        maxDepth: 10,
        skipInstalled: false,
        verbose: false,
      });

      const duration = performance.now() - start;

      console.log(`Shared dependency resolution: ${duration.toFixed(2)} ms, ${tree.totalCount} total skills`);

      expect(tree.root).toBeDefined();
      expect(tree.totalCount).toBe(4); // A, B, C, D (D counted once)
      expect(mockGetSkill).toHaveBeenCalledTimes(4); // Should fetch D only once
    });
  });
});
