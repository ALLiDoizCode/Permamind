/**
 * Publish Command Module
 *
 * Implements the `skills publish <directory>` command for uploading skills
 * to Arweave and registering them in the AO registry in one unified workflow.
 *
 * Workflow:
 * 1. Validate directory and SKILL.md
 * 2. Parse and validate manifest
 * 3. Load wallet and check balance
 * 4. Create bundle
 * 5. Upload to Arweave with progress
 * 6. Poll transaction confirmation
 * 7. Register in AO registry
 * 8. Display success message
 */

import { Command } from 'commander';
import { promises as fs } from 'fs';
import * as path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import * as manifestParser from '../parsers/manifest-parser.js';
import * as bundler from '../lib/bundler.js';
import * as walletManager from '../lib/wallet-manager.js';
import * as arweaveClient from '../clients/arweave-client.js';
import * as aoRegistryClient from '../clients/ao-registry-client.js';
import { loadConfig, resolveWalletPath } from '../lib/config-loader.js';
import logger from '../utils/logger.js';
import {
  formatError,
  generateErrorContext,
} from '../lib/error-formatter.js';
import { IPublishOptions, IPublishResult } from '../types/commands.js';
import { ISkillMetadata } from '../types/ao-registry.js';
import { ISkillManifest } from '../types/skill.js';
import { JWK } from '../types/arweave.js';
import {
  ValidationError,
  AuthorizationError,
  NetworkError,
  ConfigurationError,
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

  // Task 9: Validate directory and SKILL.md
  const skillMdPath = await validateDirectory(directory);

  // Task 10: Parse and validate manifest
  const manifest = await parseAndValidateManifest(skillMdPath);

  // Task 11: Load wallet and check balance
  const wallet = await loadAndCheckWallet(options);

  // Task 12: Create bundle
  const bundleResult = await createBundle(directory);

  logger.debug('Bundle created successfully', {
    size: bundleResult.sizeFormatted,
    fileCount: bundleResult.fileCount,
  });

  // Task 13: Upload bundle to Arweave with progress
  const uploadResult = await uploadBundleWithProgress(
    bundleResult.buffer,
    manifest,
    wallet,
    options
  );

  // Task 14: Register in AO registry and verify response
  const registryMessageId = await registerInAORegistry(
    manifest,
    uploadResult.txId,
    wallet
  );

  // Task 15.1: Get registry response message (validates registration success)
  await getRegistryResponse(registryMessageId);

  // Task 16: Display success message
  displaySuccess({
    skillName: manifest.name,
    version: manifest.version,
    arweaveTxId: uploadResult.txId,
    bundleSize: bundleResult.size,
    uploadCost: uploadResult.cost,
    registryMessageId,
    publishedAt: Date.now(),
  });

  // Return result
  return {
    skillName: manifest.name,
    version: manifest.version,
    arweaveTxId: uploadResult.txId,
    bundleSize: bundleResult.size,
    uploadCost: uploadResult.cost,
    registryMessageId,
    publishedAt: Date.now(),
  };
}

/**
 * Task 9: Validate directory exists and contains SKILL.md
 *
 * @param directory - Directory path to validate
 * @returns Path to SKILL.md file
 * @throws {ValidationError} If directory doesn't exist or SKILL.md missing
 */
async function validateDirectory(directory: string): Promise<string> {
  const spinner = ora('Validating directory...').start();

  try {
    // Check if directory exists
    const dirStat = await fs.stat(directory);
    if (!dirStat.isDirectory()) {
      throw new ValidationError(
        `[ValidationError] Path is not a directory: ${directory}. -> Solution: Provide a valid directory path containing SKILL.md`,
        'directory',
        directory
      );
    }

    // Check for SKILL.md file
    const skillMdPath = path.join(directory, 'SKILL.md');
    try {
      await fs.access(skillMdPath);
    } catch (error) {
      throw new ValidationError(
        `[ValidationError] SKILL.md not found in ${directory}. -> Solution: Create a SKILL.md file with YAML frontmatter. See https://github.com/anthropics/agent-skills for manifest format`,
        'skill.md',
        'missing'
      );
    }

    spinner.succeed('Directory validated successfully');
    return skillMdPath;
  } catch (error: unknown) {
    spinner.fail('Directory validation failed');

    // If error is ENOENT, directory doesn't exist
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      throw new ValidationError(
        `[ValidationError] Directory not found: ${directory}. -> Solution: Ensure the skill directory exists and the path is correct. Run 'skills publish ./my-skill' from the parent directory`,
        'directory',
        directory
      );
    }

    throw error;
  }
}

/**
 * Task 10: Parse and validate SKILL.md manifest
 *
 * @param skillMdPath - Path to SKILL.md file
 * @returns Parsed and validated manifest
 * @throws {ValidationError} If manifest is invalid
 */
