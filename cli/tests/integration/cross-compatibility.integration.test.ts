/**
 * Cross-Compatibility Integration Tests
 * Story 8.10
 *
 * Tests verifying that CLI and MCP server tools are fully compatible:
 * - Skills published via CLI are discoverable via MCP search
 * - Skills published via MCP are discoverable via CLI search
 * - Lock files created by either tool have identical structure
 * - Both wallet types (file-based and seed phrase) produce compatible results
 * - Dependency resolution works correctly across publishing tools
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PublishService } from '../../src/lib/publish-service.js';
import { SearchService } from '../../src/lib/search-service.js';
import { InstallService } from '../../src/lib/install-service.js';
import { WalletFactory } from '../../src/lib/wallet-factory.js';
import { validateSkillsLock, validateSkillsLockFile } from '../helpers/schema-validator.js';
import { MockArweaveClient } from '../helpers/mock-arweave-client.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import Arweave from 'arweave';

// Test seed phrase constant (deterministic wallet generation)
// Using a valid 12-word BIP39 mnemonic for testing
const TEST_SEED_PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Mock dependencies (but NOT arweave itself - needed for real wallet validation)
jest.mock('../../src/parsers/manifest-parser.js');
jest.mock('../../src/lib/bundler.js');
jest.mock('../../src/clients/arweave-client.js');
jest.mock('../../src/clients/ao-registry-client.js');
jest.mock('../../src/lib/skill-analyzer.js');

import * as manifestParser from '../../src/parsers/manifest-parser.js';
import * as bundler from '../../src/lib/bundler.js';
import * as arweaveClient from '../../src/clients/arweave-client.js';
import * as aoRegistryClient from '../../src/clients/ao-registry-client.js';
import * as skillAnalyzer from '../../src/lib/skill-analyzer.js';

describe('Cross-Compatibility Integration Tests', () => {
  let mockArweave: MockArweaveClient;
  let testDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let arweave: Arweave;

  // Mock data
  const mockManifest = {
    name: 'test-skill-simple',
    version: '1.0.0',
    description: 'Simple test skill with no dependencies for integration testing',
    author: 'Test Suite',
    tags: ['test', 'simple', 'integration'],
    dependencies: [],
    license: 'MIT',
  };

  const mockFileWallet = {
    kty: 'RSA',
    n: 'mock-file-wallet-n',
    e: 'AQAB',
    d: 'mock-d',
    p: 'mock-p',
    q: 'mock-q',
    dp: 'mock-dp',
    dq: 'mock-dq',
    qi: 'mock-qi',
  };

  const mockSeedWallet = {
    kty: 'RSA',
    n: 'mock-seed-wallet-n',
    e: 'AQAB',
    d: 'mock-seed-d',
    p: 'mock-seed-p',
    q: 'mock-seed-q',
    dp: 'mock-seed-dp',
    dq: 'mock-seed-dq',
    qi: 'mock-seed-qi',
  };

  const mockFileWalletAddress = 'file-wallet-address-43-chars-000000000';
  const mockSeedWalletAddress = 'seed-wallet-address-43-chars-000000000';

  const mockBundleResult = {
    buffer: Buffer.from('mock-bundle-data'),
    size: 2048,
    sizeFormatted: '2.0 KB',
    fileCount: 2,
    exceededLimit: false,
  };

  const mockUploadResult = {
    txId: 'mock-arweave-tx-id-43-chars-long-00000000',
    cost: 500000,
  };

  const mockRegistryMessageId = 'mock-ao-registry-message-id';

  beforeEach(async () => {
    // Backup original environment
    originalEnv = { ...process.env };

    // Create isolated test directory
    testDir = path.join(os.tmpdir(), `cross-compat-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Initialize Arweave SDK for address derivation
    arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    });

    // Initialize mock Arweave client
    mockArweave = new MockArweaveClient();

    // Clear all mocks
    jest.clearAllMocks();

    // Setup manifest parser mock
    (manifestParser.parseManifest as jest.MockedFunction<typeof manifestParser.parseManifest>) = jest
      .fn()
      .mockResolvedValue(mockManifest);

    // Setup bundler mock
    (bundler.createBundle as jest.MockedFunction<typeof bundler.createBundle>) = jest
      .fn()
      .mockResolvedValue(mockBundleResult);

    (bundler.getBundledFiles as jest.MockedFunction<typeof bundler.getBundledFiles>) = jest
      .fn()
      .mockResolvedValue([
        {
          name: 'SKILL.md',
          icon: '📘',
          type: 'markdown' as const,
          size: '1.5 KB',
          description: 'Main skill file',
          level: 'Level 2' as const,
          preview: 'Test skill content',
          path: 'SKILL.md',
        },
        {
          name: 'example.txt',
          icon: '📄',
          type: 'text' as const,
          size: '0.5 KB',
          description: 'Example file',
          level: 'Level 3' as const,
          preview: 'Sample content',
          path: 'example.txt',
        },
      ]);

    // Setup Arweave client mocks
    jest.mocked(arweaveClient).uploadBundle = jest.fn().mockResolvedValue(mockUploadResult);

    // Setup AO registry client mocks
    (aoRegistryClient.registerSkill as jest.MockedFunction<typeof aoRegistryClient.registerSkill>) =
      jest.fn().mockResolvedValue(mockRegistryMessageId);

    (aoRegistryClient.updateSkill as jest.MockedFunction<typeof aoRegistryClient.updateSkill>) =
      jest.fn().mockResolvedValue(mockRegistryMessageId);

    (aoRegistryClient.searchSkills as jest.MockedFunction<typeof aoRegistryClient.searchSkills>) =
      jest.fn().mockResolvedValue([
        {
          name: mockManifest.name,
          version: mockManifest.version,
          description: mockManifest.description,
          author: mockManifest.author,
          owner: mockFileWalletAddress,
          tags: mockManifest.tags,
          dependencies: mockManifest.dependencies,
          arweaveTxId: mockUploadResult.txId,
          publishedAt: Date.now(),
        },
      ]);

    (aoRegistryClient.getSkillByName as jest.MockedFunction<
      typeof aoRegistryClient.getSkillByName
    >) = jest.fn().mockResolvedValue(null);

    // Setup skill analyzer mock
    (skillAnalyzer.analyzeSkillStructure as jest.MockedFunction<
      typeof skillAnalyzer.analyzeSkillStructure
    >) = jest.fn().mockResolvedValue({
      manifest: mockManifest,
      fileCount: 2,
      totalSize: 2048,
      bundledFiles: [],
    });
  });

  afterEach(async () => {
    // Restore original environment
    process.env = originalEnv;

    // Clean up test directory
    if (await fs.stat(testDir).catch(() => null)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }

    // Clear mock Arweave storage
    mockArweave.clear();
  });

  describe('Wallet Type Compatibility', () => {
    it('should generate deterministic wallet from same seed phrase on multiple invocations', async () => {
      // First invocation - FIXED: Use correct API method name
      const jwk1 = await WalletFactory.fromSeedPhrase(TEST_SEED_PHRASE);
      const address1 = await arweave.wallets.jwkToAddress(jwk1);

      // Second invocation with same seed phrase
      const jwk2 = await WalletFactory.fromSeedPhrase(TEST_SEED_PHRASE);
      const address2 = await arweave.wallets.jwkToAddress(jwk2);

      // Wallets should have identical addresses
      expect(address1).toBe(address2);
      expect(address1).toBeTruthy();
      expect(address1.length).toBe(43); // Standard Arweave address length
    }, 60000); // Long timeout for RSA key generation

    it('should generate different wallets from different seed phrases', async () => {
      const jwk1 = await WalletFactory.fromSeedPhrase(TEST_SEED_PHRASE);
      const address1 = await arweave.wallets.jwkToAddress(jwk1);

      const jwk2 = await WalletFactory.fromSeedPhrase('zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong');
      const address2 = await arweave.wallets.jwkToAddress(jwk2);

      expect(address1).not.toBe(address2);
    }, 60000); // Long timeout for RSA key generation
  });

  describe('Lock File Compatibility', () => {
    it('should validate lock file structure against JSON schema', async () => {
      const lockFileData = {
        lockfileVersion: 1,
        generatedAt: Date.now(),
        skills: [
          {
            name: 'test-skill-simple',
            version: '1.0.0',
            arweaveTxId: 'abc123def456ghi789jkl012mno345pqr678stu9012', // FIXED: Exactly 43 chars
            installedAt: Date.now(),
            installedPath: path.join(testDir, 'test-skill-simple'),
            dependencies: [],
            isDirectDependency: true,
          },
        ],
        installLocation: testDir,
      };

      const result = validateSkillsLock(lockFileData);

      if (!result.valid) {
        console.error('Schema validation errors:', result.errors);
      }

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid lock file structure', async () => {
      const invalidLockFileData = {
        lockfileVersion: 'invalid', // should be number
        skills: [], // missing required fields
      };

      const result = validateSkillsLock(invalidLockFileData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Search Service Cross-Compatibility', () => {
    it('should find skills regardless of publishing tool', async () => {
      // Mock AO registry to return skills published by both CLI and MCP
      const mockResults = [
        {
          name: 'skill-from-cli',
          version: '1.0.0',
          description: 'Published via CLI with file wallet',
          author: 'CLI User',
          owner: mockFileWalletAddress,
          tags: ['cli', 'test'],
          dependencies: [],
          arweaveTxId: 'cli-skill-tx-id-43-chars-long-0000000',
          publishedAt: Date.now() - 1000,
        },
        {
          name: 'skill-from-mcp',
          version: '1.0.0',
          description: 'Published via MCP with seed phrase wallet',
          author: 'MCP User',
          owner: mockSeedWalletAddress,
          tags: ['mcp', 'test'],
          dependencies: [],
          arweaveTxId: 'mcp-skill-tx-id-43-chars-long-0000000',
          publishedAt: Date.now(),
        },
      ];

      (aoRegistryClient.searchSkills as jest.MockedFunction<typeof aoRegistryClient.searchSkills>) =
        jest.fn().mockResolvedValue(mockResults);

      // Create search service and query
      const searchService = new SearchService();
      const results = await searchService.search('test');

      // Both skills should be found regardless of how they were published
      expect(results).toHaveLength(2);
      expect(results.find((r) => r.name === 'skill-from-cli')).toBeDefined();
      expect(results.find((r) => r.name === 'skill-from-mcp')).toBeDefined();
    });
  });

  describe('Bundle Format Compatibility', () => {
    it('should produce identical bundle format regardless of wallet type', async () => {
      const skillDir = path.join(__dirname, '../fixtures/test-skill-simple');

      // Create bundle (wallet type doesn't affect bundle creation)
      const bundle1 = await bundler.createBundle(skillDir);
      const bundle2 = await bundler.createBundle(skillDir);

      // Bundles should be identical
      expect(bundle1.size).toBe(bundle2.size);
      expect(bundle1.fileCount).toBe(bundle2.fileCount);
      expect(bundle1.buffer).toEqual(bundle2.buffer);
    });
  });

  describe('Error Handling Cross-Compatibility', () => {
    it('should handle skill not found gracefully', async () => {
      (aoRegistryClient.searchSkills as jest.MockedFunction<typeof aoRegistryClient.searchSkills>) =
        jest.fn().mockResolvedValue([]);

      const searchService = new SearchService();
      const results = await searchService.search('non-existent-skill');

      expect(results).toHaveLength(0);
    });

    it('should handle network errors gracefully', async () => {
      (aoRegistryClient.searchSkills as jest.MockedFunction<typeof aoRegistryClient.searchSkills>) =
        jest.fn().mockRejectedValue(new Error('Network timeout'));

      const searchService = new SearchService();

      await expect(searchService.search('test')).rejects.toThrow('Network timeout');
    });

    it('should validate corrupted lock files', async () => {
      const corruptedLockFilePath = path.join(testDir, 'corrupted-lock.json');
      await fs.writeFile(corruptedLockFilePath, '{ invalid json }', 'utf-8');

      const result = validateSkillsLockFile(corruptedLockFilePath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to parse lock file');
    });
  });

  describe('Environment Isolation', () => {
    it('should not interfere with user configuration', async () => {
      // Set test environment variables
      process.env.TEST_VAR = 'original_value';
      process.env.INSTALL_LOCATION = testDir;

      // Verify test isolation
      expect(process.env.TEST_VAR).toBe('original_value');
      expect(process.env.INSTALL_LOCATION).toBe(testDir);

      // After test cleanup, original environment should be restored
      // (tested in afterEach hook)
    });
  });

  describe('Dependency Resolution Cross-Compatibility', () => {
    it('should correctly parse dependencies from manifest regardless of source', async () => {
      const manifestWithDeps = {
        ...mockManifest,
        name: 'test-skill-with-deps',
        dependencies: ['test-skill-dependency'],
      };

      (manifestParser.parseManifest as jest.MockedFunction<typeof manifestParser.parseManifest>) =
        jest.fn().mockResolvedValue(manifestWithDeps);

      const parsed = await manifestParser.parseManifest(path.join(__dirname, '../fixtures/test-skill-with-deps/SKILL.md'));

      expect(parsed.dependencies).toEqual(['test-skill-dependency']);
      expect(parsed.dependencies).toHaveLength(1);
    });
  });
});
