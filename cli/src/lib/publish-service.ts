/**
 * Publish Service Module
 *
 * Provides core business logic for publishing skills to Arweave and registering
 * them in the AO registry. This service is UI-agnostic and can be used by both
 * CLI commands and MCP server tools.
 *
 * Key Features:
 * - Directory validation and manifest parsing
 * - Wallet loading with balance checking
 * - Bundle creation and Arweave upload
 * - AO registry registration (Register-Skill or Update-Skill)
 * - Progress reporting via callback pattern
 * - Error propagation (no error handling at service layer)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as manifestParser from '../parsers/manifest-parser';
import * as bundler from '../lib/bundler';
import * as walletManager from '../lib/wallet-manager';
import * as arweaveClient from '../clients/arweave-client';
import * as aoRegistryClient from '../clients/ao-registry-client';
import * as skillAnalyzer from '../lib/skill-analyzer';
import logger from '../utils/logger';
import { ISkillMetadata } from '../types/ao-registry';
import { ISkillManifest } from '../types/skill';
import { JWK } from '../types/arweave';
import {
  ValidationError,
  ConfigurationError,
} from '../types/errors';

/**
 * Progress event types for publish workflow stages
 */
export type ProgressEventType =
  | 'validating'
  | 'parsing'
  | 'bundling'
  | 'uploading'
  | 'registering'
  | 'complete';

/**
 * Progress event information
 *
 * Emitted at key stages during the publish workflow to enable
 * UI-agnostic progress reporting
 */
export interface ProgressEvent {
  /** Event type indicating current workflow stage */
  type: ProgressEventType;

  /** Human-readable message describing current operation */
  message: string;

  /** Optional completion percentage (0-100) for long-running operations */
  percent?: number;

  /** Optional metadata for debugging or detailed progress display */
  metadata?: Record<string, unknown>;
}

/**
 * Progress callback type
 *
 * Invoked at key workflow stages to report progress. Callbacks are optional
 * and the service operates correctly without them.
 *
 * @example
 * ```typescript
 * const progressCallback: IProgressCallback = (event: ProgressEvent) => {
 *   console.log(`[${event.type}] ${event.message}`);
 *   if (event.percent !== undefined) {
 *     console.log(`Progress: ${event.percent}%`);
 *   }
 * };
 * ```
 */
export type IProgressCallback = (event: ProgressEvent) => void;

/**
 * Options for publish operation
 *
 * Supports both CLI usage (walletPath) and MCP server usage (wallet).
 * Wallet and walletPath are mutually exclusive - wallet takes precedence.
 */
export interface IPublishServiceOptions {
  /**
   * Pre-loaded wallet JWK (optional)
   *
   * Used by MCP server when wallet is already loaded
   * Takes precedence over walletPath if both provided
   */
  wallet?: JWK;

  /**
   * Path to wallet JSON file (optional)
   *
   * Used by CLI to load wallet from filesystem
   * Ignored if wallet is provided
   */
  walletPath?: string;

  /** Enable verbose debug logging (optional, default: false) */
  verbose?: boolean;

  /** Custom Arweave gateway URL (optional, overrides config) */
  gatewayUrl?: string;

  /** Progress callback for UI updates (optional) */
  progressCallback?: IProgressCallback;
}

/**
 * Result of successful publish operation
 *
 * Contains all transaction IDs, metadata, and cost information
 */
export interface IPublishResult {
  /** Name of published skill */
  skillName: string;

  /** Version published */
  version: string;

  /** Arweave transaction ID */
  arweaveTxId: string;

  /** Bundle size in bytes */
  bundleSize: number;

  /** Upload cost in winston */
  uploadCost: number;

  /** AO registry message ID */
  registryMessageId: string;

  /** Timestamp of publication */
  publishedAt: number;
}

/**
 * Publish Service Class
 *
 * Provides core business logic for publishing skills to Arweave and
 * registering them in the AO registry. This service is UI-agnostic
 * and can be used by both CLI commands and MCP server tools.
 *
 * @example
 * ```typescript
 * // CLI usage
 * const service = new PublishService();
 * const result = await service.publish('./my-skill', {
 *   walletPath: '~/wallet.json',
 *   verbose: true,
 *   progressCallback: (event) => console.log(event.message)
 * });
 *
 * // MCP server usage
 * const result = await service.publish('./my-skill', {
 *   wallet: preloadedJwk,
 *   gatewayUrl: 'https://g8way.io',
 *   progressCallback: (event) => updateMcpStatus(event)
 * });
 * ```
 */