async function parseAndValidateManifest(skillMdPath: string): Promise<ISkillManifest> {
  const spinner = ora('Parsing SKILL.md...').start();

  try {
    // Parse manifest from SKILL.md frontmatter
    const manifest = await manifestParser.parse(skillMdPath);

    // Validate against JSON schema
    const validationResult = manifestParser.validate(manifest);
    if (!validationResult.valid) {
      spinner.fail('SKILL.md validation failed');
      throw new ValidationError(
        `[ValidationError] SKILL.md validation failed:\n${validationResult.errors?.join('\n')}. -> Solution: Fix the validation errors in your SKILL.md frontmatter`,
        'manifest',
        validationResult.errors
      );
    }

    spinner.succeed('SKILL.md validated successfully');
    return manifest;
  } catch (error: unknown) {
    spinner.fail('SKILL.md parsing failed');
    throw error;
  }
}

/**
 * Task 11: Load wallet and check balance
 *
 * @param options - Command options with optional wallet path
 * @returns Validated JWK
 * @throws {ConfigurationError} If wallet not found
 * @throws {AuthorizationError} If insufficient balance
 */
async function loadAndCheckWallet(options: IPublishOptions): Promise<JWK> {
  const spinnerLoad = ora('Loading wallet...').start();

  try {
    // Load configuration
    const config = await loadConfig();

    // Resolve wallet path with priority: --wallet flag > .skillsrc > error
    const walletPath = resolveWalletPath(options.wallet, config);
    if (!walletPath) {
      throw new ConfigurationError(
        '[ConfigurationError] Wallet not configured. -> Solution: Provide wallet path with --wallet flag or add "wallet" field to .skillsrc',
        'wallet'
      );
    }

    // Expand tilde in path
    const expandedPath = walletPath.startsWith('~')
      ? path.join(process.env.HOME || '', walletPath.slice(1))
      : walletPath;

    // Load wallet JWK
    const wallet = await walletManager.load(expandedPath);
    spinnerLoad.succeed('Wallet loaded successfully');

    // Check balance - derive address from wallet
    const Arweave = (await import('arweave')).default;
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    });
    const address = await arweave.wallets.jwkToAddress(wallet);

    const spinnerBalance = ora('Checking wallet balance...').start();
    const walletInfo = await walletManager.checkBalance(address);

    if (walletInfo.balance === 0) {
      spinnerBalance.fail('Insufficient wallet balance');
      throw new AuthorizationError(
        `[AuthorizationError] Insufficient funds (0 AR) for transaction. -> Solution: Add funds to wallet address ${walletInfo.address}. Visit https://faucet.arweave.net for testnet AR`,
        walletInfo.address,
        0
      );
    }

    spinnerBalance.succeed(`Wallet balance: ${walletInfo.balanceFormatted}`);
    logger.debug('Wallet info', {
      address: walletInfo.address,
      balance: walletInfo.balance,
    });

    return wallet;
  } catch (error: unknown) {
    spinnerLoad.fail('Wallet loading failed');
    throw error;
  }
}

/**
 * Task 12: Create bundle from skill directory
 *
 * @param directory - Skill directory path
 * @returns Bundle result with buffer and metadata
 * @throws {FileSystemError} If bundle creation fails
 */
async function createBundle(directory: string): Promise<{
  buffer: Buffer;
  size: number;
  sizeFormatted: string;
  fileCount: number;
  exceededLimit: boolean;
}> {
  const spinner = ora('Creating bundle...').start();

  try {
    const bundleResult = await bundler.bundle(directory, {
      compressionLevel: 6,
      onProgress: (progress) => {
        spinner.text = `Creating bundle... (${progress.current}/${progress.total} files)`;
      },
    });

    // Warn if bundle exceeds size limit
    if (bundleResult.exceededLimit) {
      spinner.warn(
        `Bundle size (${bundleResult.sizeFormatted}) exceeds recommended limit (10MB). Upload may be slower and more expensive.`
      );
    } else {
      spinner.succeed(
        `Bundle created: ${bundleResult.sizeFormatted} (${bundleResult.fileCount} files)`
      );
    }

    logger.debug('Bundle created', {
      size: bundleResult.size,
      fileCount: bundleResult.fileCount,
      exceededLimit: bundleResult.exceededLimit,
    });

    return bundleResult;
  } catch (error: unknown) {
    spinner.fail('Bundle creation failed');
    throw error;
  }
}

/**
 * Task 13: Upload bundle to Arweave with progress indicator
 *
 * @param buffer - Bundle buffer
 * @param manifest - Skill manifest
 * @param wallet - Wallet JWK
 * @param options - Command options
 * @returns Upload result with transaction ID
 * @throws {NetworkError} If upload fails
 */
