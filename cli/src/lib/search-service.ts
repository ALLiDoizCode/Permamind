/**
 * Search Service Module
 *
 * Business logic layer for skill search functionality. Provides UI-agnostic
 * search capabilities that can be used by both CLI commands and MCP server tools.
 *
 * Responsibilities:
 * - Query AO registry for skills
 * - Filter results by tags (client-side AND logic)
 * - Sort results by relevance (5-level priority scoring)
 * - Track performance (2s threshold warning)
 *
 * NOT responsible for:
 * - CLI presentation (formatting, colors, tables)
 * - User input parsing
 * - Process exit codes
 */

import * as aoRegistryClient from '../clients/ao-registry-client.js';
import logger from '../utils/logger.js';
import { ISkillMetadata } from '../types/ao-registry.js';

/**
 * Options for search operation
 */
export interface ISearchServiceOptions {
  /** Tag filters - skills must have ALL specified tags (AND logic) */
  tags?: string[];

  /** Enable debug logging */
  verbose?: boolean;
}

/**
 * Type alias for search results (clarity in search context)
 */
export type ISearchResult = ISkillMetadata;

/**
 * Service class for skill search business logic
 *
 * Follows PublishService pattern from Story 8.3:
 * - UI-agnostic (no ora/chalk/cli-table3 dependencies)
 * - Propagates errors (no try-catch)
 * - Uses logger.debug() for verbose logging
 * - Returns raw data (CLI formats for display)
 */
export class SearchService {
  /**
   * Search for skills in AO registry with optional tag filtering
   *
   * @param query - Search query string (empty string lists all skills)
   * @param options - Search options (tags, verbose)
   * @returns Array of skill metadata sorted by relevance
   * @throws NetworkError if registry query fails
   * @throws ConfigurationError if registry not configured
   */
  async search(
    query: string,
    options: ISearchServiceOptions = {}
  ): Promise<ISearchResult[]> {
    // Enable verbose logging if requested
    if (options.verbose) {
      logger.setLevel('debug');
    }

    logger.debug('Starting search workflow', { query, options });

    // Track performance for NFR4 requirement (2-second target)
    const startTime = Date.now();

    // Workflow orchestration
    const results = await this.queryRegistry(query);
    const filteredResults = this.filterByTags(results, options.tags || []);
    const sortedResults = this.sortByRelevance(filteredResults, query);

    // Calculate and log performance
    const duration = Date.now() - startTime;
    this.trackPerformance(duration, options.verbose || false);

    logger.debug('Search workflow complete', {
      resultCount: sortedResults.length,
      durationMs: duration,
    });

    return sortedResults;
  }

  /**
   * Query AO registry for skills matching the search query
   *
   * @param query - Search query (empty string lists all skills)
   * @returns Array of skill metadata
   * @throws {NetworkError} If query fails
   * @throws {ConfigurationError} If registry not configured
   * @private
   */
  private async queryRegistry(query: string): Promise<ISkillMetadata[]> {
    logger.debug('Querying AO registry', { query });

    // Call searchSkills with query parameter
    // Empty query returns all skills
    const results = await aoRegistryClient.searchSkills(query);

    logger.debug('Query execution complete', {
      resultCount: results.length,
    });

    return results;
  }

  /**
   * Filter search results by tags (client-side, AND logic)
   *
   * @param results - Unfiltered skill metadata array
   * @param tags - Tag filters (skills must have ALL specified tags)
   * @returns Filtered skill metadata array
   * @private
   */
  private filterByTags(
    results: ISkillMetadata[],
    tags: string[]
  ): ISkillMetadata[] {
    // No tags specified - return all results (no filtering)
    if (!tags || tags.length === 0) {
      return results;
    }

    // Convert filter tags to lowercase for case-insensitive matching
    const lowerTags = tags.map((tag) => tag.toLowerCase());

    logger.debug('Filtering results by tags', { filterTags: lowerTags });

    // Filter results: skill must have ALL specified tags (AND logic)
    const filtered = results.filter((skill) => {
      const skillTagsLower = skill.tags.map((tag) => tag.toLowerCase());
      return lowerTags.every((filterTag) => skillTagsLower.includes(filterTag));
    });

    logger.debug('Tag filtering complete', {
      preFilterCount: results.length,
      postFilterCount: filtered.length,
      filterTags: lowerTags,
    });

    return filtered;
  }

  /**
   * Sort search results by relevance
   *
   * Priority (highest to lowest):
   * 1. Exact name match (case-insensitive) - score = 5
   * 2. Name starts with query - score = 4
   * 3. Name contains query - score = 3
   * 4. Description contains query - score = 2
   * 5. Tags contain query - score = 1
   *
   * @param results - Unsorted skill metadata array
   * @param query - Search query string
   * @returns Sorted skill metadata array
   * @private
   */
  private sortByRelevance(
    results: ISkillMetadata[],
    query: string
  ): ISkillMetadata[] {
    // Handle empty query (list all) - no sorting needed
    if (!query || query.trim() === '') {
      logger.debug('Empty query - returning unsorted results (list all)');
      return results;
    }

    const lowerQuery = query.toLowerCase();

    logger.debug('Sorting results by relevance', { query });

    // Create scored results for sorting
    const scoredResults = results.map((skill) => {
      let score = 0;

      const nameLower = skill.name.toLowerCase();
      const descriptionLower = skill.description.toLowerCase();
      const tagsLower = skill.tags.map((tag) => tag.toLowerCase());

      // Priority 1: Exact name match (score = 5)
      if (nameLower === lowerQuery) {
        score = 5;
      }
      // Priority 2: Name starts with query (score = 4)
      else if (nameLower.startsWith(lowerQuery)) {
        score = 4;
      }
      // Priority 3: Name contains query (score = 3)
      else if (nameLower.includes(lowerQuery)) {
        score = 3;
      }
      // Priority 4: Description contains query (score = 2)
      else if (descriptionLower.includes(lowerQuery)) {
        score = 2;
      }
      // Priority 5: Tags contain query (score = 1)
      else if (tagsLower.some((tag) => tag.includes(lowerQuery))) {
        score = 1;
      }

      logger.debug('Skill relevance score', {
        skillName: skill.name,
        score,
      });

      return { skill, score };
    });

    // Sort by score descending (highest first)
    const sorted = scoredResults
      .sort((a, b) => b.score - a.score)
      .map((item) => item.skill);

    logger.debug('Results sorted by relevance', {
      resultCount: sorted.length,
    });

    return sorted;
  }

  /**
   * Track and log performance metrics
   *
   * Logs warning if duration exceeds 2000ms (NFR4 requirement)
   *
   * @param duration - Query duration in milliseconds
   * @param verbose - Whether to log verbose performance data
   * @private
   */
  private trackPerformance(duration: number, verbose: boolean): void {
    const durationSeconds = (duration / 1000).toFixed(2);

    // Log performance warning if exceeds 2 seconds (NFR4)
    if (duration > 2000) {
      logger.warn(
        `Search query took ${durationSeconds}s (exceeds 2s target). Consider optimizing your query or checking network connectivity.`
      );
    }

    // Log verbose performance data if requested
    if (verbose) {
      logger.debug('Performance tracking', {
        durationMs: duration,
        durationSeconds,
        exceedsTarget: duration > 2000,
      });
    }
  }
}
