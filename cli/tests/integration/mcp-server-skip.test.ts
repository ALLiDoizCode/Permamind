/**
 * Integration tests for MCP Server Skipping (Story 13.2)
 *
 * Tests that MCP servers are gracefully skipped during skill installation
 * and that informational messages are displayed to users.
 */

import { InstallService } from '../../src/lib/install-service.js';
import * as aoRegistryClient from '../../src/clients/ao-registry-client.js';
import * as arweaveClient from '../../src/clients/arweave-client.js';
import * as dependencyResolver from '../../src/lib/dependency-resolver.js';
import * as bundler from '../../src/lib/bundler.js';
import * as lockFileManager from '../../src/lib/lock-file-manager.js';
import * as fs from 'fs/promises';
import { ISkillMetadata } from '../../src/types/ao-registry.js';
import { InstallProgressEvent } from '../../src/lib/install-service.js';

// Mock external dependencies
jest.mock('../../src/clients/ao-registry-client');
jest.mock('../../src/clients/arweave-client');
jest.mock('../../src/lib/bundler');
jest.mock('../../src/lib/lock-file-manager');
jest.mock('fs/promises');

const mockGetSkill = aoRegistryClient.getSkill as jest.MockedFunction<typeof aoRegistryClient.getSkill>;
const mockDownloadBundle = arweaveClient.downloadBundle as jest.MockedFunction<typeof arweaveClient.downloadBundle>;

