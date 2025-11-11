/**
 * Unit tests for Dependency Resolver Module
 *
 * Tests recursive dependency resolution with mocked AO registry client.
 */

import * as dependencyResolver from '../../../src/lib/dependency-resolver';
import { DependencyError } from '../../../src/types/errors';
import * as aoRegistryClient from '../../../src/clients/ao-registry-client';
import { ISkillMetadata } from '../../../src/types/ao-registry';

// Import resolve for backwards compatibility
const { resolve } = dependencyResolver;

// Mock the AO registry client
jest.mock('../../../src/clients/ao-registry-client');

const mockGetSkill = aoRegistryClient.getSkill as jest.MockedFunction<typeof aoRegistryClient.getSkill>;

describe('Dependency Resolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Clear dependency cache to prevent test interference
    dependencyResolver.clearDependencyCache();
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
    }, 30000); // Increase timeout to 30 seconds for deep dependency resolution

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

  describe('MCP Server Filtering (Story 13.2)', () => {
    it('should filter mcp__ prefixed dependencies and track them in filteredMcpServers', async () => {
      const skillB: ISkillMetadata = {
        name: 'ao-basics',
        version: '1.0.0',
        description: 'AO Basics',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_b',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillA: ISkillMetadata = {
        name: 'pixel-art-skill',
        version: '1.0.0',
        description: 'Pixel Art Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['ao-basics', 'mcp__pixel-art', 'mcp__shadcn-ui'],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'pixel-art-skill') return skillA;
        if (name === 'ao-basics') return skillB;
        return null;
      });

      const tree = await resolve('pixel-art-skill');

      // Root node should have filtered MCP servers
      expect(tree.root.filteredMcpServers).toEqual(['mcp__pixel-art', 'mcp__shadcn-ui']);

      // Should only resolve valid skill dependencies
      expect(tree.root.dependencies).toHaveLength(1);
      expect(tree.root.dependencies[0].name).toBe('ao-basics');

      // Total count should exclude MCP servers
      expect(tree.totalCount).toBe(2); // pixel-art-skill + ao-basics
    });

    it('should handle object format dependencies with MCP servers', async () => {
      const skillB: ISkillMetadata = {
        name: 'arweave-fundamentals',
        version: '1.0.0',
        description: 'Arweave Fundamentals',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_b',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillA: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [
          { name: 'mcp__shadcn-ui', version: '1.0.0' },
          { name: 'arweave-fundamentals', version: '1.0.0' }
        ],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'test-skill') return skillA;
        if (name === 'arweave-fundamentals') return skillB;
        return null;
      });

      const tree = await resolve('test-skill');

      expect(tree.root.filteredMcpServers).toEqual(['mcp__shadcn-ui']);
      expect(tree.root.dependencies).toHaveLength(1);
      expect(tree.root.dependencies[0].name).toBe('arweave-fundamentals');
    });

    it('should return undefined filteredMcpServers when no MCP dependencies', async () => {
      const skillB: ISkillMetadata = {
        name: 'ao-basics',
        version: '1.0.0',
        description: 'AO Basics',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_b',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillA: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['ao-basics'],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'test-skill') return skillA;
        if (name === 'ao-basics') return skillB;
        return null;
      });

      const tree = await resolve('test-skill');

      expect(tree.root.filteredMcpServers).toBeUndefined();
      expect(tree.root.dependencies).toHaveLength(1);
    });

    it('should be case-sensitive (only mcp__ prefix, not MCP__ or Mcp__)', async () => {
      const skillA: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['MCP__pixel-art', 'Mcp__test', 'mcp__shadcn-ui'],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mcpUpperSkill: ISkillMetadata = {
        name: 'MCP__pixel-art',
        version: '1.0.0',
        description: 'MCP Upper',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_mcp_upper',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mcpTitleSkill: ISkillMetadata = {
        name: 'Mcp__test',
        version: '1.0.0',
        description: 'Mcp Title',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_mcp_title',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'test-skill') return skillA;
        if (name === 'MCP__pixel-art') return mcpUpperSkill;
        if (name === 'Mcp__test') return mcpTitleSkill;
        return null;
      });

      const tree = await resolve('test-skill');

      // Only lowercase mcp__ should be filtered
      expect(tree.root.filteredMcpServers).toEqual(['mcp__shadcn-ui']);

      // MCP__ and Mcp__ should be treated as regular skills
      expect(tree.root.dependencies).toHaveLength(2);
      expect(tree.root.dependencies.map(d => d.name)).toContain('MCP__pixel-art');
      expect(tree.root.dependencies.map(d => d.name)).toContain('Mcp__test');
    });

    it('should install successfully when all dependencies are MCP servers', async () => {
      const skillA: ISkillMetadata = {
        name: 'mcp-only-skill',
        version: '1.0.0',
        description: 'Skill with only MCP dependencies',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['mcp__pixel-art', 'mcp__shadcn-ui'],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockResolvedValue(skillA);

      const tree = await resolve('mcp-only-skill');

      expect(tree.root.filteredMcpServers).toEqual(['mcp__pixel-art', 'mcp__shadcn-ui']);
      expect(tree.root.dependencies).toHaveLength(0); // No actual skill dependencies
      expect(tree.totalCount).toBe(1); // Only the root skill
    });

    it('should filter MCP servers at nested dependency levels', async () => {
      const skillC: ISkillMetadata = {
        name: 'nested-skill',
        version: '1.0.0',
        description: 'Nested Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['mcp__browser-tools'],
        arweaveTxId: 'tx_c',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillB: ISkillMetadata = {
        name: 'mid-skill',
        version: '1.0.0',
        description: 'Mid Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['nested-skill', 'mcp__playwright'],
        arweaveTxId: 'tx_b',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const skillA: ISkillMetadata = {
        name: 'root-skill',
        version: '1.0.0',
        description: 'Root Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['mid-skill', 'mcp__shadcn-ui'],
        arweaveTxId: 'tx_a',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'root-skill') return skillA;
        if (name === 'mid-skill') return skillB;
        if (name === 'nested-skill') return skillC;
        return null;
      });

      const tree = await resolve('root-skill');

      // Root should have filtered MCP server
      expect(tree.root.filteredMcpServers).toEqual(['mcp__shadcn-ui']);

      // Mid-level should have filtered MCP server
      const midNode = tree.root.dependencies[0];
      expect(midNode.name).toBe('mid-skill');
      expect(midNode.filteredMcpServers).toEqual(['mcp__playwright']);

      // Nested level should have filtered MCP server
      const nestedNode = midNode.dependencies[0];
      expect(nestedNode.name).toBe('nested-skill');
      expect(nestedNode.filteredMcpServers).toEqual(['mcp__browser-tools']);

      // Verify proper dependency structure
      expect(tree.totalCount).toBe(3); // root, mid, nested (no MCP servers)
    });
  });
});
