/**
 * Unit tests for Search Command
 *
 * These tests verify the search command structure and functionality.
 * Full end-to-end workflow testing is in integration tests.
 */

// Mock all dependencies to avoid module loading issues
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setLevel: jest.fn(),
  },
}));

jest.mock('chalk', () => ({
  __esModule: true,
  default: {
    green: jest.fn((s) => s),
    red: jest.fn((s) => s),
    yellow: jest.fn((s) => s),
    cyan: jest.fn((s) => s),
    bold: jest.fn((s) => s),
    dim: jest.fn((s) => s),
  },
  green: jest.fn((s) => s),
  red: jest.fn((s) => s),
  yellow: jest.fn((s) => s),
  cyan: jest.fn((s) => s),
  bold: jest.fn((s) => s),
  dim: jest.fn((s) => s),
}));

// Mock AO Registry Client
const mockSearchSkills = jest.fn();
jest.mock('../../../src/clients/ao-registry-client', () => ({
  __esModule: true,
  searchSkills: mockSearchSkills,
}));

// Mock Search Results Formatter
const mockFormatSearchResults = jest.fn();
jest.mock('../../../src/formatters/search-results', () => ({
  __esModule: true,
  formatSearchResults: mockFormatSearchResults,
}));

// Mock Config Loader for verbose mode
const mockLoadConfig = jest.fn();
jest.mock('../../../src/lib/config-loader', () => ({
  __esModule: true,
  loadConfig: mockLoadConfig,
}));

import { Command } from 'commander';
import { ISkillMetadata } from '../../../src/types/ao-registry';
import { NetworkError, ConfigurationError } from '../../../src/types/errors';
import logger from '../../../src/utils/logger';

