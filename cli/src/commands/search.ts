/**
 * Search Command Module
 *
 * Implements the `skills search <query>` command for discovering skills
 * in the AO registry by searching names, descriptions, or tags.
 *
 * Workflow:
 * 1. Query AO registry via registry client
 * 2. Sort results by relevance (exact name matches first)
 * 3. Format results as table or JSON
 * 4. Display to user with install hints
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as aoRegistryClient from '../clients/ao-registry-client.js';
import { formatSearchResults } from '../formatters/search-results.js';
import logger from '../utils/logger.js';
import {
  formatError,
  generateErrorContext,
} from '../lib/error-formatter.js';
import { ISkillMetadata } from '../types/ao-registry.js';
import { getExitCode } from '../types/errors.js';

/**
 * Options for search command
 */
export interface ISearchOptions {
  /** Output raw JSON instead of table */
  json?: boolean;

  /** Show detailed query information and response metadata */
  verbose?: boolean;

  /** Filter by tags (multiple allowed, AND logic) */
  tag?: string[];
}

/**
 * Type alias for search results (clarity in search context)
 */
export type SearchResult = ISkillMetadata;

/**
 * Collect function for multiple tag options
 *
 * @param value - Current tag value
 * @param previous - Previous accumulated tags
 * @returns Updated tag array
 */
function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

/**
 * Create the search command
 *
 * @returns Commander.js Command instance
 */
export function createSearchCommand(): Command {
  const cmd = new Command('search');

  cmd
    .description('Search for skills by name, description, or tags')
    .argument('<query>', 'Search query (use empty string "" to list all skills)')
    .option('--tag <tag>', 'Filter by tag (can be specified multiple times)', collect, [])
    .option('--json', 'Output raw JSON instead of table')
    .option('--verbose', 'Show detailed query information and response metadata')
    .action(async (query: string, options: ISearchOptions) => {
      try {
        await execute(query, options);
        process.exit(0);
      } catch (error: unknown) {
        handleError(error, options.verbose);
        process.exit(getExitCode(error));
      }
    });

  // Add help text with examples
  cmd.addHelpText('after', `

Tag Filtering:
  Skills must match ALL specified tags (AND logic)

Examples:
  $ skills search arweave                    # Search for skills matching "arweave"
  $ skills search "ao basics"                # Search with multi-word query
  $ skills search ""                         # List all available skills
  $ skills search crypto --tag blockchain    # Search with single tag filter
  $ skills search --tag ao --tag arweave     # Multiple tags (AND logic)
  $ skills search "" --tag tutorial          # List all tutorial skills
  $ skills search crypto --json              # Output results as JSON
  $ skills search --verbose --tag ao         # Verbose mode with tag filter

Documentation:
  Troubleshooting: https://github.com/permamind/skills/blob/main/docs/troubleshooting.md
`);

  return cmd;
}

/**
 * Execute the search command workflow
 *
 * @param query - Search query string
 * @param options - Command options
 * @returns Array of search results
 * @throws Various error types for different failure scenarios
 */
export async function execute(
  query: string,
  options: ISearchOptions
): Promise<SearchResult[]> {
  // Enable verbose logging if requested
  if (options.verbose) {
    logger.setLevel('debug');
    logger.debug('Verbose logging enabled');
  }

  logger.debug('Starting search workflow', { query, options });

  // Track performance for NFR4 requirement (2-second target)
  const startTime = Date.now();

  // Query execution with AO Registry Client
  const results = await queryRegistry(query);

  // Filter results by tags (client-side, AND logic)
  const filteredResults = filterByTags(results, options.tag || []);

  // Calculate query duration
  const endTime = Date.now();
  const duration = endTime - startTime;
  const durationSeconds = (duration / 1000).toFixed(2);

  // Log performance warning if exceeds 2 seconds (NFR4)
  if (duration > 2000) {
    logger.warn(
      `Search query took ${durationSeconds}s (exceeds 2s target). Consider optimizing your query or checking network connectivity.`
    );
  }

  // Log verbose metadata if requested
  if (options.verbose === true) {
    await logVerboseMetadata(query, results.length, filteredResults.length, duration, options.tag);
  }

  // Sort results by relevance
  const sortedResults = sortByRelevance(filteredResults, query);

  // Format and display results
  const formattedOutput = formatSearchResults(sortedResults, {
    json: options.json,
    tags: options.tag,
  });

  // Display results using logger (not console.log per critical rule #1)
  logger.info(formattedOutput);

  return sortedResults;
}

