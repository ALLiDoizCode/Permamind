/**
 * Unit tests for AO Registry Client
 *
 * Tests message passing, query operations, error handling, and retry logic
 * for interactions with the AO Registry Process.
 */

import * as aoRegistryClient from '../../../src/clients/ao-registry-client';
import { ISkillMetadata } from '../../../src/types/ao-registry';
import { NetworkError, ConfigurationError } from '../../../src/types/errors';

// Mock @permaweb/aoconnect
jest.mock('@permaweb/aoconnect', () => {
  const mockMessage = jest.fn();
  const mockDryrun = jest.fn();
  const mockResult = jest.fn();
  return {
    __esModule: true,
    connect: jest.fn(() => ({
      message: mockMessage,
      dryrun: mockDryrun,
      result: mockResult,
    })),
    message: mockMessage,
    dryrun: mockDryrun,
    result: mockResult,
    createDataItemSigner: jest.fn((wallet) => ({ wallet })),
  };
});

// Mock registry-config
jest.mock('../../../src/lib/registry-config', () => ({
  getRegistryProcessId: jest.fn(() => 'test-process-id'),
  getMuUrl: jest.fn(() => 'https://mu.ao-testnet.xyz'),
  getCuUrl: jest.fn(() => 'https://cu.ao-testnet.xyz'),
  getGateway: jest.fn(() => 'https://arweave.net'),
  getHyperBeamNode: jest.fn(() => 'https://hyperbeam.arweave.net'),
}));

// Mock config-loader
jest.mock('../../../src/lib/config-loader', () => ({
  loadConfig: jest.fn(),
}));

// Mock logger
jest.mock('../../../src/utils/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    setLevel: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
    ...mockLogger,
  };
});

import { message, dryrun, createDataItemSigner } from '@permaweb/aoconnect';
import { loadConfig } from '../../../src/lib/config-loader';

// Setup mocks after import
(message as jest.Mock) = jest.fn();
(dryrun as jest.Mock) = jest.fn();
(createDataItemSigner as jest.Mock) = jest.fn((wallet) => ({ wallet }));

