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
import * as manifestParser from '../parsers/manifest-parser.js';
import * as bundler from '../lib/bundler.js';
import * as arweaveClient from '../clients/arweave-client.js';
import * as aoRegistryClient from '../clients/ao-registry-client.js';
import * as skillAnalyzer from '../lib/skill-analyzer.js';
import logger from '../utils/logger.js';
import { ISkillMetadata } from '../types/ao-registry.js';
import { ISkillManifest } from '../types/skill.js';
import { JWK } from '../types/arweave.js';
import { IWalletProvider } from '../types/wallet.js';
import {
  ValidationError,
  ConfigurationError,
} from '../types/errors.js';

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
 * Supports three wallet input methods with priority order:
 * 1. walletProvider (recommended - supports all wallet types)
 * 2. wallet (deprecated - JWK only, backward compatibility)
 * 3. walletPath (deprecated - file wallet, backward compatibility)
 */
export interface IPublishServiceOptions {
  /**
   * Pre-loaded wallet provider (optional)
   *
   * Recommended: Use this with wallet-manager.load() for unified wallet support.
   * Supports all wallet types: seed phrase, browser wallet, file wallet.
   * Takes precedence over wallet and walletPath if provided.
   *
   * @example
   * ```typescript
   * const provider = await walletManager.load(); // SEED_PHRASE or browser
   * await publishService.publish(directory, { walletProvider: provider });
   * ```
   */
  walletProvider?: IWalletProvider;

  /**
   * Pre-loaded wallet JWK (optional)
   *
   * @deprecated Use walletProvider instead for browser wallet support.
   * Used by legacy code when wallet is already loaded as JWK.
   * Takes precedence over walletPath if both provided.
   */
  wallet?: JWK;