/**
 * Query AO registry for skills matching the search query
 *
 * @param query - Search query (empty string lists all skills)
 * @returns Array of skill metadata
 * @throws {NetworkError} If query fails
 * @throws {ConfigurationError} If registry not configured
 */
async function queryRegistry(
  query: string
): Promise<ISkillMetadata[]> {
  logger.debug('Querying AO registry', { query });

  // Call searchSkills with query parameter
  // Empty query returns all skills (AC: 12)
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
 */
function filterByTags(
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
 * 1. Exact name match (case-insensitive)
 * 2. Name starts with query
 * 3. Name contains query
 * 4. Description contains query
 * 5. Tags contain query
 *
 * @param results - Unsorted skill metadata array
 * @param query - Search query string
 * @returns Sorted skill metadata array
 */
function sortByRelevance(
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
 * Log verbose metadata about the search query
 *
 * @param query - Search query
 * @param preFilterCount - Number of results before tag filtering
 * @param postFilterCount - Number of results after tag filtering
 * @param duration - Query duration in milliseconds
 * @param tags - Tag filters (optional)
 */
async function logVerboseMetadata(
  query: string,
  preFilterCount: number,
  postFilterCount: number,
  duration: number,
  tags?: string[]
): Promise<void> {
  try {
    // Get registry process ID for verbose output
    const config = (await import('../lib/config-loader.js')).loadConfig;
    const loadedConfig = await config();
    const registryProcessId =
      process.env.AO_REGISTRY_PROCESS_ID || loadedConfig.registry || 'not configured';

    logger.info(''); // Empty line for readability
    logger.info(chalk.bold('Query Metadata:'));
    logger.info(`  Query: ${chalk.cyan(query || '(list all)')}`);

    // Show tag filters if specified
    if (tags && tags.length > 0) {
      const tagList = tags.map((tag) => chalk.yellow(tag)).join(', ');
      logger.info(`  Tags: [${tagList}]`);
    }

    logger.info(`  Registry Process ID: ${chalk.dim(registryProcessId)}`);

    // Show pre-filter and post-filter counts if filtering was applied
    if (tags && tags.length > 0) {
      logger.info(`  Pre-filter Results: ${chalk.cyan(preFilterCount)} skills`);
      logger.info(`  Post-filter Results: ${chalk.green(postFilterCount)} skills`);
    } else {
      logger.info(`  Results: ${chalk.green(postFilterCount)} skills found`);
    }

    logger.info(`  Response Time: ${chalk.yellow((duration / 1000).toFixed(2))}s`);
    logger.info(''); // Empty line for readability
  } catch (error: unknown) {
    logger.debug('Failed to load verbose metadata', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle errors and display user-friendly messages
 *
 * @param error - Error object
 * @param verbose - Whether to show verbose error output (stack traces)
 */
function handleError(error: unknown, verbose = false): void {
  if (!(error instanceof Error)) {
    const errorMessage = String(error);
    logger.error(chalk.red(`[Error] Unexpected error: ${errorMessage}`));
    return;
  }

  // Generate error context for verbose mode
  const context = generateErrorContext('search');

  // Format error based on verbose mode
  const formatted = formatError(error, verbose, context);

  // Output formatted error
  if (verbose) {
    // Verbose: JSON output (no chalk colors for machine-readable format)
    process.stderr.write(formatted + '\n');
  } else {
    // Normal: Human-readable with colors
    logger.error(chalk.red(formatted));
  }
}

