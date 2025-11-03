/**
 * Search Skills MCP Tool
 *
 * Exposes SearchService functionality as an MCP tool for Claude AI integration.
 * Searches the Agent Skills Registry on AO for skills matching query and tag filters.
 */

import { SearchService } from '@permamind/skills-cli/lib/search-service';
import type { ISearchResult } from '@permamind/skills-cli/lib/search-service';
import {
  ValidationError,
  ConfigurationError,
  NetworkError,
} from '@permamind/skills-cli/types/errors';
import { logger } from '../logger.js';

/**
 * MCP error response format
 */
export interface IMCPErrorResponse {
  status: 'error';
  errorType: string;
  message: string;
  solution: string;
  details?: Record<string, unknown>;
}

/**
 * MCP success response format
 */
export interface IMCPSuccessResponse {
  status: 'success';
  count: number;
  query: string;
  tags?: string[];
  results: ISearchResult[];
  message?: string;
}

/**
 * Translate SearchService errors to MCP error responses
 *
 * @param error - Error from SearchService
 * @returns MCP error response with actionable solution
 */
export function translateError(error: Error): IMCPErrorResponse {
  logger.error('Error during search:', {
    errorType: error.constructor.name,
    message: error.message,
    stack: error.stack,
  });

  if (error instanceof ValidationError) {
    return {
      status: 'error',
      errorType: 'ValidationError',
      message: error.message,
      solution:
        'Check your search query and tag filters. Query should be a string, tags should be an array of strings.',
      details: {
        field: error.field,
        value: error.value,
        ...(error.expected && { expected: error.expected }),
        ...(error.schemaError && { schemaError: error.schemaError }),
      },
    };
  }

  if (error instanceof ConfigurationError) {
    return {
      status: 'error',
      errorType: 'ConfigurationError',
      message: error.message,
      solution:
        'Verify AO registry process ID is configured. Check environment variables or config file.',
    };
  }

  if (error instanceof NetworkError) {
    return {
      status: 'error',
      errorType: 'NetworkError',
      message: error.message,
      solution:
        'Check your network connection and try again. AO network may be temporarily unavailable.',
    };
  }

  // Unknown error
  return {
    status: 'error',
    errorType: 'UnknownError',
    message: error.message,
    solution: 'Check the MCP server logs for more details about this error.',
  };
}

/**
 * Format search results as MCP success response
 *
 * @param results - Search results from SearchService
 * @param query - Original search query
 * @param tags - Optional tag filters used
 * @returns MCP success response with formatted data
 */
export function formatSuccessResponse(
  results: ISearchResult[],
  query: string,
  tags?: string[]
): IMCPSuccessResponse {
  const response: IMCPSuccessResponse = {
    status: 'success',
    count: results.length,
    query,
    results,
  };

  // Include tags filter in response metadata if used
  if (tags && tags.length > 0) {
    response.tags = tags;
  }

  // Include helpful message for empty results
  if (results.length === 0) {
    response.message = `No skills found matching query: '${query}'`;
    if (tags && tags.length > 0) {
      response.message += ` with tags: [${tags.join(', ')}]`;
    }
  }

  return response;
}

/**
 * Handle search_skills MCP tool invocation
 *
 * @param query - Search query string (matches name/description/tags)
 * @param tags - Optional array of tag filters (AND logic)
 * @param verbose - Enable verbose debug logging (default: false)
 * @returns Search results with metadata
 * @throws Error if search fails (caller should use translateError)
 */
export async function handleSearchSkills(
  query: string,
  tags: string[] = [],
  verbose: boolean = false
): Promise<{ results: ISearchResult[]; query: string; tags?: string[] }> {
  logger.info('Starting search_skills tool', { query, tags, verbose });

  // Instantiate SearchService
  const searchService = new SearchService();

  // Call search with query and options
  const results = await searchService.search(query, {
    tags: tags.length > 0 ? tags : undefined,
    verbose,
  });

  logger.info('Search complete', {
    query,
    tags,
    resultCount: results.length,
  });

  return {
    results,
    query,
    ...(tags.length > 0 && { tags }),
  };
}
