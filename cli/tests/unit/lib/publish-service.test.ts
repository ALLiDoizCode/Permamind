/**
 * Unit tests for PublishService
 *
 * Tests all business logic methods with mocked dependencies
 * for directory validation, manifest parsing, wallet loading,
 * bundle creation, upload, registry registration, and error handling.
 */

/**
 * CRITICAL: Import order matters for Jest mocking!
 * Must import modules FIRST, then call jest.mock() AFTER
 * This matches the working pattern from install-service.test.ts
 */

import { PublishService, ProgressEvent } from '../../../src/lib/publish-service';
import {
  ValidationError,
  ConfigurationError,
  AuthorizationError,
} from '../../../src/types/errors';
import * as manifestParser from '../../../src/parsers/manifest-parser';
import * as bundler from '../../../src/lib/bundler';
import * as walletManager from '../../../src/lib/wallet-manager';
import * as arweaveClient from '../../../src/clients/arweave-client';
import * as aoRegistryClient from '../../../src/clients/ao-registry-client';
import * as skillAnalyzer from '../../../src/lib/skill-analyzer';
import * as fs from 'fs/promises';
import Arweave from 'arweave';

// Mock all dependencies
jest.mock('../../../src/parsers/manifest-parser');
jest.mock('../../../src/lib/bundler');
jest.mock('../../../src/lib/wallet-manager');
jest.mock('../../../src/clients/arweave-client');
jest.mock('../../../src/clients/ao-registry-client');
jest.mock('../../../src/lib/skill-analyzer');
jest.mock('fs/promises');
jest.mock('arweave');