export class PublishService {
  /**
   * Publish a skill to Arweave and register in AO registry
   *
   * Complete workflow:
   * 1. Validate directory and SKILL.md
   * 2. Parse and validate manifest
   * 3. Load wallet (balance check deferred to upload stage)
   * 4. Create bundle
   * 5. Upload to Arweave (< 100KB: Turbo SDK FREE, ≥ 100KB: Arweave SDK with balance check)
   * 6. Analyze skill files
   * 7. Register in AO registry
   *
   * @param directory - Absolute path to skill directory containing SKILL.md
   * @param options - Publish options (wallet, gateway, progress callback)
   * @returns Publish result with transaction IDs and metadata
   * @throws {ValidationError} If directory invalid or manifest invalid
   * @throws {ConfigurationError} If wallet not configured
   * @throws {AuthorizationError} If insufficient balance for large bundles (≥ 100KB)
   * @throws {FileSystemError} If bundle creation fails
   * @throws {NetworkError} If upload or registration fails
   */
  async publish(
    directory: string,
    options: IPublishServiceOptions
  ): Promise<IPublishResult> {
    // Enable verbose logging if requested
    if (options.verbose) {
      logger.setLevel('debug');
    }

    logger.debug('Starting publish workflow', { directory, options });

    // Workflow orchestration
    const skillMdPath = await this.validateDirectory(
      directory,
      options.progressCallback
    );
    const manifest = await this.parseAndValidateManifest(
      skillMdPath,
      options.progressCallback
    );
    const wallet = await this.loadWallet(options);
    const bundleResult = await this.createBundle(
      directory,
      options.progressCallback
    );
    const uploadResult = await this.uploadBundle(
      bundleResult.buffer,
      manifest,
      wallet,
      options.gatewayUrl,
      options.progressCallback
    );
    const bundledFiles = await this.analyzeSkillFiles(
      directory,
      options.progressCallback
    );
    const registryMessageId = await this.registerInAORegistry(
      manifest,
      uploadResult.txId,
      wallet,
      bundledFiles,
      options.progressCallback
    );

    // Invoke completion callback
    options.progressCallback?.({
      type: 'complete',
      message: 'Publish complete',
    });

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
   * Validate directory exists and contains SKILL.md
   *
   * @param directory - Directory path to validate
   * @param callback - Progress callback (optional)
   * @returns Path to SKILL.md file
   * @throws {ValidationError} If directory doesn't exist or SKILL.md missing
   * @private
   */
  private async validateDirectory(
    directory: string,
    callback?: IProgressCallback
  ): Promise<string> {
    callback?.({
      type: 'validating',
      message: 'Validating directory...',
    });

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

    return skillMdPath;
  }

  /**
   * Parse and validate SKILL.md manifest
   *
   * @param skillMdPath - Path to SKILL.md file
   * @param callback - Progress callback (optional)
   * @returns Parsed and validated manifest
   * @throws {ValidationError} If manifest is invalid
   * @private
   */
  private async parseAndValidateManifest(
    skillMdPath: string,
    callback?: IProgressCallback
  ): Promise<ISkillManifest> {
    callback?.({
      type: 'parsing',
      message: 'Parsing SKILL.md...',
    });

    // Parse manifest from SKILL.md frontmatter
    const manifest = await manifestParser.parse(skillMdPath);

    // Validate against JSON schema
    const validationResult = manifestParser.validate(manifest);
    if (!validationResult.valid) {
      throw new ValidationError(
        `[ValidationError] SKILL.md validation failed:\n${validationResult.errors?.join('\n')}. -> Solution: Fix the validation errors in your SKILL.md frontmatter`,
        'manifest',
        validationResult.errors
      );
    }

    return manifest;
  }

  /**
   * Load wallet without balance check
   *
   * Priority: options.wallet (pre-loaded) > options.walletPath (load from file)
   *
   * Epic 9: Balance check removed - now handled by ArweaveClient only when needed
   * (i.e., for bundles ≥ 100KB that use Arweave SDK, not Turbo SDK free tier)
   *
   * @param options - Publish options with wallet or walletPath
   * @returns Validated JWK
   * @throws {ConfigurationError} If neither wallet nor walletPath provided
   * @private
   */
  private async loadWallet(
    options: IPublishServiceOptions
  ): Promise<JWK> {
    options.progressCallback?.({
      type: 'validating',
      message: 'Loading wallet...',
    });

    // Priority: wallet > walletPath
    let wallet: JWK;
    if (options.wallet) {
      // Use pre-loaded wallet (MCP server usage)
      wallet = options.wallet;
      logger.debug('Using pre-loaded wallet');
    } else if (options.walletPath) {
      // Load wallet from file (CLI usage)
      wallet = await walletManager.load(options.walletPath);
      logger.debug('Loaded wallet from file', { path: options.walletPath });
    } else {
      // No wallet configured
      throw new ConfigurationError(
        '[ConfigurationError] Wallet not configured. -> Solution: Provide wallet with --wallet flag or SEED_PHRASE environment variable',
        'wallet'
      );
    }

    // Epic 9: Balance check removed from here
    // Balance check now happens in ArweaveClient.uploadBundleWithArweaveSDK()
    // ONLY when bundle ≥ 100KB (Arweave SDK path)
    // Bundles < 100KB use Turbo SDK free tier (no balance check needed)

    // Log wallet address for debugging
    const Arweave = (await import('arweave')).default;
    const arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https',
    });
    const address = await arweave.wallets.jwkToAddress(wallet);

    logger.debug('Wallet loaded successfully', {
      address: address,
      note: 'Balance check deferred to upload stage (only for bundles ≥ 100KB)'
    });

