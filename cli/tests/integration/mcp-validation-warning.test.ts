/**
 * Integration test for MCP validation warnings (Story 13.1)
 *
 * These tests validate that the publish workflow correctly detects MCP servers
 * in the dependencies field and displays appropriate warnings to users.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { PublishService } from '../../src/lib/publish-service.js';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock modules
jest.mock('../../src/parsers/manifest-parser');
jest.mock('../../src/lib/bundler');
jest.mock('../../src/lib/wallet-manager');
jest.mock('../../src/clients/arweave-client');
jest.mock('../../src/clients/ao-registry-client');
jest.mock('../../src/lib/skill-analyzer');
jest.mock('arweave');

import * as manifestParser from '../../src/parsers/manifest-parser';
import * as bundler from '../../src/lib/bundler';
import * as walletManager from '../../src/lib/wallet-manager';
import * as arweaveClient from '../../src/clients/arweave-client';
import * as aoRegistryClient from '../../src/clients/ao-registry-client';
import * as skillAnalyzer from '../../src/lib/skill-analyzer';
import logger from '../../src/utils/logger.js';

describe('MCP Validation Warning Integration Tests (Story 13.1)', () => {
  let service: PublishService;
  let testSkillDir: string;
  let loggerWarnSpy: jest.SpiedFunction<typeof logger.warn>;

  // Mock manifest with MCP dependencies
  const mockManifestWithMcpDeps = {
    name: 'test-skill-with-mcp',
    version: '1.0.0',
    description: 'Test skill with MCP dependencies',
    author: 'Test Author',
    tags: ['test'],
    dependencies: ['ao-basics', 'mcp__pixel-art', 'mcp__shadcn-ui'],
    license: 'MIT',
  };

  // Mock manifest without MCP dependencies
  const mockManifestWithoutMcpDeps = {
    name: 'test-skill-no-mcp',
    version: '1.0.0',
    description: 'Test skill without MCP dependencies',
    author: 'Test Author',
    tags: ['test'],
    dependencies: ['ao-basics', 'arweave-fundamentals'],
    license: 'MIT',
  };

  const mockWallet = {
    kty: 'RSA',
    n: 'mock-n',
    e: 'AQAB',
    d: 'mock-d',
    p: 'mock-p',
    q: 'mock-q',
    dp: 'mock-dp',
    dq: 'mock-dq',
    qi: 'mock-qi',
  };

  const mockAddress = 'mock-arweave-address-43-chars-long-00000';
  const mockWalletInfo = {
    address: mockAddress,
    balance: 1000000000,
    balanceFormatted: '1.0 AR',
  };

  const mockBundleResult = {
    buffer: Buffer.from('mock-bundle-data'),
    size: 2048,
    sizeFormatted: '2.0 KB',
    fileCount: 5,
    exceededLimit: false,
  };

  const mockUploadResult = {
    txId: 'mock-arweave-tx-id-43-chars-long-00000000',
    cost: 500000,
  };

  const mockBundledFiles = [
    {
      name: 'SKILL.md',
      icon: '📘',
      type: 'markdown' as const,
      size: '4.2 KB',
      description: 'Main skill file',
      level: 'Level 2' as const,
      preview: 'Skill content',
      path: 'SKILL.md',
    },
  ];

  const mockRegistryMessageId = 'mock-ao-registry-message-id';

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create service instance
    service = new PublishService();

    // Create test skill directory
    const tmpDir = await fs.mkdtemp(path.join('/tmp', 'skill-test-'));
    testSkillDir = tmpDir;

    // Spy on logger.warn
    loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

    // Setup mocks
    const mockWalletManager = walletManager as jest.Mocked<typeof walletManager>;
    mockWalletManager.load = jest.fn().mockResolvedValue(mockWallet);
    mockWalletManager.loadJWK = jest.fn().mockResolvedValue(mockWallet);
    mockWalletManager.loadFromFile = jest.fn().mockResolvedValue(mockWallet);
    mockWalletManager.checkBalance = jest.fn().mockResolvedValue(mockWalletInfo);

    const mockBundler = bundler as jest.Mocked<typeof bundler>;
    mockBundler.bundle = jest.fn().mockResolvedValue(mockBundleResult);

    const mockArweaveClient = arweaveClient as jest.Mocked<typeof arweaveClient>;
    mockArweaveClient.uploadBundle = jest.fn().mockResolvedValue(mockUploadResult);

    const mockSkillAnalyzer = skillAnalyzer as jest.Mocked<typeof skillAnalyzer>;
    mockSkillAnalyzer.analyzeSkillDirectory = jest.fn().mockResolvedValue(mockBundledFiles);
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testSkillDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    loggerWarnSpy.mockRestore();
  });

  describe('MCP dependency detection', () => {
    it('should display warning when mcp__ prefixed dependencies detected during publish', async () => {
      // Setup manifest parser to return manifest with MCP dependencies
      const mockManifestParser = manifestParser as jest.Mocked<typeof manifestParser>;
      mockManifestParser.parse = jest.fn().mockResolvedValue(mockManifestWithMcpDeps);
      mockManifestParser.validate = jest.fn().mockReturnValue({ valid: true });
      mockManifestParser.detectMcpInDependencies = jest
        .fn()
        .mockReturnValue(['mcp__pixel-art', 'mcp__shadcn-ui']);

      // Setup AO registry mock (skill doesn't exist, so this is a new registration)
      const mockAoRegistryClient = aoRegistryClient as jest.Mocked<typeof aoRegistryClient>;
      mockAoRegistryClient.getSkill = jest.fn().mockRejectedValue(new Error('Skill not found'));
      mockAoRegistryClient.registerSkill = jest
        .fn()
        .mockResolvedValue(mockRegistryMessageId);

      // Execute publish
      const result = await service.publish(testSkillDir, {
        wallet: mockWallet,
        verbose: false,
      });

      // Verify publish succeeded
      expect(result.arweaveTxId).toBe(mockUploadResult.txId);
      expect(result.registryMessageId).toBe(mockRegistryMessageId);

      // Verify warning was displayed
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        '\n⚠ Warning: MCP server references detected in dependencies field\n'
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        "The following MCP servers should be documented in the 'mcpServers' field instead:"
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith('  - mcp__pixel-art');
      expect(loggerWarnSpy).toHaveBeenCalledWith('  - mcp__shadcn-ui');
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Solution: Move these to')
      );
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Note: This skill will still publish successfully. MCP servers in dependencies will be skipped during installation.\n'
      );
    });

    it('should not display warning when no mcp__ dependencies detected', async () => {
      // Setup manifest parser to return manifest without MCP dependencies
      const mockManifestParser = manifestParser as jest.Mocked<typeof manifestParser>;
      mockManifestParser.parse = jest
        .fn()
        .mockResolvedValue(mockManifestWithoutMcpDeps);
      mockManifestParser.validate = jest.fn().mockReturnValue({ valid: true });
      mockManifestParser.detectMcpInDependencies = jest.fn().mockReturnValue([]);

      // Setup AO registry mock
      const mockAoRegistryClient = aoRegistryClient as jest.Mocked<typeof aoRegistryClient>;
      mockAoRegistryClient.getSkill = jest.fn().mockRejectedValue(new Error('Skill not found'));
      mockAoRegistryClient.registerSkill = jest
        .fn()
        .mockResolvedValue(mockRegistryMessageId);

      // Execute publish
      const result = await service.publish(testSkillDir, {
        wallet: mockWallet,
        verbose: false,
      });

      // Verify publish succeeded
      expect(result.arweaveTxId).toBe(mockUploadResult.txId);
      expect(result.registryMessageId).toBe(mockRegistryMessageId);

      // Verify NO warning was displayed
      expect(loggerWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('MCP server references detected')
      );
    });

    it('should still publish successfully even with MCP dependency warning', async () => {
      // Setup manifest parser with MCP dependencies
      const mockManifestParser = manifestParser as jest.Mocked<typeof manifestParser>;
      mockManifestParser.parse = jest.fn().mockResolvedValue(mockManifestWithMcpDeps);
      mockManifestParser.validate = jest.fn().mockReturnValue({ valid: true });
      mockManifestParser.detectMcpInDependencies = jest
        .fn()
        .mockReturnValue(['mcp__pixel-art', 'mcp__shadcn-ui']);

      // Setup AO registry mock
      const mockAoRegistryClient = aoRegistryClient as jest.Mocked<typeof aoRegistryClient>;
      mockAoRegistryClient.getSkill = jest.fn().mockRejectedValue(new Error('Skill not found'));
      mockAoRegistryClient.registerSkill = jest
        .fn()
        .mockResolvedValue(mockRegistryMessageId);

      // Execute publish
      const result = await service.publish(testSkillDir, {
        wallet: mockWallet,
        verbose: false,
      });

      // Verify publish succeeded despite warning
      expect(result.arweaveTxId).toBe(mockUploadResult.txId);
      expect(result.registryMessageId).toBe(mockRegistryMessageId);

      // Verify all publish steps completed
      expect(mockBundler.bundle).toHaveBeenCalled();
      expect(mockArweaveClient.uploadBundle).toHaveBeenCalled();
      expect(mockAoRegistryClient.registerSkill).toHaveBeenCalled();
    });
  });
});
