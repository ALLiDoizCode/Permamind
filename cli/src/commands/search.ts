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
import { SearchService } from '../lib/search-service.js';
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

  // Call SearchService (business logic layer)
  const service = new SearchService();
  const results = await service.search(query, {
    tags: options.tag,
    verbose: options.verbose,
  });

  // Calculate query duration for verbose metadata
  const duration = Date.now() - startTime;

  // Log verbose metadata if requested (CLI responsibility)
  if (options.verbose === true) {
    await logVerboseMetadata(query, results.length, results.length, duration, options.tag);
  }

  // Format and display results (CLI presentation responsibility)
  const formattedOutput = formatSearchResults(results, {
    json: options.json,
    tags: options.tag,
  });

  // Display results using logger (not console.log per critical rule #1)
  logger.info(formattedOutput);

  return results;
}

/**
 * REMOVED: Business logic functions moved to SearchService
 *
 * - queryRegistry() -> SearchService.queryRegistry() (private)
 * - filterByTags() -> SearchService.filterByTags() (private)
 * - sortByRelevance() -> SearchService.sortByRelevance() (private)
 *
 * CLI command is now a thin wrapper around SearchService,
 * responsible only for presentation (formatting, colors, verbose metadata).
 */

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