    return wallet;
  }

  /**
   * Create bundle from skill directory
   *
   * @param directory - Skill directory path
   * @param callback - Progress callback (optional)
   * @returns Bundle result with buffer and metadata
   * @throws {FileSystemError} If bundle creation fails
   * @private
   */
  private async createBundle(
    directory: string,
    callback?: IProgressCallback
  ): Promise<{
    buffer: Buffer;
    size: number;
    sizeFormatted: string;
    fileCount: number;
    exceededLimit: boolean;
  }> {
    callback?.({
      type: 'bundling',
      message: 'Creating bundle...',
    });

    const bundleResult = await bundler.bundle(directory, {
      compressionLevel: 6,
      onProgress: (progress) => {
        callback?.({
          type: 'bundling',
          message: `Creating bundle... (${progress.current}/${progress.total} files)`,
          metadata: { ...progress },
        });
      },
    });

    logger.debug('Bundle created', {
      size: bundleResult.size,
      fileCount: bundleResult.fileCount,
      exceededLimit: bundleResult.exceededLimit,
    });

    return bundleResult;
  }

  /**
   * Upload bundle to Arweave with progress tracking
   *
   * @param buffer - Bundle buffer
   * @param manifest - Skill manifest
   * @param wallet - Wallet JWK
   * @param gatewayUrl - Custom gateway URL (optional)
   * @param callback - Progress callback (optional)
   * @returns Upload result with transaction ID and cost
   * @throws {NetworkError} If upload fails
   * @private
   */
  private async uploadBundle(
    buffer: Buffer,
    manifest: ISkillManifest,
    wallet: JWK,
    gatewayUrl: string | undefined,
    callback?: IProgressCallback
  ): Promise<{ txId: string; cost: number }> {
    callback?.({
      type: 'uploading',
      message: 'Uploading bundle to Arweave... 0%',
      percent: 0,
    });

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
          callback?.({
            type: 'uploading',
            message: `Uploading bundle to Arweave... ${percent}%`,
            percent,
          });
        },
      }
    );

    logger.debug('Upload successful', {
      txId: uploadResult.txId,
      cost: uploadResult.cost,
    });

    return uploadResult;
  }

  /**
   * Analyze skill directory for bundled files metadata
   *
   * @param directory - Skill directory path
   * @param callback - Progress callback (optional)
   * @returns Array of bundled file metadata
   * @throws {FileSystemError} If analysis fails
   * @private
   */
  private async analyzeSkillFiles(
    directory: string,
    callback?: IProgressCallback
  ): Promise<skillAnalyzer.BundledFile[]> {
    callback?.({
      type: 'registering',
      message: 'Analyzing skill files...',
    });

    const bundledFiles = await skillAnalyzer.analyzeSkillDirectory(directory);
    const totalSize = bundledFiles.reduce((sum, file) => {
      const sizeMatch = file.size.match(/^([\d.]+)\s*KB$/i);
      return sum + (sizeMatch ? parseFloat(sizeMatch[1]) : 0);
    }, 0);

    logger.debug('Skill files analyzed', {
      fileCount: bundledFiles.length,
      totalSize,
      files: bundledFiles.map((f) => f.name),
    });

    return bundledFiles;
  }

  /**
   * Register skill in AO registry
   *
   * Checks if skill exists and uses Update-Skill or Register-Skill accordingly
   *
   * @param manifest - Skill manifest
   * @param arweaveTxId - Arweave transaction ID
   * @param wallet - Wallet JWK
   * @param bundledFiles - Analyzed bundled files metadata
   * @param callback - Progress callback (optional)
   * @returns AO message ID for registry registration
   * @throws {NetworkError} If registration fails
   * @private
   */
  private async registerInAORegistry(
    manifest: ISkillManifest,
    arweaveTxId: string,
    wallet: JWK,
    bundledFiles: skillAnalyzer.BundledFile[],
    callback?: IProgressCallback
  ): Promise<string> {
    callback?.({
      type: 'registering',
      message: 'Checking if skill exists...',
    });

    // Check if skill already exists in registry
    let existingSkill: ISkillMetadata | null = null;
    try {
      const foundSkill = await aoRegistryClient.getSkill(manifest.name);
      if (foundSkill) {
        logger.debug('Found existing skill', {
          name: manifest.name,
          version: foundSkill.version,
        });
        existingSkill = foundSkill;
      } else {
        logger.debug('Skill does not exist, will register as new');
        existingSkill = null;
      }
    } catch {
      // Skill doesn't exist, will register as new
      logger.debug('Skill does not exist, will register as new');
      existingSkill = null;
    }

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
      bundledFiles,
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Use Update-Skill if skill exists, otherwise Register-Skill
    let messageId: string;
    if (existingSkill) {
      callback?.({
        type: 'registering',
        message: 'Updating skill in AO registry...',
      });
      messageId = await aoRegistryClient.updateSkill(metadata, wallet);
      logger.debug('Registry update successful', { messageId });
    } else {
      callback?.({
        type: 'registering',
        message: 'Registering skill in AO registry...',
      });
      messageId = await aoRegistryClient.registerSkill(metadata, wallet);
      logger.debug('Registry registration successful', { messageId });
    }

    return messageId;
  }
}