describe('MCP Server Skipping Integration (Story 13.2)', () => {
  let installService: InstallService;
  let progressEvents: InstallProgressEvent[];

  beforeEach(() => {
    jest.clearAllMocks();
    dependencyResolver.clearDependencyCache();

    installService = new InstallService();
    progressEvents = [];

    // Mock bundle downloads to return minimal valid tar.gz
    mockDownloadBundle.mockResolvedValue(Buffer.from('mock-bundle'));

    // Mock file system operations
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.access as jest.Mock).mockResolvedValue(undefined);

    // Mock bundler extraction
    (bundler.extract as jest.Mock).mockResolvedValue({ extractedFiles: [] });

    // Mock lock file manager
    (lockFileManager.resolveLockFilePath as jest.Mock).mockReturnValue('/tmp/skills-lock.json');
    (lockFileManager.update as jest.Mock).mockResolvedValue(undefined);
  });

  describe('AC 2: Display Informational Messages for Skipped MCP Servers', () => {
    it('should display informational message for skipped MCP servers', async () => {
      const aoBasics: ISkillMetadata = {
        name: 'ao-basics',
        version: '1.0.0',
        description: 'AO Basics',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_ao_basics',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const pixelArtSkill: ISkillMetadata = {
        name: 'pixel-art-skill',
        version: '1.0.0',
        description: 'Pixel Art Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['ao-basics', 'mcp__pixel-art'],
        arweaveTxId: 'tx_pixel_art',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'pixel-art-skill') return pixelArtSkill;
        if (name === 'ao-basics') return aoBasics;
        return null;
      });

      // Capture progress events
      await installService.install('pixel-art-skill', {
        installLocation: '/tmp/test-install',
        noLock: true,
        progressCallback: (event) => {
          progressEvents.push(event);
        },
      });

      // Verify "Skipping MCP server" message was emitted
      const mcpSkipMessages = progressEvents.filter(
        (e) => e.type === 'resolve-dependencies' && e.message.includes('Skipping MCP server')
      );

      expect(mcpSkipMessages.length).toBeGreaterThan(0);
      expect(mcpSkipMessages[0].message).toContain('mcp__pixel-art');
      expect(mcpSkipMessages[0].message).toContain('must be installed separately');

      // Verify only valid skill dependency (ao-basics) was downloaded
      expect(mockDownloadBundle).toHaveBeenCalledTimes(2); // pixel-art-skill + ao-basics
      expect(mockDownloadBundle).toHaveBeenCalledWith('tx_pixel_art', expect.anything());
      expect(mockDownloadBundle).toHaveBeenCalledWith('tx_ao_basics', expect.anything());
    });

    it('should install successfully when all dependencies are MCP servers', async () => {
      const mcpOnlySkill: ISkillMetadata = {
        name: 'mcp-only-skill',
        version: '1.0.0',
        description: 'Skill with only MCP dependencies',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['mcp__pixel-art', 'mcp__shadcn-ui'],
        arweaveTxId: 'tx_mcp_only',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockResolvedValue(mcpOnlySkill);

      await installService.install('mcp-only-skill', {
        installLocation: '/tmp/test-install',
        noLock: true,
        progressCallback: (event) => {
          progressEvents.push(event);
        },
      });

      // Verify both MCP servers were skipped
      const mcpSkipMessages = progressEvents.filter(
        (e) => e.type === 'resolve-dependencies' && e.message.includes('Skipping MCP server')
      );

      expect(mcpSkipMessages).toHaveLength(2);
      expect(mcpSkipMessages.some((e) => e.message.includes('mcp__pixel-art'))).toBe(true);
      expect(mcpSkipMessages.some((e) => e.message.includes('mcp__shadcn-ui'))).toBe(true);

      // Verify only root skill was downloaded (no actual dependencies)
      expect(mockDownloadBundle).toHaveBeenCalledTimes(1);
      expect(mockDownloadBundle).toHaveBeenCalledWith('tx_mcp_only', expect.anything());
    });

    it('should deduplicate MCP servers appearing in multiple skills', async () => {
      const nestedSkill: ISkillMetadata = {
        name: 'nested-skill',
        version: '1.0.0',
        description: 'Nested Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['mcp__shadcn-ui'], // Same MCP server
        arweaveTxId: 'tx_nested',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const midSkill: ISkillMetadata = {
        name: 'mid-skill',
        version: '1.0.0',
        description: 'Mid Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['nested-skill', 'mcp__shadcn-ui'], // Same MCP server again
        arweaveTxId: 'tx_mid',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const rootSkill: ISkillMetadata = {
        name: 'root-skill',
        version: '1.0.0',
        description: 'Root Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['mid-skill'],
        arweaveTxId: 'tx_root',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'root-skill') return rootSkill;
        if (name === 'mid-skill') return midSkill;
        if (name === 'nested-skill') return nestedSkill;
        return null;
      });

      await installService.install('root-skill', {
        installLocation: '/tmp/test-install',
        noLock: true,
        progressCallback: (event) => {
          progressEvents.push(event);
        },
      });

      // Verify mcp__shadcn-ui appears only once in messages (deduplicated)
      const mcpSkipMessages = progressEvents.filter(
        (e) => e.type === 'resolve-dependencies' && e.message.includes('mcp__shadcn-ui')
      );

      expect(mcpSkipMessages).toHaveLength(1); // Deduplicated
    });
  });

  describe('AC 3: Load mcpServers Field Without Installation Attempt', () => {
    it('should load mcpServers field from metadata and display informational message', async () => {
      const skillWithMcpServers: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        mcpServers: ['mcp__pixel-art', 'mcp__shadcn-ui'],
        arweaveTxId: 'tx_test',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockResolvedValue(skillWithMcpServers);

      await installService.install('test-skill', {
        installLocation: '/tmp/test-install',
        noLock: true,
        progressCallback: (event) => {
          progressEvents.push(event);
        },
      });

      // Verify mcpServers field message was emitted
      const mcpFieldMessages = progressEvents.filter(
        (e) => e.type === 'query-registry' && e.message.includes('This skill requires MCP servers')
      );

      expect(mcpFieldMessages).toHaveLength(1);
      expect(mcpFieldMessages[0].message).toContain('mcp__pixel-art');
      expect(mcpFieldMessages[0].message).toContain('mcp__shadcn-ui');
      expect(mcpFieldMessages[0].message).toContain('Install them separately');

      // Verify only root skill was downloaded (mcpServers field does NOT trigger installation)
      expect(mockDownloadBundle).toHaveBeenCalledTimes(1);
      expect(mockDownloadBundle).toHaveBeenCalledWith('tx_test', expect.anything());
    });

    it('should not attempt installation for mcpServers entries', async () => {
      const skillWithMcpServers: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: ['ao-basics'], // Regular dependency
        mcpServers: ['mcp__pixel-art'], // Informational only
        arweaveTxId: 'tx_test',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const aoBasics: ISkillMetadata = {
        name: 'ao-basics',
        version: '1.0.0',
        description: 'AO Basics',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        arweaveTxId: 'tx_ao_basics',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockImplementation(async (name: string) => {
        if (name === 'test-skill') return skillWithMcpServers;
        if (name === 'ao-basics') return aoBasics;
        return null;
      });

      await installService.install('test-skill', {
        installLocation: '/tmp/test-install',
        noLock: true,
        progressCallback: (event) => {
          progressEvents.push(event);
        },
      });

      // Verify mcpServers field message was emitted
      const mcpFieldMessages = progressEvents.filter(
        (e) => e.type === 'query-registry' && e.message.includes('This skill requires MCP servers')
      );
      expect(mcpFieldMessages).toHaveLength(1);

      // Verify only test-skill and ao-basics were downloaded (NOT mcp__pixel-art)
      expect(mockDownloadBundle).toHaveBeenCalledTimes(2);
      expect(mockDownloadBundle).toHaveBeenCalledWith('tx_test', expect.anything());
      expect(mockDownloadBundle).toHaveBeenCalledWith('tx_ao_basics', expect.anything());

      // Verify getSkill was NOT called for mcp__pixel-art
      expect(mockGetSkill).not.toHaveBeenCalledWith('mcp__pixel-art');
    });

    it('should install successfully when skill has no mcpServers field', async () => {
      const skillWithoutMcpServers: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test Skill',
        author: 'test',
        owner: 'test-address',
        tags: [],
        dependencies: [],
        // No mcpServers field
        arweaveTxId: 'tx_test',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockGetSkill.mockResolvedValue(skillWithoutMcpServers);

      await installService.install('test-skill', {
        installLocation: '/tmp/test-install',
        noLock: true,
        progressCallback: (event) => {
          progressEvents.push(event);
        },
      });

      // Verify no mcpServers field message
      const mcpFieldMessages = progressEvents.filter(
        (e) => e.type === 'query-registry' && e.message.includes('This skill requires MCP servers')
      );
      expect(mcpFieldMessages).toHaveLength(0);

      // Normal installation proceeds
      expect(mockDownloadBundle).toHaveBeenCalledTimes(1);
    });
  });
});
