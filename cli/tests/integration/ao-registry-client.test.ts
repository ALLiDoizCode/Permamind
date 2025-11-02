/**
 * Integration tests for AO Registry Client
 *
 * Tests client behavior with realistic AO process message structures
 * using fixture data that matches actual AO process responses.
 *
 * These tests validate:
 * - Correct message structure parsing from AO process format
 * - Handling of realistic error scenarios
 * - Integration with @permaweb/aoconnect SDK
 */

import * as aoRegistryClient from '../../src/clients/ao-registry-client';
import { ISkillMetadata, IAODryrunResult } from '../../src/types/ao-registry';
import { NetworkError, ConfigurationError } from '../../src/types/errors';

// Mock @permaweb/aoconnect with realistic message structures
jest.mock('@permaweb/aoconnect', () => ({
  __esModule: true,
  connect: jest.fn(() => ({
    message: jest.fn(),
    dryrun: jest.fn(),
    result: jest.fn(),
  })),
  message: jest.fn(),
  dryrun: jest.fn(),
  result: jest.fn(),
  createDataItemSigner: jest.fn((wallet) => ({ wallet })),
}));

// Mock registry-config
jest.mock('../../src/lib/registry-config', () => ({
  getRegistryProcessId: jest.fn(() => 'test-process-id'),
  getMuUrl: jest.fn(() => 'https://mu.ao-testnet.xyz'),
  getCuUrl: jest.fn(() => 'https://cu.ao-testnet.xyz'),
  getGateway: jest.fn(() => 'https://arweave.net'),
  getHyperBeamNode: jest.fn(() => 'https://hyperbeam.arweave.net'),
}));

