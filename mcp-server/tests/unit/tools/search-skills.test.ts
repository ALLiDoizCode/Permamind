/**
 * Unit tests for search-skills MCP tool
 *
 * Tests the handleSearchSkills function, error translation,
 * and response formatting with mocked dependencies.
 */

import {
  handleSearchSkills,
  translateError,
  formatSuccessResponse,
  IMCPSuccessResponse,
  IMCPErrorResponse,
} from '../../../src/tools/search-skills';
import { SearchService } from '@permamind/skills-cli/src/lib/search-service';
import type { ISearchResult } from '@permamind/skills-cli/src/lib/search-service';
import {
  ValidationError,
  ConfigurationError,
  NetworkError,
} from '@permamind/skills-cli/src/types/errors';

// Mock dependencies
jest.mock('@permamind/skills-cli/src/lib/search-service');
jest.mock('../../../src/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('search-skills tool', () => {
  const mockSearchResults: ISearchResult[] = [
    {
      name: 'ao-basics',
      version: '1.0.0',
      author: 'John Doe',
      owner: 'abc123def456ghi789jkl012mno345pqr678stu901vwx',
      description: 'Introduction to AO protocol',
      tags: ['ao', 'tutorial'],
      dependencies: [],
      arweaveTxId: 'abc123def456ghi789jkl012mno345pqr678stu901vwx',
      publishedAt: 1234567890000,
      updatedAt: 1234567890000,
    },
    {
      name: 'lua-advanced',
      version: '2.1.0',
      author: 'Jane Smith',
      owner: 'xyz987wvu654tsr321qpo098nml765kji432hgf210edc',
      description: 'Advanced Lua programming techniques',
      tags: ['lua', 'advanced'],
      dependencies: [],
      arweaveTxId: 'xyz987wvu654tsr321qpo098nml765kji432hgf210edc',
      publishedAt: 1234567891000,
      updatedAt: 1234567891000,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSearchSkills', () => {
    it('should successfully search with query only', async () => {
      // Arrange
      (SearchService.prototype.search as jest.Mock).mockResolvedValue(mockSearchResults);

      // Act
      const result = await handleSearchSkills('ao', [], false);

      // Assert
      expect(result).toEqual({
        results: mockSearchResults,
        query: 'ao',
      });
      expect(SearchService.prototype.search).toHaveBeenCalledWith('ao', {
        tags: undefined,
        verbose: false,
      });
    });

    it('should successfully search with query and tags', async () => {
      // Arrange
      const filteredResults = [mockSearchResults[0]];
      (SearchService.prototype.search as jest.Mock).mockResolvedValue(filteredResults);

      // Act
      const result = await handleSearchSkills('ao', ['tutorial'], false);

      // Assert
      expect(result).toEqual({
        results: filteredResults,
        query: 'ao',
        tags: ['tutorial'],
      });
      expect(SearchService.prototype.search).toHaveBeenCalledWith('ao', {
        tags: ['tutorial'],
        verbose: false,
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      (SearchService.prototype.search as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await handleSearchSkills('nonexistent', [], false);

      // Assert
      expect(result).toEqual({
        results: [],
        query: 'nonexistent',
      });
    });

    it('should enable verbose logging when requested', async () => {
      // Arrange
      (SearchService.prototype.search as jest.Mock).mockResolvedValue(mockSearchResults);

      // Act
      await handleSearchSkills('ao', [], true);

      // Assert
      expect(SearchService.prototype.search).toHaveBeenCalledWith('ao', {
        tags: undefined,
        verbose: true,
      });
    });

    it('should handle empty tag array correctly', async () => {
      // Arrange
      (SearchService.prototype.search as jest.Mock).mockResolvedValue(mockSearchResults);

      // Act
      await handleSearchSkills('ao', [], false);

      // Assert
      expect(SearchService.prototype.search).toHaveBeenCalledWith('ao', {
        tags: undefined,
        verbose: false,
      });
    });

    it('should propagate ConfigurationError from SearchService', async () => {
      // Arrange
      const error = new ConfigurationError(
        'AO registry process ID not configured',
        'Set AO_REGISTRY_PROCESS_ID environment variable'
      );
      (SearchService.prototype.search as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(handleSearchSkills('ao', [], false)).rejects.toThrow(
        'AO registry process ID not configured'
      );
    });

    it('should propagate NetworkError from SearchService', async () => {
      // Arrange
      const error = new NetworkError(
        'Failed to query AO registry',
        new Error('Connection timeout'),
        'https://ao-registry.arweave.net',
        'timeout'
      );
      (SearchService.prototype.search as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(handleSearchSkills('ao', [], false)).rejects.toThrow(
        'Failed to query AO registry'
      );
    });
  });

  describe('formatSuccessResponse', () => {
    it('should format search results with query only', () => {
      // Act
      const response = formatSuccessResponse(mockSearchResults, 'ao');

      // Assert
      expect(response).toEqual({
        status: 'success',
        count: 2,
        query: 'ao',
        results: mockSearchResults,
      });
    });

    it('should format search results with query and tags', () => {
      // Act
      const response = formatSuccessResponse([mockSearchResults[0]], 'ao', ['tutorial']);

      // Assert
      expect(response).toEqual({
        status: 'success',
        count: 1,
        query: 'ao',
        tags: ['tutorial'],
        results: [mockSearchResults[0]],
      });
    });

    it('should format empty results with helpful message', () => {
      // Act
      const response = formatSuccessResponse([], 'nonexistent');

      // Assert
      expect(response).toEqual({
        status: 'success',
        count: 0,
        query: 'nonexistent',
        results: [],
        message: "No skills found matching query: 'nonexistent'",
      });
    });

    it('should format empty results with tags in message', () => {
      // Act
      const response = formatSuccessResponse([], 'ao', ['nonexistent-tag']);

      // Assert
      expect(response).toEqual({
        status: 'success',
        count: 0,
        query: 'ao',
        tags: ['nonexistent-tag'],
        results: [],
        message: "No skills found matching query: 'ao' with tags: [nonexistent-tag]",
      });
    });

    it('should not include tags field when tags array is empty', () => {
      // Act
      const response = formatSuccessResponse(mockSearchResults, 'ao', []);

      // Assert
      expect(response).toEqual({
        status: 'success',
        count: 2,
        query: 'ao',
        results: mockSearchResults,
      });
      expect(response.tags).toBeUndefined();
    });

    it('should not include message field when results are found', () => {
      // Act
      const response = formatSuccessResponse(mockSearchResults, 'ao');

      // Assert
      expect(response.message).toBeUndefined();
    });
  });

  describe('translateError', () => {
    it('should translate ValidationError', () => {
      // Arrange
      const error = new ValidationError(
        'Invalid query format',
        'query',
        null,
        'string',
        'Value must be a string'
      );

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'ValidationError',
        message: 'Invalid query format',
        solution:
          'Check your search query and tag filters. Query should be a string, tags should be an array of strings.',
        details: {
          field: 'query',
          value: null,
          expected: 'string',
          schemaError: 'Value must be a string',
        },
      });
    });

    it('should translate ConfigurationError', () => {
      // Arrange
      const error = new ConfigurationError(
        'AO registry process ID not configured',
        'Set AO_REGISTRY_PROCESS_ID environment variable'
      );

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'ConfigurationError',
        message: 'AO registry process ID not configured',
        solution:
          'Verify AO registry process ID is configured. Check environment variables or config file.',
      });
    });

    it('should translate NetworkError', () => {
      // Arrange
      const error = new NetworkError(
        'Failed to query AO registry',
        new Error('Connection timeout'),
        'https://ao-registry.arweave.net',
        'timeout'
      );

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'NetworkError',
        message: 'Failed to query AO registry',
        solution:
          'Check your network connection and try again. AO network may be temporarily unavailable.',
      });
    });

    it('should translate unknown errors', () => {
      // Arrange
      const error = new Error('Unexpected error occurred');

      // Act
      const response = translateError(error);

      // Assert
      expect(response).toEqual({
        status: 'error',
        errorType: 'UnknownError',
        message: 'Unexpected error occurred',
        solution: 'Check the MCP server logs for more details about this error.',
      });
    });
  });

  describe('response types', () => {
    it('should return IMCPSuccessResponse type from formatSuccessResponse', () => {
      // Act
      const response = formatSuccessResponse(mockSearchResults, 'ao');

      // Assert - TypeScript compile-time check
      const typedResponse: IMCPSuccessResponse = response;
      expect(typedResponse.status).toBe('success');
      expect(typedResponse.count).toBe(2);
      expect(typedResponse.query).toBe('ao');
      expect(typedResponse.results).toHaveLength(2);
    });

    it('should return IMCPErrorResponse type from translateError', () => {
      // Arrange
      const error = new NetworkError(
        'Test error',
        new Error('Test cause'),
        'https://test-gateway.arweave.net',
        'timeout'
      );

      // Act
      const response = translateError(error);

      // Assert - TypeScript compile-time check
      const typedResponse: IMCPErrorResponse = response;
      expect(typedResponse.status).toBe('error');
      expect(typedResponse.errorType).toBe('NetworkError');
      expect(typedResponse.message).toBe('Test error');
      expect(typedResponse.solution).toBe(
        'Check your network connection and try again. AO network may be temporarily unavailable.'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty query string', async () => {
      // Arrange
      (SearchService.prototype.search as jest.Mock).mockResolvedValue(mockSearchResults);

      // Act
      const result = await handleSearchSkills('', [], false);

      // Assert
      expect(result.query).toBe('');
      expect(SearchService.prototype.search).toHaveBeenCalledWith('', {
        tags: undefined,
        verbose: false,
      });
    });

    it('should handle multiple tags filter', async () => {
      // Arrange
      (SearchService.prototype.search as jest.Mock).mockResolvedValue([mockSearchResults[0]]);

      // Act
      const result = await handleSearchSkills('ao', ['ao', 'tutorial'], false);

      // Assert
      expect(result.tags).toEqual(['ao', 'tutorial']);
      expect(SearchService.prototype.search).toHaveBeenCalledWith('ao', {
        tags: ['ao', 'tutorial'],
        verbose: false,
      });
    });

    it('should handle whitespace-only query', async () => {
      // Arrange
      (SearchService.prototype.search as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await handleSearchSkills('   ', [], false);

      // Assert
      expect(result.query).toBe('   ');
    });
  });
});
