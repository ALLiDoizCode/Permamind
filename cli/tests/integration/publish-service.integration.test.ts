/**
 * Integration tests for PublishService
 *
 * These tests validate the complete end-to-end publish workflow:
 * - Full publish workflow with mocked Arweave + AO registry
 * - Seed phrase wallet vs file-based wallet flows
 * - Custom gateway URL configuration
 * - Update existing skill vs register new skill flows
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { PublishService } from '../../src/lib/publish-service.js';
import { promises as fs } from 'fs';
import * as path from 'path';

// Mock modules WITHOUT .js extension to match source imports
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
import Arweave from 'arweave';

describe('PublishService Integration Tests', () => {
  let service: PublishService;
  let testSkillDir: string;
  let testWalletPath: string;

  // Mock data
  const mockManifest = {
    name: 'integration-test-skill',
    version: '1.0.0',
    description: 'Integration test skill',
    author: 'Test Author',
    tags: ['test'],
    dependencies: [],
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
    // Reset all mocks (factory mocks created once by jest.mock() above)
    jest.clearAllMocks();

    // Create service instance
    service = new PublishService();

    // Create temporary test directory and files
    testSkillDir = path.join(process.cwd(), 'test-skill-integration');
    testWalletPath = path.join(process.cwd(), 'test-wallet-integration.json');

    // Create test skill directory
    await fs.mkdir(testSkillDir, { recursive: true });
    await fs.writeFile(
      path.join(testSkillDir, 'SKILL.md'),
      '---\nname: test-skill\nversion: 1.0.0\n---\n# Test Skill',
      'utf-8'
    );

    // Create test wallet file
    await fs.writeFile(
      testWalletPath,
      JSON.stringify(mockWallet, null, 2),
      'utf-8'
    );

    // Setup default mock implementations (same pattern as install-service.test.ts)
    (manifestParser.parse as jest.Mock).mockResolvedValue(mockManifest);
    (manifestParser.validate as jest.Mock).mockReturnValue({ valid: true });

    (walletManager.load as jest.Mock).mockResolvedValue(mockWallet);
    (walletManager.checkBalance as jest.Mock).mockResolvedValue(mockWalletInfo);

    (bundler.bundle as jest.Mock).mockResolvedValue(mockBundleResult);

    (arweaveClient.uploadBundle as jest.Mock).mockResolvedValue(mockUploadResult);

    (skillAnalyzer.analyzeSkillDirectory as jest.Mock).mockResolvedValue(mockBundledFiles);

    // Default: skill does not exist (new registration)
    (aoRegistryClient.getSkill as jest.Mock).mockRejectedValue(new Error('Skill not found'));
    (aoRegistryClient.registerSkill as jest.Mock).mockResolvedValue(mockRegistryMessageId);
    (aoRegistryClient.updateSkill as jest.Mock).mockResolvedValue(mockRegistryMessageId);

    // Mock Arweave SDK
    const mockArweaveInstance = {
      wallets: {
        jwkToAddress: jest.fn().mockResolvedValue(mockAddress),
      },
    };
    (Arweave.init as jest.Mock).mockReturnValue(mockArweaveInstance);
  });

  afterEach(async () => {
    // Clean up test files
    await fs.rm(testSkillDir, { recursive: true, force: true });
    await fs.rm(testWalletPath, { force: true });
  });

  describe('Full publish workflow with mocked Arweave + AO registry', () => {
    it('should complete full end-to-end publish workflow', async () => {
      const result = await service.publish(testSkillDir, {
        walletPath: testWalletPath,
        verbose: false,
      });

      // Verify result structure
      expect(result).toMatchObject({
        skillName: mockManifest.name,
        version: mockManifest.version,
        arweaveTxId: mockUploadResult.txId,
        bundleSize: mockBundleResult.size,
        uploadCost: mockUploadResult.cost,
        registryMessageId: mockRegistryMessageId,
        publishedAt: expect.any(Number),
      });

      // Verify workflow steps executed in order
      expect(manifestParser.parse).toHaveBeenCalled();
      expect(manifestParser.validate).toHaveBeenCalled();
      expect(walletManager.load).toHaveBeenCalledWith(testWalletPath);
      expect(walletManager.checkBalance).toHaveBeenCalledWith(mockAddress);
      expect(bundler.bundle).toHaveBeenCalledWith(testSkillDir, expect.any(Object));
      expect(arweaveClient.uploadBundle).toHaveBeenCalled();
      expect(skillAnalyzer.analyzeSkillDirectory).toHaveBeenCalledWith(testSkillDir);
      expect(aoRegistryClient.getSkill).toHaveBeenCalled();
      expect(aoRegistryClient.registerSkill).toHaveBeenCalled();
    });

    it('should handle publish with progress tracking', async () => {
      const progressEvents: string[] = [];

      await service.publish(testSkillDir, {
        walletPath: testWalletPath,
        progressCallback: (event) => {
          progressEvents.push(event.type);
        },
      });

      // Verify all progress events emitted
      expect(progressEvents).toContain('validating');
      expect(progressEvents).toContain('parsing');
      expect(progressEvents).toContain('bundling');
      expect(progressEvents).toContain('uploading');
      expect(progressEvents).toContain('registering');
      expect(progressEvents).toContain('complete');
    });
  });

  describe('Seed phrase wallet vs file-based wallet flows', () => {
    it('should publish with seed phrase wallet (SEED_PHRASE env var flow)', async () => {
      // Simulate pre-loaded wallet (like from SEED_PHRASE env var)
      const result = await service.publish(testSkillDir, {
        wallet: mockWallet, // Pre-loaded wallet
        verbose: false,
      });

      // Verify wallet-manager.load NOT called (wallet already loaded)
      expect(walletManager.load).not.toHaveBeenCalled();

      // Verify balance check still performed
      expect(walletManager.checkBalance).toHaveBeenCalledWith(mockAddress);

      // Verify publish succeeded
      expect(result.skillName).toBe(mockManifest.name);
      expect(result.arweaveTxId).toBe(mockUploadResult.txId);
    });

    it('should publish with file-based wallet (walletPath option)', async () => {
      const result = await service.publish(testSkillDir, {
        walletPath: testWalletPath, // Load wallet from file
        verbose: false,
      });

      // Verify wallet loaded from file
      expect(walletManager.load).toHaveBeenCalledWith(testWalletPath);

      // Verify balance check performed
      expect(walletManager.checkBalance).toHaveBeenCalledWith(mockAddress);

      // Verify publish succeeded
      expect(result.skillName).toBe(mockManifest.name);
      expect(result.arweaveTxId).toBe(mockUploadResult.txId);
    });

    it('should prioritize pre-loaded wallet over walletPath', async () => {
      const result = await service.publish(testSkillDir, {
        wallet: mockWallet, // Pre-loaded wallet (takes precedence)
        walletPath: testWalletPath, // Should be ignored
        verbose: false,
      });

      // Verify wallet-manager.load NOT called
      expect(walletManager.load).not.toHaveBeenCalled();

      // Verify publish succeeded with pre-loaded wallet
      expect(result.skillName).toBe(mockManifest.name);
    });
  });

  describe('Custom gateway URL configuration', () => {
    it('should publish with custom gateway URL', async () => {
      const customGateway = 'https://custom-gateway.example.com';

      await service.publish(testSkillDir, {
        walletPath: testWalletPath,
        gatewayUrl: customGateway,
      });

      // Verify custom gateway passed to upload
      expect(arweaveClient.uploadBundle).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          skillName: mockManifest.name,
          skillVersion: mockManifest.version,
        }),
        mockWallet,
        expect.objectContaining({
          gatewayUrl: customGateway,
        })
      );
    });

    it('should use default gateway when gatewayUrl not provided', async () => {
      await service.publish(testSkillDir, {
        walletPath: testWalletPath,
        // No gatewayUrl specified
      });

      // Verify upload called without custom gateway
      expect(arweaveClient.uploadBundle).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({
          skillName: mockManifest.name,
        }),
        mockWallet,
        expect.objectContaining({
          gatewayUrl: undefined, // Default gateway
        })
      );
    });
  });

  describe('Update existing skill vs register new skill flows', () => {
    it('should use Update-Skill flow when skill already exists', async () => {
      // Mock skill already exists in registry
      (aoRegistryClient.getSkill as jest.Mock).mockResolvedValue({
        name: 'integration-test-skill',
        version: '0.9.0',
        owner: mockAddress,
      });

      const result = await service.publish(testSkillDir, {
        walletPath: testWalletPath,
      });

      // Verify updateSkill called (not registerSkill)
      expect(aoRegistryClient.updateSkill).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockManifest.name,
          version: mockManifest.version,
          arweaveTxId: mockUploadResult.txId,
        }),
        mockWallet
      );
      expect(aoRegistryClient.registerSkill).not.toHaveBeenCalled();

      // Verify result
      expect(result.skillName).toBe(mockManifest.name);
      expect(result.registryMessageId).toBe(mockRegistryMessageId);
    });

    it('should use Register-Skill flow when skill does not exist', async () => {
      // Mock skill not found in registry (default behavior)
      (aoRegistryClient.getSkill as jest.Mock).mockRejectedValue(
        new Error('Skill not found')
      );

      const result = await service.publish(testSkillDir, {
        walletPath: testWalletPath,
      });

      // Verify registerSkill called (not updateSkill)
      expect(aoRegistryClient.registerSkill).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockManifest.name,
          version: mockManifest.version,
          arweaveTxId: mockUploadResult.txId,
          owner: mockAddress,
        }),
        mockWallet
      );
      expect(aoRegistryClient.updateSkill).not.toHaveBeenCalled();

      // Verify result
      expect(result.skillName).toBe(mockManifest.name);
      expect(result.registryMessageId).toBe(mockRegistryMessageId);
    });

    it('should include bundled files metadata in registry registration', async () => {
      await service.publish(testSkillDir, {
        walletPath: testWalletPath,
      });

      // Verify bundled files included in registry metadata
      expect(aoRegistryClient.registerSkill).toHaveBeenCalledWith(
        expect.objectContaining({
          bundledFiles: mockBundledFiles,
        }),
        mockWallet
      );
    });

    it('should include all manifest fields in registry metadata', async () => {
      await service.publish(testSkillDir, {
        walletPath: testWalletPath,
      });

      // Verify all manifest fields passed to registry
      expect(aoRegistryClient.registerSkill).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockManifest.name,
          version: mockManifest.version,
          description: mockManifest.description,
          author: mockManifest.author,
          tags: mockManifest.tags,
          dependencies: mockManifest.dependencies,
          license: mockManifest.license,
          owner: mockAddress,
          publishedAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
        mockWallet
      );
    });
  });

  describe('Error handling in integration scenarios', () => {
    it('should propagate manifest validation errors', async () => {
      // Mock invalid manifest
      (manifestParser.validate as jest.Mock).mockReturnValue({
        valid: false,
        errors: ['Invalid skill name format'],
      });

      await expect(
        service.publish(testSkillDir, {
          walletPath: testWalletPath,
        })
      ).rejects.toThrow();
    });

    it('should propagate wallet loading errors', async () => {
      // Mock wallet load failure
      (walletManager.load as jest.Mock).mockRejectedValue(
        new Error('Wallet file not found')
      );

      await expect(
        service.publish(testSkillDir, {
          walletPath: '/nonexistent/wallet.json',
        })
      ).rejects.toThrow('Wallet file not found');
    });

    it('should propagate upload errors', async () => {
      // Mock upload failure
      (arweaveClient.uploadBundle as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(
        service.publish(testSkillDir, {
          walletPath: testWalletPath,
        })
      ).rejects.toThrow('Network timeout');
    });

    it('should propagate registry errors', async () => {
      // Mock registry failure
      (aoRegistryClient.registerSkill as jest.Mock).mockRejectedValue(
        new Error('Registry service unavailable')
      );

      await expect(
        service.publish(testSkillDir, {
          walletPath: testWalletPath,
        })
      ).rejects.toThrow('Registry service unavailable');
    });
  });
});