describe('AO Registry Client', () => {
  const mockWallet = {
    kty: 'RSA',
    n: 'mock_n_value',
    e: 'AQAB',
  };

  const mockProcessId = 'abc123def456ghi789jkl012mno345pqr678stu901';
  const mockMessageId = 'msg123abc456def789ghi012jkl345mno678pqr901';

  beforeEach(() => {
    jest.clearAllMocks();

    // Clear AO registry cache to prevent test interference
    aoRegistryClient.clearCache();

    // Setup environment variable for registry process ID
    process.env.AO_REGISTRY_PROCESS_ID = mockProcessId;

    // Mock loadConfig to return empty config (will use env var)
    (loadConfig as jest.Mock).mockResolvedValue({});

    // Setup createDataItemSigner mock
    (createDataItemSigner as jest.Mock).mockImplementation((wallet) => ({ wallet }));
  });

  afterEach(() => {
    delete process.env.AO_REGISTRY_PROCESS_ID;
  });

  describe('registerSkill()', () => {
    it('should send message with Register-Skill action', async () => {
      (message as jest.Mock).mockResolvedValue(mockMessageId);

      const metadata: ISkillMetadata = {
        name: 'ao-basics',
        version: '1.0.0',
        description: 'AO fundamentals',
        author: 'Skills Team',
        owner: 'owner123...address789',
        tags: ['ao', 'tutorial'],
        dependencies: [],
        arweaveTxId: 'tx123...tx789',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await aoRegistryClient.registerSkill(metadata, mockWallet as any);

      expect(result).toBe(mockMessageId);
      expect(message).toHaveBeenCalledWith({
        process: mockProcessId,
        tags: expect.arrayContaining([
          { name: 'Action', value: 'Register-Skill' },
        ]),
        signer: expect.any(Object),
      });
    });

    it('should include all required tags (Name, Version, Description, Author, Tags, ArweaveTxId, Dependencies)', async () => {
      (message as jest.Mock).mockResolvedValue(mockMessageId);

      const metadata: ISkillMetadata = {
        name: 'test-skill',
        version: '2.0.0',
        description: 'Test skill description',
        author: 'Test Author',
        owner: 'owner_address',
        tags: ['test', 'example'],
        dependencies: ['dep1', 'dep2'],
        arweaveTxId: 'arweave_tx_id',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      await aoRegistryClient.registerSkill(metadata, mockWallet as any);

      expect(message).toHaveBeenCalledWith({
        process: mockProcessId,
        tags: [
          { name: 'Action', value: 'Register-Skill' },
          { name: 'Name', value: 'test-skill' },
          { name: 'Version', value: '2.0.0' },
          { name: 'Description', value: 'Test skill description' },
          { name: 'Author', value: 'Test Author' },
          { name: 'Tags', value: JSON.stringify(['test', 'example']) },
          { name: 'ArweaveTxId', value: 'arweave_tx_id' },
          { name: 'Dependencies', value: JSON.stringify(['dep1', 'dep2']) },
        ],
        signer: expect.any(Object),
      });
    });

    it('should stringify Tags array as JSON', async () => {
      (message as jest.Mock).mockResolvedValue(mockMessageId);

      const metadata: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test',
        author: 'Author',
        owner: 'owner',
        tags: ['tag1', 'tag2', 'tag3'],
        dependencies: [],
        arweaveTxId: 'txid',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      await aoRegistryClient.registerSkill(metadata, mockWallet as any);

      const call = (message as jest.Mock).mock.calls[0][0];
      const tagsTag = call.tags.find((t: any) => t.name === 'Tags');
      expect(tagsTag.value).toBe(JSON.stringify(['tag1', 'tag2', 'tag3']));
      expect(JSON.parse(tagsTag.value)).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should stringify Dependencies array as JSON', async () => {
      (message as jest.Mock).mockResolvedValue(mockMessageId);

      const metadata: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test',
        author: 'Author',
        owner: 'owner',
        tags: [],
        dependencies: ['dep-a', 'dep-b'],
        arweaveTxId: 'txid',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      await aoRegistryClient.registerSkill(metadata, mockWallet as any);

      const call = (message as jest.Mock).mock.calls[0][0];
      const depsTag = call.tags.find((t: any) => t.name === 'Dependencies');
      expect(depsTag.value).toBe(JSON.stringify(['dep-a', 'dep-b']));
      expect(JSON.parse(depsTag.value)).toEqual(['dep-a', 'dep-b']);
    });

    it('should return message ID on success', async () => {
      (message as jest.Mock).mockResolvedValue(mockMessageId);

      const metadata: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test',
        author: 'Author',
        owner: 'owner',
        tags: [],
        dependencies: [],
        arweaveTxId: 'txid',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await aoRegistryClient.registerSkill(metadata, mockWallet as any);
      expect(result).toBe(mockMessageId);
    });

    it('should throw NetworkError if message sending fails', async () => {
      (message as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      const metadata: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test',
        author: 'Author',
        owner: 'owner',
        tags: [],
        dependencies: [],
        arweaveTxId: 'txid',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      await expect(
        aoRegistryClient.registerSkill(metadata, mockWallet as any)
      ).rejects.toThrow(NetworkError);
    });

    it('should throw ConfigurationError if registry process ID not configured', async () => {
      delete process.env.AO_REGISTRY_PROCESS_ID;
      (loadConfig as jest.Mock).mockResolvedValue({});

      const metadata: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test',
        author: 'Author',
        owner: 'owner',
        tags: [],
        dependencies: [],
        arweaveTxId: 'txid',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      await expect(
        aoRegistryClient.registerSkill(metadata, mockWallet as any)
      ).rejects.toThrow(ConfigurationError);
    });
  });

  describe('searchSkills()', () => {
    it('should send dryrun with Search-Skills action', async () => {
      (dryrun as jest.Mock).mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify([]),
          },
        ],
      });

      await aoRegistryClient.searchSkills('ao tutorial');

      expect(dryrun).toHaveBeenCalledWith({
        process: mockProcessId,
        tags: [
          { name: 'Action', value: 'Search-Skills' },
          { name: 'Query', value: 'ao tutorial' },
        ],
      });
    });

    it('should parse JSON response and return array of ISkillMetadata', async () => {
      const mockSkills: ISkillMetadata[] = [
        {
          name: 'ao-basics',
          version: '1.0.0',
          description: 'AO fundamentals',
          author: 'Skills Team',
          owner: 'owner123',
          tags: ['ao'],
          dependencies: [],
          arweaveTxId: 'tx123',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (dryrun as jest.Mock).mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(mockSkills),
          },
        ],
      });

      const result = await aoRegistryClient.searchSkills('ao');
      expect(result).toEqual(mockSkills);
    });

    it('should return empty array if no results found', async () => {
      (dryrun as jest.Mock).mockResolvedValue({
        Messages: [],
      });

      const result = await aoRegistryClient.searchSkills('nonexistent');
      expect(result).toEqual([]);
    });

    it('should retry dryrun queries on failure (2 attempts, 5s delay)', async () => {
      (dryrun as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          Messages: [{ Data: JSON.stringify([]) }],
        });

      const result = await aoRegistryClient.searchSkills('ao');

      expect(result).toEqual([]);
      expect(dryrun).toHaveBeenCalledTimes(2);
    });

    it('should throw NetworkError if all retry attempts fail', async () => {
      (dryrun as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(aoRegistryClient.searchSkills('ao')).rejects.toThrow(NetworkError);
      expect(dryrun).toHaveBeenCalledTimes(2);
    });

    it('should timeout after 30 seconds and throw NetworkError', async () => {
      // Mock dryrun to never resolve (simulate timeout)
      (dryrun as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const startTime = Date.now();
      await expect(aoRegistryClient.searchSkills('ao')).rejects.toThrow(NetworkError);
      const duration = Date.now() - startTime;

      // Should timeout around 30s (fast-fail on timeout, no retry)
      expect(duration).toBeGreaterThanOrEqual(29000);
      expect(duration).toBeLessThan(32000);
    }, 35000);
  });

  describe('getSkill()', () => {
    it('should send dryrun with Get-Skill action', async () => {
      (dryrun as jest.Mock).mockResolvedValue({
        Messages: [
          {
            Data: JSON.stringify(null),
          },
        ],
      });

      await aoRegistryClient.getSkill('ao-basics');

      expect(dryrun).toHaveBeenCalledWith({
        process: mockProcessId,
        tags: [
          { name: 'Action', value: 'Get-Skill' },
          { name: 'Name', value: 'ao-basics' },
        ],
      });
    });

    it('should return ISkillMetadata if skill found', async () => {
      const mockSkill: ISkillMetadata = {
        name: 'ao-basics',
        version: '1.0.0',
        description: 'AO fundamentals',
        author: 'Skills Team',
        owner: 'owner123',
        tags: ['ao'],
        dependencies: [],
        arweaveTxId: 'tx123',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      (dryrun as jest.Mock).mockResolvedValue({
        Messages: [{ Data: JSON.stringify(mockSkill) }],
      });

      const result = await aoRegistryClient.getSkill('ao-basics');
      expect(result).toEqual(mockSkill);
    });

    it('should return null if skill not found', async () => {
      (dryrun as jest.Mock).mockResolvedValue({
        Messages: [],
      });

      const result = await aoRegistryClient.getSkill('nonexistent');
      expect(result).toBeNull();
    });

    it('should retry on failure', async () => {
      const mockSkill: ISkillMetadata = {
        name: 'ao-basics',
        version: '1.0.0',
        description: 'AO fundamentals',
        author: 'Skills Team',
        owner: 'owner123',
        tags: ['ao'],
        dependencies: [],
        arweaveTxId: 'tx123',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      (dryrun as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          Messages: [{ Data: JSON.stringify(mockSkill) }],
        });

      const result = await aoRegistryClient.getSkill('ao-basics');

      expect(result).toEqual(mockSkill);
      expect(dryrun).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRegistryInfo()', () => {
    it('should send dryrun with Info action', async () => {
      const mockInfo = {
        process: {
          name: 'Agent Skills Registry',
          version: '1.0.0',
          adpVersion: '1.0',
          capabilities: ['register', 'search', 'get'],
          messageSchemas: {},
        },
        handlers: ['Register-Skill', 'Search-Skills', 'Get-Skill', 'Info'],
        documentation: {
          adpCompliance: 'v1.0',
          selfDocumenting: true,
        },
      };

      (dryrun as jest.Mock).mockResolvedValue({
        Messages: [{ Data: JSON.stringify(mockInfo) }],
      });

      await aoRegistryClient.getRegistryInfo();

      expect(dryrun).toHaveBeenCalledWith({
        process: mockProcessId,
        tags: [{ name: 'Action', value: 'Info' }],
      });
    });

    it('should parse ADP-compliant response', async () => {
      const mockInfo = {
        process: {
          name: 'Agent Skills Registry',
          version: '1.0.0',
          adpVersion: '1.0',
          capabilities: ['register', 'search'],
          messageSchemas: {},
        },
        handlers: ['Info'],
        documentation: {
          adpCompliance: 'v1.0',
          selfDocumenting: true,
        },
      };

      (dryrun as jest.Mock).mockResolvedValue({
        Messages: [{ Data: JSON.stringify(mockInfo) }],
      });

      const result = await aoRegistryClient.getRegistryInfo();
      expect(result).toEqual(mockInfo);
      expect(result.process.adpVersion).toBe('1.0');
    });

    it('should retry on failure', async () => {
      const mockInfo = {
        process: {
          name: 'Test',
          version: '1.0.0',
          adpVersion: '1.0',
          capabilities: [],
          messageSchemas: {},
        },
        handlers: [],
        documentation: {
          adpCompliance: 'v1.0',
          selfDocumenting: true,
        },
      };

      (dryrun as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          Messages: [{ Data: JSON.stringify(mockInfo) }],
        });

      const result = await aoRegistryClient.getRegistryInfo();

      expect(result).toEqual(mockInfo);
      expect(dryrun).toHaveBeenCalledTimes(2);
    });
  });
});