// Mock config-loader
jest.mock('../../src/lib/config-loader', () => ({
  loadConfig: jest.fn(),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => {
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

import { dryrun, message, createDataItemSigner } from '@permaweb/aoconnect';
import { loadConfig } from '../../src/lib/config-loader';

describe('AO Registry Client Integration Tests', () => {
  const mockProcessId = 'abc123def456ghi789jkl012mno345pqr678stu901';
  const mockWallet = {
    kty: 'RSA',
    n: 'mock_n_value',
    e: 'AQAB',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AO_REGISTRY_PROCESS_ID = mockProcessId;
    (loadConfig as jest.Mock).mockResolvedValue({});
    (createDataItemSigner as jest.Mock).mockImplementation((wallet) => ({ wallet }));
  });

  afterEach(() => {
    delete process.env.AO_REGISTRY_PROCESS_ID;
  });

  describe('searchSkills() with realistic AO message structures', () => {
    it('should parse multi-skill AO response message format', async () => {
      // Realistic AO process response structure with multiple skills
      const aoResponse: IAODryrunResult = {
        Messages: [
          {
            Data: JSON.stringify([
              {
                name: 'ao-basics',
                version: '1.0.0',
                description: 'Fundamental AO concepts and patterns',
                author: 'AO Skills Team',
                owner: 'owner_addr_43_chars_aaaaaaaaaaaaaaaaaaaa',
                tags: ['ao', 'tutorial', 'fundamentals'],
                dependencies: [],
                arweaveTxId: 'arweave_txid_43_chars_bbbbbbbbbbbbbbbbbbb',
                publishedAt: 1704067200000,
                updatedAt: 1704067200000,
              },
              {
                name: 'arweave-fundamentals',
                version: '2.1.0',
                description: 'Permanent data storage on Arweave',
                author: 'Arweave Team',
                owner: 'owner_addr_43_chars_ccccccccccccccccccc',
                tags: ['arweave', 'storage', 'permanent'],
                dependencies: [],
                arweaveTxId: 'arweave_txid_43_chars_ddddddddddddddddddd',
                license: 'MIT',
                publishedAt: 1704070800000,
                updatedAt: 1704074400000,
              },
            ]),
            Tags: [
              { name: 'Action', value: 'Search-Skills-Response' },
              { name: 'ResultCount', value: '2' },
            ],
          },
        ],
      };

      (dryrun as jest.Mock).mockResolvedValue(aoResponse);

      const results = await aoRegistryClient.searchSkills('arweave');

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('ao-basics');
      expect(results[1].name).toBe('arweave-fundamentals');
      expect(results[1].license).toBe('MIT');
    });

    it('should handle empty results from AO process', async () => {
      const aoResponse: IAODryrunResult = {
        Messages: [
          {
            Data: JSON.stringify([]),
            Tags: [
              { name: 'Action', value: 'Search-Skills-Response' },
              { name: 'ResultCount', value: '0' },
            ],
          },
        ],
      };

      (dryrun as jest.Mock).mockResolvedValue(aoResponse);

      const results = await aoRegistryClient.searchSkills('nonexistent-query');

      expect(results).toEqual([]);
    });

    it('should handle AO process returning no messages', async () => {
      const aoResponse: IAODryrunResult = {
        Messages: [],
      };

      (dryrun as jest.Mock).mockResolvedValue(aoResponse);

      const results = await aoRegistryClient.searchSkills('empty-process');

      expect(results).toEqual([]);
    });
  });

  describe('getSkill() with realistic AO message structures', () => {
    it('should parse single skill AO response with all optional fields', async () => {
      const skill: ISkillMetadata = {
        name: 'permamind-integration',
        version: '3.2.1',
        description: 'Integration guide for Permamind MCP server',
        author: 'Permamind Contributors',
        owner: 'owner_addr_43_chars_eeeeeeeeeeeeeeeeeee',
        tags: ['mcp', 'permamind', 'integration', 'arweave'],
        dependencies: ['ao-basics', 'arweave-fundamentals'],
        arweaveTxId: 'arweave_txid_43_chars_fffffffffffffffffff',
        license: 'Apache-2.0',
        publishedAt: 1704081600000,
        updatedAt: 1704085200000,
      };

      const aoResponse: IAODryrunResult = {
        Messages: [
          {
            Data: JSON.stringify(skill),
            Tags: [
              { name: 'Action', value: 'Get-Skill-Response' },
              { name: 'SkillName', value: 'permamind-integration' },
            ],
          },
        ],
      };

      (dryrun as jest.Mock).mockResolvedValue(aoResponse);

      const result = await aoRegistryClient.getSkill('permamind-integration');

      expect(result).toEqual(skill);
      expect(result?.dependencies).toEqual(['ao-basics', 'arweave-fundamentals']);
      expect(result?.license).toBe('Apache-2.0');
    });

    it('should return null when AO process finds no skill', async () => {
      const aoResponse: IAODryrunResult = {
        Messages: [],
      };

      (dryrun as jest.Mock).mockResolvedValue(aoResponse);

      const result = await aoRegistryClient.getSkill('nonexistent-skill');

      expect(result).toBeNull();
    });
  });

  describe('getRegistryInfo() with ADP v1.0 compliant response', () => {
    it('should parse complete ADP-compliant registry metadata', async () => {
      const registryInfo = {
        process: {
          name: 'Agent Skills Registry',
          version: '1.0.0',
          adpVersion: '1.0',
          capabilities: ['register', 'search', 'get', 'info'],
          messageSchemas: {
            'Register-Skill': {
              required: ['Name', 'Version', 'Description', 'Author', 'Tags', 'ArweaveTxId'],
              optional: ['Dependencies', 'License'],
            },
            'Search-Skills': {
              required: ['Query'],
            },
            'Get-Skill': {
              required: ['Name'],
            },
          },
        },
        handlers: ['Register-Skill', 'Search-Skills', 'Get-Skill', 'Info'],
        documentation: {
          adpCompliance: 'v1.0',
          selfDocumenting: true,
        },
      };

      const aoResponse: IAODryrunResult = {
        Messages: [
          {
            Data: JSON.stringify(registryInfo),
            Tags: [
              { name: 'Action', value: 'Info-Response' },
              { name: 'ADP-Version', value: '1.0' },
            ],
          },
        ],
      };

      (dryrun as jest.Mock).mockResolvedValue(aoResponse);

      const result = await aoRegistryClient.getRegistryInfo();

      expect(result.process.adpVersion).toBe('1.0');
      expect(result.handlers).toContain('Register-Skill');
      expect(result.process.capabilities).toEqual(['register', 'search', 'get', 'info']);
      expect(result.documentation.selfDocumenting).toBe(true);
    });
  });

  describe('Error handling with realistic AO failure scenarios', () => {
    it('should handle AO network timeout gracefully', async () => {
      (dryrun as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves (timeout scenario)
      );

      await expect(aoRegistryClient.searchSkills('timeout-test')).rejects.toThrow(NetworkError);
    }, 35000);

    it('should handle malformed JSON in AO response Data field', async () => {
      const aoResponse: IAODryrunResult = {
        Messages: [
          {
            Data: 'invalid-json-{{{',
            Tags: [{ name: 'Action', value: 'Search-Skills-Response' }],
          },
        ],
      };

      (dryrun as jest.Mock).mockResolvedValue(aoResponse);

      await expect(aoRegistryClient.searchSkills('malformed-test')).rejects.toThrow();
    });

    it('should throw ConfigurationError when registry process ID missing', async () => {
      delete process.env.AO_REGISTRY_PROCESS_ID;
      (loadConfig as jest.Mock).mockResolvedValue({});

      await expect(aoRegistryClient.searchSkills('test')).rejects.toThrow(ConfigurationError);
    });
  });

  describe('registerSkill() with realistic message sending', () => {
    it('should send properly formatted message to AO process', async () => {
      const messageId = 'msg_id_43_chars_ggggggggggggggggggggggg';
      (message as jest.Mock).mockResolvedValue(messageId);

      const metadata: ISkillMetadata = {
        name: 'test-skill',
        version: '1.0.0',
        description: 'Test skill for integration validation',
        author: 'Test Author',
        owner: 'owner_addr_43_chars_hhhhhhhhhhhhhhhhhhh',
        tags: ['test', 'integration'],
        dependencies: [],
        arweaveTxId: 'arweave_txid_43_chars_iiiiiiiiiiiiiiiii',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = await aoRegistryClient.registerSkill(metadata, mockWallet as any);

      expect(result).toBe(messageId);
      expect(message).toHaveBeenCalledWith({
        process: mockProcessId,
        tags: expect.arrayContaining([
          { name: 'Action', value: 'Register-Skill' },
          { name: 'Name', value: 'test-skill' },
          { name: 'Version', value: '1.0.0' },
        ]),
        signer: expect.any(Object),
      });
    });
  });
});