async function uploadBundleWithProgress(
  buffer: Buffer,
  manifest: ISkillManifest,
  wallet: JWK,
  options: IPublishOptions
): Promise<{ txId: string; cost: number }> {
  const spinner = ora('Uploading bundle to Arweave... 0%').start();

  try {
    // Load config for gateway URL
    const config = await loadConfig();
    const gatewayUrl = options.gateway || config.gateway;

    // Upload with progress callback
    const uploadResult = await arweaveClient.uploadBundle(
      buffer,
      {
        skillName: manifest.name,
        skillVersion: manifest.version,
      },
      wallet,
      {
        gatewayUrl,
        progressCallback: (percent: number) => {
          spinner.text = `Uploading bundle to Arweave... ${percent}%`;
        },
      }
    );

    spinner.succeed(`Bundle uploaded: ${uploadResult.txId}`);
    logger.debug('Upload successful', {
      txId: uploadResult.txId,
      cost: uploadResult.cost,
    });

    return uploadResult;
  } catch (error: unknown) {
    spinner.fail('Upload failed');
    throw error;
  }
}

/**
 * Task 14: Register skill in AO registry
 *
 * @param manifest - Skill manifest
 * @param arweaveTxId - Arweave transaction ID
 * @param wallet - Wallet JWK
 * @returns AO message ID for registry registration
 * @throws {NetworkError} If registration fails
 */
async function registerInAORegistry(
  manifest: ISkillManifest,
  arweaveTxId: string,
  wallet: JWK
): Promise<string> {
  const spinner = ora('Registering skill in AO registry...').start();

  try {
    // Derive wallet address for owner field
    const Arweave = (await import('arweave')).default;
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    });
    const ownerAddress = await arweave.wallets.jwkToAddress(wallet);

    // Prepare skill metadata for registry
    const metadata: ISkillMetadata = {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      owner: ownerAddress,
      tags: manifest.tags || [],
      dependencies: manifest.dependencies || [],
      arweaveTxId,
      license: manifest.license,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Register in AO registry
    const messageId = await aoRegistryClient.registerSkill(metadata, wallet);

    spinner.succeed(`Skill registered: ${messageId}`);
    logger.debug('Registry registration successful', { messageId });

    return messageId;
  } catch (error: unknown) {
    spinner.fail('Registry registration failed');
    throw error;
  }
}

/**
 * Task 15.1: Get registry response message
 *
 * @param messageId - AO message ID to read response from
 * @returns Registry response with success/error details
 * @throws {NetworkError} If response indicates registration failure or no response found
 */
async function getRegistryResponse(messageId: string): Promise<{
  success: boolean;
  action: string;
  skillName?: string;
  version?: string;
  error?: string;
}> {
  const spinner = ora('Reading registry response...').start();

  try {
    // Load config to get registry process ID
    const config = await loadConfig();
    if (!config.registry) {
      throw new ConfigurationError(
        '[ConfigurationError] AO registry process ID not configured. -> Solution: Add "registry" field to your .skillsrc file',
        'registry'
      );
    }

    // Import aoconnect for result reading
    const { result } = await import('@permaweb/aoconnect');

    // Read message result directly (no polling needed)
    const response = (await result({
      message: messageId,
      process: config.registry,
    })) as {
      Messages?: Array<{
        Tags?: Array<{ name: string; value: string }>;
      }>;
    };

    // Check if we have a response message
    if (response.Messages && response.Messages.length > 0) {
      const responseMsg = response.Messages[0];
      const action = responseMsg.Tags?.find((t) => t.name === 'Action')?.value;

      if (action === 'Skill-Registered') {
        const name = responseMsg.Tags?.find((t) => t.name === 'Name')?.value;
        const version = responseMsg.Tags?.find((t) => t.name === 'Version')?.value;
        spinner.succeed(
          `Registry confirmed: ${name} v${version} registered successfully`
        );
        return {
          success: true,
          action,
          skillName: name,
          version,
        };
      } else if (action === 'Error') {
        const errorMsg = responseMsg.Tags?.find((t) => t.name === 'Error')?.value;
        spinner.fail(`Registry error: ${errorMsg}`);
        throw new NetworkError(
          `[NetworkError] Skill registration failed: ${errorMsg}. -> Solution: Check your skill metadata and try again`,
          new Error(errorMsg || 'Unknown registry error'),
          'ao-registry',
          'gateway_error'
        );
      }
    }

    // No response message found
    spinner.fail('No response message from registry');
    throw new NetworkError(
      '[NetworkError] Registry did not return a response message. -> Solution: Verify the AO registry process is responding correctly',
      new Error('Empty response'),
      'ao-registry',
      'gateway_error'
    );
  } catch (error: unknown) {
    spinner.fail('Failed to read registry response');
    throw error;
  }
}

/**
 * Task 16: Display success message with all relevant IDs
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
