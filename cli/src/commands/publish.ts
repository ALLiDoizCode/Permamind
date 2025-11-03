/**
 * Publish Command Module
 *
 * CLI wrapper for PublishService. Handles argument parsing, progress display
 * (ora spinners), and error formatting. All business logic delegated to
 * PublishService for reuse by MCP server.
 *
 * Responsibilities:
 * - Parse CLI arguments
 * - Map PublishService progress callbacks to ora spinners
 * - Display success/error messages with chalk colors
 * - Handle process exit codes
 */

import { Command } from 'commander';
import * as path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { PublishService, ProgressEvent } from '../lib/publish-service.js';
import { loadConfig, resolveWalletPath } from '../lib/config-loader.js';
import logger from '../utils/logger.js';
import {
  formatError,
  generateErrorContext,
} from '../lib/error-formatter.js';
import { IPublishOptions, IPublishResult } from '../types/commands.js';
import {
  getExitCode,
} from '../types/errors.js';

/**
 * Constants for publish command
 */
const WINSTON_PER_AR = 1_000_000_000_000;

/**
 * Create the publish command
 *
 * @returns Commander.js Command instance
 */
export function createPublishCommand(): Command {
  const cmd = new Command('publish');

  cmd
    .description('Publish a skill to Arweave and register in AO registry')
    .argument('<directory>', 'Path to skill directory containing SKILL.md')
    .option('--wallet <path>', 'Custom wallet path (overrides config)')
    .option('--verbose', 'Enable detailed logging')
    .option('--gateway <url>', 'Custom Arweave gateway URL (overrides config)')
    .addHelpText(
      'after',
      `
Examples:
  $ skills publish ./my-skill
    Publish skill using default configuration from .skillsrc

  $ skills publish ./my-skill --wallet ~/custom-wallet.json
    Publish with a custom wallet (overrides .skillsrc)

  $ skills publish ./my-skill --gateway https://g8way.io
    Publish to a specific Arweave gateway

  $ skills publish ./my-skill --verbose
    Enable detailed logging for debugging upload issues

  $ skills publish ./my-skill --wallet ~/wallet.json --verbose
    Combine options: custom wallet with verbose logging

Workflow:
  1. Validates skill directory and SKILL.md manifest
  2. Creates .tar.gz bundle of skill files
  3. Uploads bundle to Arweave network
  4. Registers skill in AO registry
  5. Displays success message with Transaction ID

Documentation:
  Troubleshooting: https://github.com/permamind/skills/blob/main/docs/troubleshooting.md
`,
    )
    .action(async (directory: string, options: IPublishOptions) => {
      try {
        await execute(directory, options);
        process.exit(0);
      } catch (error: unknown) {
        handleError(error, options.verbose);
        process.exit(getExitCode(error));
      }
    });

  return cmd;
}

/**
 * Execute the publish command workflow
 *
 * Thin wrapper around PublishService that maps progress events to
 * ora spinners for CLI presentation.
 *
 * @param directory - Path to skill directory
 * @param options - Command options
 * @returns Publish result with transaction IDs and metadata
 * @throws Various error types for different failure scenarios
 */
export async function execute(
  directory: string,
  options: IPublishOptions
): Promise<IPublishResult> {
  // Enable verbose logging if requested
  if (options.verbose) {
    logger.setLevel('debug');
    logger.debug('Verbose logging enabled');
  }

  logger.debug('Starting publish workflow', { directory, options });

  // Load configuration for wallet resolution
  const config = await loadConfig();
  const walletPath = resolveWalletPath(options.wallet, config);

  // Expand tilde in path if present
  const expandedWalletPath = walletPath?.startsWith('~')
    ? path.join(process.env.HOME || '', walletPath.slice(1))
    : walletPath;

  // Create progress callback mapping progress events to ora spinners
  let spinner: ora.Ora | null = null;
  const progressCallback = (event: ProgressEvent) => {
    switch (event.type) {
      case 'validating':
        spinner?.stop();
        spinner = ora(event.message).start();
        break;
      case 'parsing':
        if (spinner) {
          spinner.succeed();
        }
        spinner = ora(event.message).start();
        break;
      case 'bundling':
        if (!spinner) {
          spinner = ora(event.message).start();
        } else {
          spinner.text = event.message;
        }
        break;
      case 'uploading':
        if (spinner) {
          spinner.succeed();
        }
        spinner = ora(event.message).start();
        break;
      case 'registering':
        if (spinner) {
          spinner.succeed();
        }
        spinner = ora(event.message).start();
        break;
      case 'complete':
        spinner?.succeed();
        spinner = null;
        break;
    }
  };

  // Call PublishService
  const service = new PublishService();
  const result = await service.publish(directory, {
    walletPath: expandedWalletPath, // CLI uses walletPath (not pre-loaded wallet)
    verbose: options.verbose,
    gatewayUrl: options.gateway,
    progressCallback,
  });

  // Display success message (CLI presentation)
  displaySuccess(result);

  return result;
}

/**
 * Display success message with all relevant IDs
 *
 * @param result - Publish result
 */
function displaySuccess(result: IPublishResult): void {
  logger.info(''); // Empty line
  logger.info(chalk.green('🎉 Skill published successfully!'));
  logger.info('');

  // Display metadata table
  logger.info(chalk.bold('  Name:        ') + result.skillName);
  logger.info(chalk.bold('  Version:     ') + result.version);
  logger.info(chalk.bold('  Arweave TX:  ') + result.arweaveTxId);
  logger.info(chalk.bold('  Registry ID: ') + result.registryMessageId);
  logger.info(
    chalk.bold('  Bundle Size: ') +
    formatBytes(result.bundleSize)
  );
  logger.info(
    chalk.bold('  Upload Cost: ') +
    `${(result.uploadCost / WINSTON_PER_AR).toFixed(6)} AR`
  );
  logger.info('');

  // Display helpful links
  logger.info(chalk.bold('View your skill on Arweave:'));
  logger.info(chalk.cyan(`  https://arweave.net/${result.arweaveTxId}`));
  logger.info('');
  logger.info(chalk.bold('Search for your skill:'));
  logger.info(chalk.cyan(`  skills search ${result.skillName}`));
  logger.info('');
}

/**
 * Task 17: Handle errors and display user-friendly messages
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
  const context = generateErrorContext('publish');

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


/**
 * Format bytes to human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "5.2 MB")
 * @private
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 bytes';
  const k = 1024;
  const sizes = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
