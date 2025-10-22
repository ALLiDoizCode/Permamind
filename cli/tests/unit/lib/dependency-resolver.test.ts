/**
 * Unit tests for Dependency Resolver Module
 *
 * Tests recursive dependency resolution with mocked AO registry client.
 */

import { resolve } from '../../../src/lib/dependency-resolver';
import { DependencyError } from '../../../src/types/errors';
import * as aoRegistryClient from '../../../src/clients/ao-registry-client';
import { ISkillMetadata } from '../../../src/types/ao-registry';

// Mock the AO registry client
jest.mock('../../../src/clients/ao-registry-client');

const mockGetSkill = aoRegistryClient.getSkill as jest.MockedFunction<typeof aoRegistryClient.getSkill>;

describe('Dependency Resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolve', () => {
    it('should resolve simple linear chain (A→B→C)', async () => {
      const skillC: ISkillMetadata = {
        name: 'skill-c',
        version: '1.0.0',
        description: 'Skill C',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_c',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillB: ISkillMetadata = {
        name: 'skill-b',
        version: '1.0.0',
        description: 'Skill B',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['skill-c'],
        arweaveTxId: 'tx_b',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillA: ISkillMetadata = {
        name: 'skill-a',
        version: '1.0.0',
        description: 'Skill A',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['skill-b'],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'skill-a') return skillA;
        if (name === 'skill-b') return skillB;
        if (name === 'skill-c') return skillC;
        return null;
      });

      const tree = await resolve('skill-a');

      expect(tree.root.name).toBe('skill-a');
      expect(tree.totalCount).toBe(3);
      expect(tree.maxDepth).toBe(2);
      expect(tree.flatList).toHaveLength(3);
    });

    it('should throw error when skill not found in registry', async () => {
      mockGetSkill.mockResolvedValue(null);

      await expect(resolve('nonexistent-skill')).rejects.toThrow(DependencyError);
      await expect(resolve('nonexistent-skill')).rejects.toThrow(/not found in registry/i);
    });

    it('should throw error when depth limit exceeded', async () => {
      // Create a deeply nested dependency chain
      const createDeepSkill = (name: string, nextDep?: string): ISkillMetadata => ({
        name,
        version: '1.0.0',
        description: name,
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: nextDep ? [nextDep] : [],
        arweaveTxId: `tx_${name}`,
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Create chain of 12 skills (exceeds max depth of 10)
      mockGetSkill.mockImplementation(async (name: string) => {
        const match = name.match(/skill-(\d+)/);
        if (!match) return null;

        const num = parseInt(match[1], 10);
        if (num > 12) return null;

        const nextDep = num < 12 ? `skill-${num + 1}` : undefined;
        return createDeepSkill(name, nextDep);
      });

      await expect(resolve('skill-1', { maxDepth: 10 })).rejects.toThrow(DependencyError);
      await expect(resolve('skill-1', { maxDepth: 10 })).rejects.toThrow(/depth limit exceeded/i);
    });

    it('should throw error for circular dependencies', async () => {
      const skillA: ISkillMetadata = {
        name: 'skill-a',
        version: '1.0.0',
        description: 'Skill A',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['skill-b'],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillB: ISkillMetadata = {
        name: 'skill-b',
        version: '1.0.0',
        description: 'Skill B',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['skill-a'], // Circular!
        arweaveTxId: 'tx_b',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'skill-a') return skillA;
        if (name === 'skill-b') return skillB;
        return null;
      });

      await expect(resolve('skill-a')).rejects.toThrow(DependencyError);
      await expect(resolve('skill-a')).rejects.toThrow(/circular dependency/i);
    });

    it('should resolve diamond dependency correctly', async () => {
      const skillD: ISkillMetadata = {
        name: 'skill-d',
        version: '1.0.0',
        description: 'Skill D',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_d',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillB: ISkillMetadata = {
        name: 'skill-b',
        version: '1.0.0',
        description: 'Skill B',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['skill-d'],
        arweaveTxId: 'tx_b',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillC: ISkillMetadata = {
        name: 'skill-c',
        version: '1.0.0',
        description: 'Skill C',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['skill-d'],
        arweaveTxId: 'tx_c',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillA: ISkillMetadata = {
        name: 'skill-a',
        version: '1.0.0',
        description: 'Skill A',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['skill-b', 'skill-c'],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'skill-a') return skillA;
        if (name === 'skill-b') return skillB;
        if (name === 'skill-c') return skillC;
        if (name === 'skill-d') return skillD;
        return null;
      });

      const tree = await resolve('skill-a');

      // Should have 4 unique skills despite D being referenced twice
      expect(tree.totalCount).toBe(5); // A, B, C, D (D appears twice in tree)
      expect(tree.maxDepth).toBe(2);
    });

    it('should handle skills with no dependencies', async () => {
      const skillA: ISkillMetadata = {
        name: 'skill-a',
        version: '1.0.0',
        description: 'Skill A',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockResolvedValue(skillA);

      const tree = await resolve('skill-a');

      expect(tree.root.name).toBe('skill-a');
      expect(tree.totalCount).toBe(1);
      expect(tree.maxDepth).toBe(0);
      expect(tree.flatList).toHaveLength(1);
    });

    it('should use cache for repeated skill fetches (performance optimization)', async () => {
      const skillD: ISkillMetadata = {
        name: 'skill-d',
        version: '1.0.0',
        description: 'Skill D',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_d',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillB: ISkillMetadata = {
        ...skillD,
        name: 'skill-b',
        dependencies: ['skill-d'],
      };

      const skillC: ISkillMetadata = {
        ...skillD,
        name: 'skill-c',
        dependencies: ['skill-d'],
      };

      const skillA: ISkillMetadata = {
        ...skillD,
        name: 'skill-a',
        dependencies: ['skill-b', 'skill-c'],
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'skill-a') return skillA;
        if (name === 'skill-b') return skillB;
        if (name === 'skill-c') return skillC;
        if (name === 'skill-d') return skillD;
        return null;
      });

      await resolve('skill-a');

      // skill-d is referenced twice but should only be fetched once due to caching
      const skillDCallCount = mockGetSkill.mock.calls.filter((call) => call[0] === 'skill-d').length;
      expect(skillDCallCount).toBe(1);
    });

    it('should respect verbose option', async () => {
      const skillA: ISkillMetadata = {
        name: 'skill-a',
        version: '1.0.0',
        description: 'Skill A',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockResolvedValue(skillA);

      // Should not throw with verbose mode
      const tree = await resolve('skill-a', { verbose: false });
      expect(tree).toBeDefined();

      const treeVerbose = await resolve('skill-a', { verbose: true });
      expect(treeVerbose).toBeDefined();
    });
  });
});
