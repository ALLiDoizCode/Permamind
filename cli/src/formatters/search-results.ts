/**
 * Search Results Formatter
 *
 * Provides table and JSON formatting for skill search results.
 * Uses cli-table3 for terminal-friendly tables and chalk for color coding.
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import { ISkillMetadata } from '../types/ao-registry.js';
import * as logger from '../utils/logger.js';

/**
 * Maximum description length before truncation
 */
const MAX_DESCRIPTION_LENGTH = 50;

/**
 * Options for formatting search results
 */
export interface IFormatterOptions {
  /**
   * Output format selection
   * - false (default): Formatted table output
   * - true: Raw JSON output for scripting
   */
  json?: boolean;

  /**
   * Tag filters applied to results (for highlighting and empty message)
   */
  tags?: string[];
}

/**
 * Format skill search results for display
 *
 * @param results - Array of skill metadata from AO registry
 * @param options - Formatting options (table vs JSON)
 * @returns Formatted string ready for console output
 *
 * @example
 * ```typescript
 * const results = await aoRegistryClient.search('ao');
 * const output = formatSearchResults(results);
 * console.log(output);
 * ```
 */
export function formatSearchResults(
  results: ISkillMetadata[],
  options?: IFormatterOptions
): string {
  logger.debug('Formatting search results', {
    resultCount: results.length,
    formatType: options?.json ? 'json' : 'table',
  });

  // Return JSON format if requested
  if (options?.json) {
    return formatAsJson(results);
  }

  // Return table format (default)
  return formatAsTable(results, options?.tags);
}

/**
 * Format results as a terminal table with color coding
 *
 * @param results - Skill metadata array
 * @param filterTags - Tag filters applied (for highlighting and empty message)
 * @returns Formatted table string
 */
function formatAsTable(results: ISkillMetadata[], filterTags?: string[]): string {
  // Handle empty results with custom message for tag filtering
  if (results.length === 0) {
    if (filterTags && filterTags.length > 0) {
      const tagList = filterTags.map((tag) => chalk.yellow(tag)).join(', ');
      return chalk.yellow(
        `No skills found with tags [${tagList}]. Try removing a tag filter.\n`
      );
    } else {
      return chalk.yellow(
        'No skills found. Try a different query or publish the first skill!\n'
      );
    }
  }

  // Create table with column headers
  const table = new Table({
    head: [
      chalk.white.bold('Name'),
      chalk.white.bold('Author'),
      chalk.white.bold('Version'),
      chalk.white.bold('Description'),
      chalk.white.bold('Tags'),
    ],
    style: {
      head: [], // Disable default styling (we apply chalk manually)
      border: [], // Disable border coloring
    },
  });

  // Populate table rows
  results.forEach((skill) => {
    const truncatedDescription = truncateDescription(skill.description);
    const formattedTags = highlightMatchedTags(skill.tags, filterTags);

    table.push([
      chalk.cyan(skill.name),
      chalk.dim(skill.author),
      skill.version,
      truncatedDescription,
      formattedTags,
    ]);

    logger.debug('Added skill to table', {
      name: skill.name,
      descriptionLength: skill.description.length,
      truncated: skill.description.length > MAX_DESCRIPTION_LENGTH,
    });
  });

  // Build final output with table and install hint
  const tableOutput = table.toString();
  const installHint = chalk.dim('\nTo install a skill, run: skills install <name>\n');

  return tableOutput + installHint;
}

/**
 * Highlight matched tags with yellow background
 *
 * @param skillTags - Tags from the skill metadata
 * @param filterTags - Tag filters applied (optional)
 * @returns Formatted tag string with highlighting
 */
function highlightMatchedTags(skillTags: string[], filterTags?: string[]): string {
  // No filtering active - use standard yellow
  if (!filterTags || filterTags.length === 0) {
    return skillTags.map((tag) => chalk.yellow(tag)).join(', ');
  }

  // Convert filter tags to lowercase for comparison
  const lowerFilterTags = filterTags.map((tag) => tag.toLowerCase());

  // Apply highlighting to matched tags
  return skillTags
    .map((tag) => {
      const isMatched = lowerFilterTags.includes(tag.toLowerCase());
      return isMatched
        ? chalk.bgYellow.black(` ${tag} `) // Highlighted (matched)
        : chalk.yellow(tag); // Standard (not matched)
    })
    .join(', ');
}

/**
 * Truncate description to maximum length with ellipsis
 *
 * @param description - Original description text
 * @returns Truncated description (max 50 chars including ellipsis)
 */
function truncateDescription(description: string): string {
  if (description.length <= MAX_DESCRIPTION_LENGTH) {
    return description;
  }

  // Truncate to 47 characters + "..." = 50 total
  const truncated = description.substring(0, 47) + '...';

  logger.debug('Truncated description', {
    originalLength: description.length,
    truncatedLength: truncated.length,
  });

  return truncated;
}

/**
 * Format results as JSON with indentation
 *
 * @param results - Skill metadata array
 * @returns Pretty-printed JSON string
 */
function formatAsJson(results: ISkillMetadata[]): string {
  return JSON.stringify(results, null, 2);
}