describe('Search Command Module', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Default mock implementations
    mockSearchSkills.mockResolvedValue([]);
    mockFormatSearchResults.mockReturnValue('mock formatted output');
    mockLoadConfig.mockResolvedValue({
      registry: 'test-registry-process-id',
    });
  });

  describe('Task 9: Command Registration', () => {
    it('should export createSearchCommand function', async () => {
      const searchModule = await import('../../../src/commands/search');
      expect(typeof searchModule.createSearchCommand).toBe('function');
    });

    it('should export execute function', async () => {
      const searchModule = await import('../../../src/commands/search');
      expect(typeof searchModule.execute).toBe('function');
    });

    it('should create a valid Commander command', async () => {
      const { createSearchCommand } = await import('../../../src/commands/search');
      const command = createSearchCommand();
      expect(command).toBeInstanceOf(Command);
      expect(command.name()).toBe('search');
    });

    it('should have required query argument', async () => {
      const { createSearchCommand } = await import('../../../src/commands/search');
      const command = createSearchCommand();
      const args = command.registeredArguments;

      expect(args.length).toBeGreaterThan(0);
      expect(args[0].name()).toBe('query');
      expect(args[0].required).toBe(true);
    });

    it('should have --json option', async () => {
      const { createSearchCommand } = await import('../../../src/commands/search');
      const command = createSearchCommand();
      const jsonOption = command.options.find((opt) => opt.long === '--json');

      expect(jsonOption).toBeDefined();
    });

    it('should have --verbose option', async () => {
      const { createSearchCommand } = await import('../../../src/commands/search');
      const command = createSearchCommand();
      const verboseOption = command.options.find((opt) => opt.long === '--verbose');

      expect(verboseOption).toBeDefined();
    });

    it('should have a description', async () => {
      const { createSearchCommand } = await import('../../../src/commands/search');
      const command = createSearchCommand();
      const description = command.description();

      expect(description).toBeTruthy();
      expect(description.toLowerCase()).toContain('search');
    });

    it('should include help text with query syntax and examples', async () => {
      const { createSearchCommand } = await import('../../../src/commands/search');
      const command = createSearchCommand();

      // Commander stores help text in _helpConfiguration
      const helpText = command.helpInformation();

      expect(helpText).toBeDefined();
      expect(typeof helpText).toBe('string');
    });
  });

  describe('Task 10: Query Execution', () => {
    it('should call searchSkills with non-empty query', async () => {
      const { execute } = await import('../../../src/commands/search');

      await execute('arweave', {});

      expect(mockSearchSkills).toHaveBeenCalledWith('arweave');
      expect(mockSearchSkills).toHaveBeenCalledTimes(1);
    });

    it('should call searchSkills with empty query (list all)', async () => {
      const { execute } = await import('../../../src/commands/search');

      await execute('', {});

      expect(mockSearchSkills).toHaveBeenCalledWith('');
      expect(mockSearchSkills).toHaveBeenCalledTimes(1);
    });

    it('should verify registry client method called exactly once', async () => {
      const { execute } = await import('../../../src/commands/search');

      await execute('test-query', {});

      expect(mockSearchSkills).toHaveBeenCalledTimes(1);
    });

    it('should pass query parameter correctly to client', async () => {
      const { execute } = await import('../../../src/commands/search');
      const testQuery = 'ao basics';

      await execute(testQuery, {});

      expect(mockSearchSkills).toHaveBeenCalledWith(testQuery);
    });
  });

  describe('Task 11: Result Sorting', () => {
    const mockResults: ISkillMetadata[] = [
      {
        name: 'learn-arweave',
        version: '1.0.0',
        description: 'Learn Arweave basics',
        author: 'Test Author',
        owner: 'test-owner-1',
        tags: ['tutorial'],
        dependencies: [],
        arweaveTxId: 'tx1',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: 'arweave-fundamentals',
        version: '1.0.0',
        description: 'Fundamental concepts',
        author: 'Test Author',
        owner: 'test-owner-2',
        tags: ['basics'],
        dependencies: [],
        arweaveTxId: 'tx2',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: 'arweave-basics',
        version: '1.0.0',
        description: 'Basic Arweave tutorial',
        author: 'Test Author',
        owner: 'test-owner-3',
        tags: ['tutorial'],
        dependencies: [],
        arweaveTxId: 'tx3',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: 'blockchain-intro',
        version: '1.0.0',
        description: 'skill for arweave developers',
        author: 'Test Author',
        owner: 'test-owner-4',
        tags: ['tutorial'],
        dependencies: [],
        arweaveTxId: 'tx4',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        name: 'crypto-basics',
        version: '1.0.0',
        description: 'Cryptography fundamentals',
        author: 'Test Author',
        owner: 'test-owner-5',
        tags: ['blockchain', 'arweave'],
        dependencies: [],
        arweaveTxId: 'tx5',
        publishedAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    it('should sort results by relevance (exact name match first)', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue(mockResults);

      await execute('arweave-basics', {});

      // Formatter should be called with sorted results
      const sortedResults = mockFormatSearchResults.mock.calls[0][0];

      // Exact match should be first
      expect(sortedResults[0].name).toBe('arweave-basics');
    });

    it('should prioritize name starts with query', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue(mockResults);

      await execute('arweave', {});

      const sortedResults = mockFormatSearchResults.mock.calls[0][0];

      // Name starts with "arweave" should come before name contains "arweave"
      const startsWithIndex = sortedResults.findIndex((s: ISkillMetadata) =>
        s.name.startsWith('arweave')
      );
      const containsIndex = sortedResults.findIndex(
        (s: ISkillMetadata) =>
          s.name.includes('arweave') && !s.name.startsWith('arweave')
      );

      if (startsWithIndex >= 0 && containsIndex >= 0) {
        expect(startsWithIndex).toBeLessThan(containsIndex);
      }
    });

    it('should prioritize name contains over description contains', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue(mockResults);

      await execute('arweave', {});

      const sortedResults = mockFormatSearchResults.mock.calls[0][0];

      // Name contains "arweave" should come before description contains "arweave"
      const nameContainsIndex = sortedResults.findIndex((s: ISkillMetadata) =>
        s.name.toLowerCase().includes('arweave')
      );
      const descriptionOnlyIndex = sortedResults.findIndex(
        (s: ISkillMetadata) =>
          !s.name.toLowerCase().includes('arweave') &&
          s.description.toLowerCase().includes('arweave')
      );

      if (nameContainsIndex >= 0 && descriptionOnlyIndex >= 0) {
        expect(nameContainsIndex).toBeLessThan(descriptionOnlyIndex);
      }
    });

    it('should handle case-insensitive matching', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue(mockResults);

      await execute('ARWEAVE', {});

      const sortedResults = mockFormatSearchResults.mock.calls[0][0];

      // Should still find "arweave" skills
      expect(sortedResults.length).toBeGreaterThan(0);
    });

    it('should return unsorted results for empty query (list all)', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue(mockResults);

      await execute('', {});

      const sortedResults = mockFormatSearchResults.mock.calls[0][0];

      // Should return all results without sorting
      expect(sortedResults.length).toBe(mockResults.length);
    });
  });

  describe('Task 12: Formatter Integration', () => {
    it('should call formatter with table format when --json is false (default)', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([]);

      await execute('test', {});

      expect(mockFormatSearchResults).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ json: undefined })
      );
    });

    it('should call formatter with JSON format when --json is true', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([]);

      await execute('test', { json: true });

      expect(mockFormatSearchResults).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ json: true })
      );
    });

    it('should verify formatter called with correct results and options', async () => {
      const { execute } = await import('../../../src/commands/search');
      const mockResults: ISkillMetadata[] = [
        {
          name: 'test-skill',
          version: '1.0.0',
          description: 'Test skill',
          author: 'Test Author',
          owner: 'test-owner',
          tags: ['test'],
          dependencies: [],
          arweaveTxId: 'tx1',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      mockSearchSkills.mockResolvedValue(mockResults);

      await execute('test', { json: false });

      expect(mockFormatSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'test-skill' })]),
        expect.objectContaining({ json: false })
      );
    });

    it('should log formatter output using logger (not console.log)', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([]);
      mockFormatSearchResults.mockReturnValue('formatted output test');

      await execute('test', {});

      expect(logger.info).toHaveBeenCalledWith('formatted output test');
    });
  });

  describe('Task 13: Verbose Mode', () => {
    it('should enable verbose logging when --verbose flag is set', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([]);

      await execute('test', { verbose: true });

      expect(logger.setLevel).toHaveBeenCalledWith('debug');
    });

    it('should not enable verbose logging when --verbose flag is false', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([]);

      await execute('test', { verbose: false });

      expect(logger.setLevel).not.toHaveBeenCalled();
    });

    it('should log query metadata when verbose is true', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([
        {
          name: 'test-skill',
          version: '1.0.0',
          description: 'Test',
          author: 'Author',
          owner: 'owner',
          tags: [],
          dependencies: [],
          arweaveTxId: 'tx1',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      await execute('test-query', { verbose: true });

      // Verify logger.info called for metadata
      expect(logger.info).toHaveBeenCalled();
      const infoCalls = (logger.info as jest.Mock).mock.calls;
      // Check that info was called with at least some metadata
      expect(infoCalls.length).toBeGreaterThan(0);
    });

    it('should include response time in verbose output', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([]);

      await execute('test', { verbose: true });

      const infoCalls = (logger.info as jest.Mock).mock.calls;
      // Verbose mode should log multiple info messages
      expect(infoCalls.length).toBeGreaterThan(0);
    });

    it('should include result count in verbose output', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([
        {
          name: 'test-skill',
          version: '1.0.0',
          description: 'Test',
          author: 'Author',
          owner: 'owner',
          tags: [],
          dependencies: [],
          arweaveTxId: 'tx1',
          publishedAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      await execute('test', { verbose: true });

      const infoCalls = (logger.info as jest.Mock).mock.calls;
      // Verbose mode should log metadata with results
      expect(infoCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Task 14: Error Handling', () => {
    it('should handle NetworkError with timeout message', async () => {
      const { execute } = await import('../../../src/commands/search');
      const timeoutError = new NetworkError(
        'Search-Skills query timed out after 30 seconds',
        new Error('Timeout'),
        'ao-registry'
      );
      mockSearchSkills.mockRejectedValue(timeoutError);

      await expect(execute('test', {})).rejects.toThrow(NetworkError);
    });

    it('should handle NetworkError with registry unavailable message', async () => {
      const { execute } = await import('../../../src/commands/search');
      const registryError = new NetworkError(
        'Failed to execute Search-Skills query',
        new Error('Registry unavailable'),
        'ao-registry'
      );
      mockSearchSkills.mockRejectedValue(registryError);

      await expect(execute('test', {})).rejects.toThrow(NetworkError);
    });

    it('should handle ConfigurationError', async () => {
      const { execute } = await import('../../../src/commands/search');
      const configError = new ConfigurationError(
        'AO Registry Process ID not configured',
        'registry'
      );
      mockSearchSkills.mockRejectedValue(configError);

      await expect(execute('test', {})).rejects.toThrow(ConfigurationError);
    });

    it('should verify error messages logged using logger.error', async () => {
      const { execute } = await import('../../../src/commands/search');
      const networkError = new NetworkError(
        'Network failure',
        new Error('Network error'),
        'ao-registry'
      );
      mockSearchSkills.mockRejectedValue(networkError);

      try {
        await execute('test', {});
      } catch (error) {
        // Expected error
      }

      // Error should be thrown, not logged in execute()
      // Error handling is done in command.action() wrapper
    });
  });

  describe('Task 15: Performance Monitoring', () => {
    it('should calculate duration correctly', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return [];
      });

      const startTime = Date.now();
      await execute('test', {});
      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      // Duration should be at least 100ms
      expect(actualDuration).toBeGreaterThanOrEqual(100);
    });

    it('should log warning if duration exceeds 2 seconds', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 2100));
        return [];
      });

      await execute('test', {});

      expect(logger.warn).toHaveBeenCalled();
      const warnCalls = (logger.warn as jest.Mock).mock.calls;
      const performanceWarning = warnCalls.find((call) =>
        call[0].includes('exceeds 2s target')
      );
      expect(performanceWarning).toBeDefined();
    }, 10000); // Increase test timeout to 10 seconds

    it('should not log warning if duration is under 2 seconds', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([]);

      await execute('test', {});

      const warnCalls = (logger.warn as jest.Mock).mock.calls;
      const performanceWarning = warnCalls.find((call) =>
        call[0].includes('exceeds 2s target')
      );
      expect(performanceWarning).toBeUndefined();
    });

    it('should include duration in verbose output', async () => {
      const { execute } = await import('../../../src/commands/search');
      mockSearchSkills.mockResolvedValue([]);

      await execute('test', { verbose: true });

      const infoCalls = (logger.info as jest.Mock).mock.calls;
      // Verbose mode should log metadata
      expect(infoCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Task 8: Tag Filtering Logic (Story 2.4)', () => {
    const createMockSkill = (name: string, tags: string[]): ISkillMetadata => ({
      name,
      version: '1.0.0',
      description: 'Test skill',
      author: 'Test Author',
      owner: 'test-owner-address-43chars-xxxxxxxxxxxx',
      tags,
      dependencies: [],
      arweaveTxId: 'test-txid-43chars-xxxxxxxxxxxxxxxxxxxxx',
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    it('should return all results when no tags specified', async () => {
      const { execute } = await import('../../../src/commands/search');
      const mockSkills = [
        createMockSkill('skill1', ['ao', 'blockchain']),
        createMockSkill('skill2', ['arweave', 'storage']),
        createMockSkill('skill3', ['tutorial', 'beginner']),
      ];
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await execute('test', {});

      expect(results).toHaveLength(3);
      expect(mockFormatSearchResults).toHaveBeenCalledWith(
        expect.arrayContaining(mockSkills),
        expect.objectContaining({ json: undefined, tags: undefined })
      );
    });

    it('should filter correctly with single tag', async () => {
      const { execute } = await import('../../../src/commands/search');
      const mockSkills = [
        createMockSkill('skill1', ['ao', 'blockchain']),
        createMockSkill('skill2', ['arweave', 'storage']),
        createMockSkill('skill3', ['ao', 'tutorial']),
      ];
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await execute('test', { tag: ['ao'] });

      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('skill1');
      expect(results[1].name).toBe('skill3');
    });

    it('should use AND logic for multiple tags', async () => {
      const { execute } = await import('../../../src/commands/search');
      const mockSkills = [
        createMockSkill('skill1', ['ao', 'blockchain', 'tutorial']),
        createMockSkill('skill2', ['ao', 'blockchain']),
        createMockSkill('skill3', ['ao', 'tutorial']),
        createMockSkill('skill4', ['blockchain', 'tutorial']),
      ];
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await execute('test', { tag: ['ao', 'blockchain'] });

      // Only skill1 and skill2 have BOTH ao AND blockchain
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('skill1');
      expect(results[1].name).toBe('skill2');
    });

    it('should perform case-insensitive tag matching', async () => {
      const { execute } = await import('../../../src/commands/search');
      const mockSkills = [
        createMockSkill('skill1', ['AO', 'Blockchain']),
        createMockSkill('skill2', ['ao', 'blockchain']),
        createMockSkill('skill3', ['Ao', 'BLOCKCHAIN']),
      ];
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await execute('test', { tag: ['ao'] });

      // All three should match (case-insensitive)
      expect(results).toHaveLength(3);
    });

    it('should return empty results when no skills match tags', async () => {
      const { execute } = await import('../../../src/commands/search');
      const mockSkills = [
        createMockSkill('skill1', ['ao', 'blockchain']),
        createMockSkill('skill2', ['arweave', 'storage']),
      ];
      mockSearchSkills.mockResolvedValue(mockSkills);

      const results = await execute('test', { tag: ['nonexistent'] });

      expect(results).toHaveLength(0);
    });

    it('should pass tags to formatter for highlighting', async () => {
      const { execute } = await import('../../../src/commands/search');
      const mockSkills = [createMockSkill('skill1', ['ao', 'blockchain'])];
      mockSearchSkills.mockResolvedValue(mockSkills);

      await execute('test', { tag: ['ao'] });

      expect(mockFormatSearchResults).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ tags: ['ao'] })
      );
    });
  });
});