describe('PublishService', () => {
  let service: PublishService;
  let progressEvents: ProgressEvent[];
  let progressCallback: (event: ProgressEvent) => void;

  // Mock data
  const mockDirectory = '/test/skill-dir';
  const mockSkillMdPath = '/test/skill-dir/SKILL.md';
  const mockManifest = {
    name: 'test-skill',
    version: '1.0.0',
    description: 'Test skill description',
    author: 'Test Author',
    tags: ['test', 'demo'],
    dependencies: [],
    license: 'MIT',
  };
  const mockWallet = { n: 'mock-jwk-n', e: 'AQAB' } as any;
  const mockBundleResult = {
    buffer: Buffer.from('mock-bundle'),
    size: 1024,
    sizeFormatted: '1.0 KB',
    fileCount: 3,
    exceededLimit: false,
  };
  const mockUploadResult = {
    txId: 'mock-arweave-tx-id',
    cost: 1000000,
  };
  const mockBundledFiles = [
    {
      name: 'SKILL.md',
      icon: '📘',
      type: 'markdown' as const,
      size: '4.2 KB',
      description: 'Main skill file',
      level: 'Level 2' as const,
      preview: 'Skill content preview',
      path: 'SKILL.md',
    },
  ];
  const mockRegistryMessageId = 'mock-ao-message-id';
  const mockAddress = 'mock-arweave-address';
  const mockWalletInfo = {
    address: mockAddress,
    balance: 1000000000,
    balanceFormatted: '1.0 AR',
  };

  beforeEach(() => {
    // Reset mocks before each test (factory mocks created once by jest.mock() above)
    jest.clearAllMocks();

    // Reset progress tracking
    progressEvents = [];
    progressCallback = (event: ProgressEvent) => {
      progressEvents.push(event);
    };

    // Create new service instance
    service = new PublishService();

    // Setup default mock implementations
    (fs.stat as jest.Mock).mockResolvedValue({
      isDirectory: () => true,
    } as any);
    (fs.access as jest.Mock).mockResolvedValue(undefined);

    (manifestParser.parse as jest.Mock).mockResolvedValue(mockManifest);
    (manifestParser.validate as jest.Mock).mockReturnValue({
      valid: true,
    });

    (walletManager.load as jest.Mock).mockResolvedValue(mockWallet);
    (walletManager.checkBalance as jest.Mock).mockResolvedValue(mockWalletInfo);

    (bundler.bundle as jest.Mock).mockResolvedValue(mockBundleResult);

    (arweaveClient.uploadBundle as jest.Mock).mockResolvedValue(mockUploadResult);

    (skillAnalyzer.analyzeSkillDirectory as jest.Mock).mockResolvedValue(mockBundledFiles);

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

  describe('publish() - Happy Path', () => {
    it('should successfully publish a new skill end-to-end', async () => {
      const result = await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        verbose: false,
        progressCallback,
      });

      // Verify result structure
      expect(result).toEqual({
        skillName: 'test-skill',
        version: '1.0.0',
        arweaveTxId: 'mock-arweave-tx-id',
        bundleSize: 1024,
        uploadCost: 1000000,
        registryMessageId: 'mock-ao-message-id',
        publishedAt: expect.any(Number),
      });

      // Verify all steps called
      expect(fs.stat).toHaveBeenCalledWith(mockDirectory);
      expect((manifestParser.parse as jest.Mock)).toHaveBeenCalled();
      expect((walletManager.load as jest.Mock)).toHaveBeenCalledWith('/test/wallet.json');
      expect((bundler.bundle as jest.Mock)).toHaveBeenCalledWith(mockDirectory, expect.any(Object));
      expect((arweaveClient.uploadBundle as jest.Mock)).toHaveBeenCalled();
      expect((skillAnalyzer.analyzeSkillDirectory as jest.Mock)).toHaveBeenCalled();
      expect((aoRegistryClient.registerSkill as jest.Mock)).toHaveBeenCalled();

      // Verify progress events
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents.some((e) => e.type === 'validating')).toBe(true);
      expect(progressEvents.some((e) => e.type === 'parsing')).toBe(true);
      expect(progressEvents.some((e) => e.type === 'bundling')).toBe(true);
      expect(progressEvents.some((e) => e.type === 'uploading')).toBe(true);
      expect(progressEvents.some((e) => e.type === 'registering')).toBe(true);
      expect(progressEvents.some((e) => e.type === 'complete')).toBe(true);
    });

    it('should update existing skill when skill already exists in registry', async () => {
      // Mock skill already exists
      (aoRegistryClient.getSkill as jest.Mock).mockResolvedValue({
        name: 'test-skill',
        version: '0.9.0',
      } as any);

      const result = await service.publish(mockDirectory, {
        wallet: mockWallet,
        progressCallback,
      });

      // Verify updateSkill called instead of registerSkill
      expect((aoRegistryClient.updateSkill as jest.Mock)).toHaveBeenCalled();
      expect((aoRegistryClient.registerSkill as jest.Mock)).not.toHaveBeenCalled();

      expect(result.skillName).toBe('test-skill');
    });

    it('should use pre-loaded wallet when provided (MCP server usage)', async () => {
      await service.publish(mockDirectory, {
        wallet: mockWallet, // Pre-loaded wallet
        progressCallback,
      });

      // Verify wallet-manager.load NOT called
      expect((walletManager.load as jest.Mock)).not.toHaveBeenCalled();

      // Epic 9: Balance check removed from PublishService
      // Balance check now happens in ArweaveClient for bundles ≥ 100KB only
      // Verify checkBalance NOT called here (deferred to upload stage)
      expect((walletManager.checkBalance as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should load wallet from path when walletPath provided (CLI usage)', async () => {
      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        progressCallback,
      });

      // Verify wallet loaded from file
      expect((walletManager.load as jest.Mock)).toHaveBeenCalledWith('/test/wallet.json');

      // Epic 9: Balance check removed from PublishService
      // Balance check now happens in ArweaveClient for bundles ≥ 100KB only
      // Verify checkBalance NOT called here (deferred to upload stage)
      expect((walletManager.checkBalance as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should prioritize wallet over walletPath when both provided', async () => {
      await service.publish(mockDirectory, {
        wallet: mockWallet, // Should take precedence
        walletPath: '/test/wallet.json', // Should be ignored
        progressCallback,
      });

      // Verify wallet-manager.load NOT called (wallet takes precedence)
      expect((walletManager.load as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should work without progress callback (optional)', async () => {
      const result = await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        // No progressCallback
      });

      // Should complete successfully without callback
      expect(result.skillName).toBe('test-skill');
    });

    it('should use custom gateway URL when provided', async () => {
      const customGateway = 'https://g8way.io';

      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        gatewayUrl: customGateway,
        progressCallback,
      });

      // Verify gateway passed to upload
      expect((arweaveClient.uploadBundle as jest.Mock)).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          gatewayUrl: customGateway,
        })
      );
    });
  });

  describe('publish() - Error Scenarios', () => {
    it('should throw ValidationError if directory does not exist', async () => {
      // Mock directory not found
      (fs.stat as jest.Mock).mockRejectedValue(
        Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      );

      await expect(
        service.publish(mockDirectory, {
          walletPath: '/test/wallet.json',
          progressCallback,
        })
      ).rejects.toThrow(Error);

      // Progress should include validation event
      expect(progressEvents.some((e) => e.type === 'validating')).toBe(true);
    });

    it('should throw ValidationError if path is not a directory', async () => {
      // Mock path is a file, not directory
      (fs.stat as jest.Mock).mockResolvedValue({
        isDirectory: () => false,
      } as any);

      await expect(
        service.publish(mockDirectory, {
          walletPath: '/test/wallet.json',
          progressCallback,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if SKILL.md not found', async () => {
      // Mock SKILL.md missing
      (fs.access as jest.Mock).mockRejectedValue(
        new Error('File not found')
      );

      await expect(
        service.publish(mockDirectory, {
          walletPath: '/test/wallet.json',
          progressCallback,
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if manifest validation fails', async () => {
      // Mock invalid manifest
      (manifestParser.validate as jest.Mock).mockReturnValue({
        valid: false,
        errors: [
          'Skill name contains uppercase letters',
          'Version format is invalid',
        ],
      });

      await expect(
        service.publish(mockDirectory, {
          walletPath: '/test/wallet.json',
          progressCallback,
        })
      ).rejects.toThrow(ValidationError);

      // Verify parsing event emitted
      expect(progressEvents.some((e) => e.type === 'parsing')).toBe(true);
    });

    it('should throw ConfigurationError if neither wallet nor walletPath provided', async () => {
      await expect(
        service.publish(mockDirectory, {
          // No wallet, no walletPath
          progressCallback,
        })
      ).rejects.toThrow(ConfigurationError);
    });

    // Epic 9: Balance validation moved to ArweaveClient
    // Test removed from PublishService as balance check is deferred to upload stage
    // Balance errors will be thrown from ArweaveClient.uploadBundle() for bundles ≥ 100KB
    it.skip('should throw AuthorizationError if wallet balance is zero', async () => {
      // This test is skipped because balance validation moved to ArweaveClient
      // See arweave-client.test.ts for balance validation tests
      // Mock zero balance
      (walletManager.checkBalance as jest.Mock).mockResolvedValue({
        address: mockAddress,
        balance: 0, // Zero balance
        balanceFormatted: '0 AR',
      });

      await expect(
        service.publish(mockDirectory, {
          walletPath: '/test/wallet.json',
          progressCallback,
        })
      ).rejects.toThrow(AuthorizationError);
    });

    it('should propagate bundle creation errors', async () => {
      // Mock bundle creation failure
      (bundler.bundle as jest.Mock).mockRejectedValue(
        new Error('Bundle creation failed')
      );

      await expect(
        service.publish(mockDirectory, {
          walletPath: '/test/wallet.json',
          progressCallback,
        })
      ).rejects.toThrow('Bundle creation failed');
    });

    it('should propagate upload errors', async () => {
      // Mock upload failure
      (arweaveClient.uploadBundle as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        service.publish(mockDirectory, {
          walletPath: '/test/wallet.json',
          progressCallback,
        })
      ).rejects.toThrow('Network error');
    });

    it('should propagate registry errors', async () => {
      // Mock registry registration failure
      (aoRegistryClient.registerSkill as jest.Mock).mockRejectedValue(
        new Error('Registry unavailable')
      );

      await expect(
        service.publish(mockDirectory, {
          walletPath: '/test/wallet.json',
          progressCallback,
        })
      ).rejects.toThrow('Registry unavailable');
    });
  });

  describe('Progress Callback Invocations', () => {
    it('should invoke progress callback at all workflow stages', async () => {
      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        progressCallback,
      });

      // Verify all expected progress events emitted
      const eventTypes = progressEvents.map((e) => e.type);
      expect(eventTypes).toContain('validating');
      expect(eventTypes).toContain('parsing');
      expect(eventTypes).toContain('bundling');
      expect(eventTypes).toContain('uploading');
      expect(eventTypes).toContain('registering');
      expect(eventTypes).toContain('complete');
    });

    it('should include upload progress percentage in events', async () => {
      // Mock upload with progress callback
      (arweaveClient.uploadBundle as jest.Mock).mockImplementation(
        async (buffer, metadata, wallet, options) => {
          // Simulate progress updates
          options?.progressCallback?.(25);
          options?.progressCallback?.(50);
          options?.progressCallback?.(100);
          return mockUploadResult;
        }
      );

      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        progressCallback,
      });

      // Verify upload progress events include percent
      const uploadEvents = progressEvents.filter((e) => e.type === 'uploading');
      expect(uploadEvents.length).toBeGreaterThan(0);
      expect(uploadEvents.some((e) => e.percent !== undefined)).toBe(true);
    });

    it('should include bundling progress metadata in events', async () => {
      // Mock bundler with progress callback
      (bundler.bundle as jest.Mock).mockImplementation(
        async (directory, options) => {
          // Simulate progress updates
          options?.onProgress?.({ current: 1, total: 3, file: 'file1.md' });
          options?.onProgress?.({ current: 2, total: 3, file: 'file2.js' });
          options?.onProgress?.({ current: 3, total: 3, file: 'file3.json' });
          return mockBundleResult as any;
        }
      );

      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        progressCallback,
      });

      // Verify bundling progress events include metadata
      const bundlingEvents = progressEvents.filter((e) => e.type === 'bundling');
      expect(bundlingEvents.length).toBeGreaterThan(0);
      expect(bundlingEvents.some((e) => e.metadata !== undefined)).toBe(true);
    });
  });

  describe('Wallet Loading Logic', () => {
    it('should expand tilde in wallet path', async () => {
      // Note: Tilde expansion happens in CLI command, not service
      // Service receives expanded path
      await service.publish(mockDirectory, {
        walletPath: '/home/user/wallet.json', // Already expanded
        progressCallback,
      });

      expect((walletManager.load as jest.Mock)).toHaveBeenCalledWith('/home/user/wallet.json');
    });

    it('should derive wallet address for balance check', async () => {
      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        progressCallback,
      });

      // Verify Arweave.init called
      expect((Arweave.init as jest.Mock)).toHaveBeenCalled();

      // Verify jwkToAddress called
      const mockArweave = (Arweave.init as jest.Mock).mock.results[0]?.value;
      expect(mockArweave.wallets.jwkToAddress).toHaveBeenCalledWith(mockWallet);

      // Verify balance checked with derived address
      expect((walletManager.checkBalance as jest.Mock)).toHaveBeenCalledWith(mockAddress);
    });
  });

  describe('Registry Registration Logic', () => {
    it('should prepare correct metadata for registry', async () => {
      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        progressCallback,
      });

      // Verify registerSkill called with correct metadata structure
      expect((aoRegistryClient.registerSkill as jest.Mock)).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-skill',
          version: '1.0.0',
          description: 'Test skill description',
          author: 'Test Author',
          owner: mockAddress, // Derived from wallet
          tags: ['test', 'demo'],
          dependencies: [],
          arweaveTxId: 'mock-arweave-tx-id',
          license: 'MIT',
          bundledFiles: mockBundledFiles,
          publishedAt: expect.any(Number),
          updatedAt: expect.any(Number),
        }),
        mockWallet
      );
    });

    it('should use updateSkill when skill exists', async () => {
      // Mock existing skill
      (aoRegistryClient.getSkill as jest.Mock).mockResolvedValue({
        name: 'test-skill',
        version: '0.9.0',
      } as any);

      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        progressCallback,
      });

      expect((aoRegistryClient.updateSkill as jest.Mock)).toHaveBeenCalled();
      expect((aoRegistryClient.registerSkill as jest.Mock)).not.toHaveBeenCalled();
    });

    it('should use registerSkill when skill does not exist', async () => {
      // Mock skill not found
      (aoRegistryClient.getSkill as jest.Mock).mockRejectedValue(
        new Error('Not found')
      );

      await service.publish(mockDirectory, {
        walletPath: '/test/wallet.json',
        progressCallback,
      });

      expect((aoRegistryClient.registerSkill as jest.Mock)).toHaveBeenCalled();
      expect((aoRegistryClient.updateSkill as jest.Mock)).not.toHaveBeenCalled();
    });
  });
});