  /**
   * Path to wallet JSON file (optional)
   *
   * @deprecated Use walletProvider with wallet-manager.load(walletPath) instead.
   * Used by CLI to load wallet from filesystem.
   * Ignored if wallet or walletProvider is provided.
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

    // Log sanitized options (exclude walletProvider to avoid circular refs)
    logger.debug('Starting publish workflow', {
      directory,
      verbose: options.verbose,
      gatewayUrl: options.gatewayUrl,
      hasWalletProvider: !!options.walletProvider,
      hasWallet: !!options.wallet,
      hasWalletPath: !!options.walletPath,
    });

    // Workflow orchestration
    const skillMdPath = await this.validateDirectory(
      directory,
      options.progressCallback
    );
    const manifest = await this.parseAndValidateManifest(
      skillMdPath,
      options.progressCallback
    );
    const walletProvider = await this.loadWalletProvider(options);
    const bundleResult = await this.createBundle(
      directory,
      options.progressCallback
    );
    const uploadResult = await this.uploadBundle(
      bundleResult.buffer,
      manifest,
      walletProvider,
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
      walletProvider,
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

    // Check for MCP servers in dependencies (Story 13.1)
    const mcpDepsInDependencies = manifestParser.detectMcpInDependencies(manifest);
    if (mcpDepsInDependencies.length > 0) {
      logger.warn('\n⚠ Warning: MCP server references detected in dependencies field\n');
      logger.warn('The following MCP servers should be documented in the \'mcpServers\' field instead:');
      mcpDepsInDependencies.forEach((dep) => logger.warn(`  - ${dep}`));
      logger.warn('\nSolution: Move these to \'mcpServers\' field in SKILL.md frontmatter:\n');
      logger.warn('---');
      logger.warn('name: my-skill');
      logger.warn('version: 1.0.0');
      logger.warn('dependencies: []  # Remove MCP servers from here');
      logger.warn('mcpServers:');
      mcpDepsInDependencies.forEach((dep) => logger.warn(`  - ${dep}`));
      logger.warn('---\n');
      logger.warn('Note: This skill will still publish successfully. MCP servers in dependencies will be skipped during installation.\n');
    }

    return manifest;
  }

  /**
   * Load wallet provider without balance check
   *
   * Priority: options.walletProvider > options.wallet > options.walletPath
   *
   * Story 11.6: Refactored to return IWalletProvider instead of JWK
   * - Supports all wallet types: seed phrase, file, browser wallet
   * - Browser wallets can now publish via dispatch() API
   * - Legacy wallet/walletPath wrapped in providers for backward compatibility
   *
   * @param options - Publish options with walletProvider, wallet, or walletPath
   * @returns Wallet provider instance
   * @throws {ConfigurationError} If no wallet provided
   * @private
   */
  private async loadWalletProvider(
    options: IPublishServiceOptions
  ): Promise<IWalletProvider> {
    options.progressCallback?.({
      type: 'validating',
      message: 'Loading wallet...',
    });

    // Priority: walletProvider > wallet > walletPath
    let walletProvider: IWalletProvider;

    // Priority 1: walletProvider (recommended - supports all wallet types)
    if (options.walletProvider) {
      logger.debug('Using wallet provider', {
        source: options.walletProvider.getSource().source
      });
      walletProvider = options.walletProvider;
    }
    // Priority 2: wallet (JWK - backward compatibility, wrap in SeedPhraseWalletProvider)
    else if (options.wallet) {
      logger.warn('Using deprecated wallet option. Migrate to walletProvider for browser wallet support.');
      logger.debug('Using pre-loaded wallet (backward compatibility)');

      // Wrap JWK in SeedPhraseWalletProvider for consistent interface
      const { SeedPhraseWalletProvider } = await import('../lib/wallet-providers/seed-phrase-provider.js');
      walletProvider = new SeedPhraseWalletProvider(options.wallet, ''); // Empty mnemonic for JWK-only provider
    }
    // Priority 3: walletPath (load as FileWalletProvider - backward compatibility)
    else if (options.walletPath) {
      logger.warn('Using deprecated walletPath option. Migrate to walletProvider with wallet-manager.load().');
      logger.debug('Loaded wallet from file (backward compatibility)', { path: options.walletPath });

      // Use FileWalletProvider
      const { FileWalletProvider } = await import('../lib/wallet-providers/file-wallet-provider.js');
      const jwk = await import('../lib/wallet-manager.js').then(m => m.loadFromFile(options.walletPath!));
      walletProvider = new FileWalletProvider(jwk, options.walletPath);
    }
    // No wallet provided
    else {
      throw new ConfigurationError(
        '[ConfigurationError] No wallet provided → Solution: Provide walletProvider, wallet, or walletPath option',
        'wallet'
      );
    }

    // Epic 9: Balance check removed from here
    // Balance check now happens in ArweaveClient.uploadBundleWithArweaveSDK()
    // ONLY when bundle ≥ 100KB (Arweave SDK path)
    // Bundles < 100KB use Turbo SDK free tier (no balance check needed)

    // Log wallet address for debugging
    const address = await walletProvider.getAddress();
    logger.debug('Wallet provider loaded successfully', {
      address: address,
      source: walletProvider.getSource().source,
      note: 'Balance check deferred to upload stage (only for bundles ≥ 100KB)'
    });

    return walletProvider;
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
   * Story 11.6: Updated to accept IWalletProvider instead of JWK
   * Supports all wallet types: seed phrase, file, browser wallet
   *
   * @param buffer - Bundle buffer
   * @param manifest - Skill manifest
   * @param walletProvider - Wallet provider instance
   * @param gatewayUrl - Custom gateway URL (optional)
   * @param callback - Progress callback (optional)
   * @returns Upload result with transaction ID and cost
   * @throws {NetworkError} If upload fails
   * @private
   */
  private async uploadBundle(
    buffer: Buffer,
    manifest: ISkillManifest,
    walletProvider: IWalletProvider,
    gatewayUrl: string | undefined,
    callback?: IProgressCallback
  ): Promise<{ txId: string; cost: number }> {
    callback?.({
      type: 'uploading',
      message: 'Uploading bundle to Arweave... 0%',
      percent: 0,
    });

    // Upload with progress callback (arweaveClient handles wallet type routing)
    const uploadResult = await arweaveClient.uploadBundle(
      buffer,
      {
        skillName: manifest.name,
        skillVersion: manifest.version,
      },
      walletProvider,
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
   * Story 11.6: Updated to accept IWalletProvider, extracts JWK for AO registry
   * (AO registry currently requires JWK for signing)
   *
   * @param manifest - Skill manifest
   * @param arweaveTxId - Arweave transaction ID
   * @param walletProvider - Wallet provider instance
   * @param bundledFiles - Analyzed bundled files metadata
   * @param callback - Progress callback (optional)
   * @returns AO message ID for registry registration
   * @throws {NetworkError} If registration fails
   * @throws {ConfigurationError} If browser wallet used (JWK not available)
   * @private
   */
  private async registerInAORegistry(
    manifest: ISkillManifest,
    arweaveTxId: string,
    walletProvider: IWalletProvider,
    bundledFiles: skillAnalyzer.BundledFile[],
    callback?: IProgressCallback
  ): Promise<string> {
    callback?.({
      type: 'registering',
      message: 'Checking if skill exists...',
    });

    // Story 11.6: No longer need to extract JWK - use wallet provider directly
    // createDataItemSigner() supports all wallet types including browser wallets
    logger.debug('Using wallet provider for AO registry signing');

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
    const ownerAddress = await walletProvider.getAddress();

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
      messageId = await aoRegistryClient.updateSkill(metadata, walletProvider);
      logger.debug('Registry update successful', { messageId });
    } else {
      callback?.({
        type: 'registering',
        message: 'Registering skill in AO registry...',
      });
      messageId = await aoRegistryClient.registerSkill(metadata, walletProvider);
      logger.debug('Registry registration successful', { messageId });
    }

    return messageId;
  }
}
