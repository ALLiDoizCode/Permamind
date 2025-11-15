/**
 * Install Service Module
 *
 * Business logic layer for skill installation functionality. Provides UI-agnostic
 * installation capabilities that can be used by both CLI commands and MCP server tools.
 *
 * Responsibilities:
 * - Name@version parsing
 * - Installation location resolution (global/local/custom)
 * - Registry queries with version support
 * - Dependency resolution with circular detection
 * - Bundle downloading with progress tracking
 * - Bundle extraction with force/skip logic
 * - Lock file management (graceful degradation)
 * - Download telemetry recording (fire-and-forget)
 *
 * NOT responsible for:
 * - CLI presentation (spinners, colors, tables)
 * - User input parsing
 * - Process exit codes
 * - Error handling (propagates all errors to caller)
 *
 * Follows PublishService and SearchService patterns from Stories 8.3-8.4
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as aoRegistryClient from '../clients/ao-registry-client.js';
import * as arweaveClient from '../clients/arweave-client.js';
import * as dependencyResolver from '../lib/dependency-resolver.js';
import * as bundler from '../lib/bundler.js';
import * as lockFileManager from '../lib/lock-file-manager.js';
import logger from '../utils/logger.js';
import { ISkillMetadata } from '../types/ao-registry.js';
import { JWK } from '../types/arweave.js';
import { IInstalledSkillRecord } from '../types/lock-file.js';
import { IDependencyNode, IDependencyTree } from '../types/dependency.js';
import {
  ValidationError,
  NetworkError,
  FileSystemError,
} from '../types/errors.js';

/**
 * Options for install operation
 */
export interface IInstallServiceOptions {
  /** Install to ~/.claude/skills/ instead of local ./.claude/skills/ */
  global?: boolean;

  /** Overwrite existing installations without confirmation */
  force?: boolean;

  /** Enable debug logging */
  verbose?: boolean;

  /** Skip lock file generation */
  noLock?: boolean;

  /** Custom install path (overrides global/local) - used by MCP server */
  installLocation?: string;

  /** Progress callback for long-running operations */
  progressCallback?: IInstallProgressCallback;

  /** Optional wallet for download recording (telemetry) */
  wallet?: JWK;
}

/**
 * Result returned from successful install operation
 */
export interface IInstallResult {
  /** Array of installed skill names with versions (e.g., ["ao-basics@1.0.0", "arweave-fundamentals@1.5.0"]) */
  installedSkills: string[];

  /** Total number of dependencies installed (excluding root skill) */
  dependencyCount: number;

  /** Total size in bytes of all installed bundles */
  totalSize: number;

  /** Total installation time in seconds */
  elapsedTime: number;
}

/**
 * Progress callback type
 */
export type IInstallProgressCallback = (event: InstallProgressEvent) => void;

/**
 * Progress event information
 *
 * Emitted at key stages during the install workflow to enable
 * UI-agnostic progress reporting
 */
export interface InstallProgressEvent {
  /** Event type indicating current workflow stage */
  type: 'query-registry' | 'resolve-dependencies' | 'download-bundle' | 'extract-bundle' | 'update-lock-file' | 'complete';

  /** Human-readable message for current stage */
  message: string;

  /** Current item being processed (e.g., "ao-basics@1.0.0") */
  currentItem?: string;

  /** Total number of items to process */
  totalItems?: number;

  /** Current item index (1-based) */
  currentIndex?: number;

  /** Download progress percentage (0-100) */
  percent?: number;
}

/**
 * Internal type for downloaded bundle with metadata
 */
interface IDownloadedBundle {
  /** Dependency node information */
  node: IDependencyNode;

  /** Downloaded bundle buffer */
  buffer: Buffer;

  /** Skill metadata from registry */
  metadata: ISkillMetadata;
}

/**
 * Service class for skill installation business logic
 *
 * Follows PublishService and SearchService patterns from Stories 8.3-8.4:
 * - UI-agnostic (no ora/chalk/cli-table3 dependencies)
 * - Propagates errors (no try-catch at service layer)
 * - Uses logger.debug() for verbose logging
 * - Returns raw data (CLI formats for display)
 * - Progress callbacks for long-running operations
 */
export class InstallService {
  /**
   * Install a skill and its dependencies
   *
   * @param skillNameWithVersion - Skill name with optional version (e.g., "ao-basics" or "ao-basics@1.0.0")
   * @param options - Installation options
   * @returns Installation result with metrics
   * @throws ValidationError if skill not found or circular dependency detected
   * @throws NetworkError if download fails
   * @throws FileSystemError if extraction or permission errors occur
   */
  async install(
    skillNameWithVersion: string,
    options: IInstallServiceOptions = {}
  ): Promise<IInstallResult> {
    // Enable verbose logging if requested
    if (options.verbose) {
      logger.setLevel('debug');
    }

    logger.debug('Starting install workflow', { skillNameWithVersion, options });

    // Clear cache to ensure we get the latest version from registry
    // This prevents stale cached data from being installed
    aoRegistryClient.clearCache();
    logger.debug('Cleared registry cache before install');

    // Track performance
    const startTime = performance.now();

    // Workflow orchestration
    const { skillName, requestedVersion } = this.parseSkillNameVersion(skillNameWithVersion);
    const installLocation = await this.resolveInstallLocation(options);

    this.emitProgress(options, { type: 'query-registry', message: 'Querying registry...' });
    const metadata = await this.querySkill(skillName, requestedVersion);

    // Check for MCP server requirements in skill metadata (Story 13.2)
    if (metadata.mcpServers && metadata.mcpServers.length > 0) {
      if (options.verbose) {
        logger.debug('Loaded mcpServers field', { mcpServers: metadata.mcpServers });
      }

      this.emitProgress(options, {
        type: 'query-registry',
        message: `Note: This skill requires MCP servers: ${metadata.mcpServers.join(', ')}. Install them separately via their installation methods.`
      });
    }

    const dependencyTree = await this.resolveDependencies(skillName, options);

    // Collect filtered MCP servers from dependency tree (Story 13.2)
    const allFilteredMcpServers: string[] = [];
    for (const node of dependencyTree.flatList) {
      if (node.filteredMcpServers && node.filteredMcpServers.length > 0) {
        allFilteredMcpServers.push(...node.filteredMcpServers);
      }
    }

    // Deduplicate MCP server names (same MCP server may appear in multiple skills)
    const uniqueMcpServers = Array.from(new Set(allFilteredMcpServers));

    // Display informational messages for skipped MCP servers
    if (uniqueMcpServers.length > 0) {
      for (const mcpServer of uniqueMcpServers) {
        this.emitProgress(options, {
          type: 'resolve-dependencies',
          message: `Skipping MCP server: ${mcpServer} (must be installed separately)`
        });
      }
    }

    const downloadedBundles = await this.downloadBundles(dependencyTree, options);

    const installedSkills = await this.extractBundles(downloadedBundles, installLocation, options);

    await this.updateLockFile(downloadedBundles, installLocation, options);

    await this.recordDownloadOptional(metadata, options.wallet);

    // Calculate metrics
    const elapsedTime = (performance.now() - startTime) / 1000;
    const dependencyCount = installedSkills.length - 1; // Exclude root skill
    const totalSize = downloadedBundles.reduce((sum, b) => sum + b.buffer.length, 0);

    this.emitProgress(options, { type: 'complete', message: 'Installation complete' });

    logger.debug('Install workflow complete', { installedSkills, dependencyCount, totalSize, elapsedTime });

    return {
      installedSkills,
      dependencyCount,
      totalSize,
      elapsedTime,
    };
  }

  /**
   * Parse skill name and version from name@version format
   *
   * @param skillNameWithVersion - Skill name with optional version (e.g., "ao-basics" or "ao-basics@1.0.0")
   * @returns Parsed skill name and requested version (undefined for latest)
   * @private
   */
  private parseSkillNameVersion(skillNameWithVersion: string): { skillName: string; requestedVersion?: string } {
    const [skillName, requestedVersion] = skillNameWithVersion.includes('@')
      ? skillNameWithVersion.split('@')
      : [skillNameWithVersion, undefined];

    logger.debug('Parsed skill name and version', { skillName, requestedVersion });

    return { skillName, requestedVersion };
  }

  /**
   * Resolve installation location based on options
   *
   * Priority order:
   * 1. options.installLocation (custom path)
   * 2. options.global (global directory)
   * 3. default (local directory)
   *
   * @param options - Installation options
   * @returns Absolute path to installation directory
   * @throws FileSystemError if directory is not writable
   * @private
   */
  private async resolveInstallLocation(options: IInstallServiceOptions): Promise<string> {
    let installLocation: string;

    if (options.installLocation) {
      installLocation = options.installLocation;
    } else if (options.global === true) {
      installLocation = path.join(os.homedir(), '.claude', 'skills');
    } else {
      installLocation = path.join(process.cwd(), '.claude', 'skills');
    }

    logger.debug('Resolved install location', { installLocation, options });

    // Validate directory is writable
    try {
      await fs.mkdir(installLocation, { recursive: true });
      await fs.access(installLocation, fs.constants.W_OK);
    } catch (error) {
      throw new FileSystemError(
        `Permission denied writing to ${installLocation}`,
        `Check directory permissions or use a different installation path`
      );
    }

    return installLocation;
  }

  /**
   * Query registry for skill metadata
   *
   * @param skillName - Skill name to query
   * @param version - Optional version (undefined = latest)
   * @returns Skill metadata from registry
   * @throws ValidationError if skill not found
   * @private
   */
  private async querySkill(skillName: string, version?: string): Promise<ISkillMetadata> {
    logger.debug('Querying skill from registry', { skillName, version });

    const metadataOrNull = await aoRegistryClient.getSkill(skillName, version);

    if (metadataOrNull === null) {
      throw new ValidationError(
        `Skill '${skillName}' not found in registry. Run 'skills search ${skillName}' to find available skills`,
        'skillName',
        skillName
      );
    }

    logger.debug('Skill metadata retrieved', { metadata: metadataOrNull });

    return metadataOrNull;
  }

  /**
   * Resolve dependencies for a skill
   *
   * @param skillName - Root skill name
   * @param options - Installation options
   * @returns Dependency tree with flatList for installation order
   * @throws ValidationError on circular dependency detection
   * @private
   */
  private async resolveDependencies(
    skillName: string,
    options: IInstallServiceOptions
  ): Promise<IDependencyTree> {
    this.emitProgress(options, { type: 'resolve-dependencies', message: 'Resolving dependencies...' });

    logger.debug('Resolving dependencies', { skillName, options });

    const tree = await dependencyResolver.resolve(skillName, {
      maxDepth: 10,
      skipInstalled: options.force !== true,
      verbose: options.verbose === true,
    });

    logger.debug('Dependencies resolved', {
      totalPackages: tree.flatList.length,
      tree,
    });

    return tree;
  }

  /**
   * Download bundles for all dependencies
   *
   * @param dependencyTree - Resolved dependency tree
   * @param options - Installation options
   * @returns Array of downloaded bundles with metadata
   * @throws NetworkError on download failure
   * @private
   */
  private async downloadBundles(
    dependencyTree: IDependencyTree,
    options: IInstallServiceOptions
  ): Promise<IDownloadedBundle[]> {
    const bundlesToDownload = dependencyTree.flatList;
    const downloadedBundles: IDownloadedBundle[] = [];

    for (let i = 0; i < bundlesToDownload.length; i++) {
      const node = bundlesToDownload[i];

      // Query metadata for each dependency
      const skillMetadata = await aoRegistryClient.getSkill(node.name);

      if (!skillMetadata) {
        logger.warn(`Skill metadata not found, skipping: ${node.name}`);
        continue;
      }

      const currentItem = `${node.name}@${node.version}`;
      const totalItems = bundlesToDownload.length;

      this.emitProgress(options, {
        type: 'download-bundle',
        message: `Downloading ${currentItem}`,
        currentItem,
        currentIndex: i + 1,
        totalItems,
      });

      // Download with nested progress callback for percentage
      const progressCallback = (progress: number): void => {
        this.emitProgress(options, {
          type: 'download-bundle',
          message: `Downloading ${currentItem}`,
          currentItem,
          currentIndex: i + 1,
          totalItems,
          percent: progress,
        });
      };

      let buffer: Buffer;
      try {
        buffer = await arweaveClient.downloadBundle(skillMetadata.arweaveTxId, { progressCallback });
      } catch (error) {
        throw new NetworkError(
          `Failed to download bundle from Arweave for ${currentItem}. Check internet connection and retry`,
          error instanceof Error ? error : new Error(String(error)),
          skillMetadata.arweaveTxId
        );
      }

      logger.debug('Bundle downloaded', {
        skillName: node.name,
        version: node.version,
        size: buffer.length,
      });

      downloadedBundles.push({
        node,
        buffer,
        metadata: skillMetadata,
      });
    }

    return downloadedBundles;
  }

  /**
   * Extract bundles to installation directory
   *
   * @param downloadedBundles - Array of downloaded bundles
   * @param installLocation - Installation directory path
   * @param options - Installation options
   * @returns Array of installed skill names with versions
   * @throws FileSystemError on extraction failure
   * @private
   */
  private async extractBundles(
    downloadedBundles: IDownloadedBundle[],
    installLocation: string,
    options: IInstallServiceOptions
  ): Promise<string[]> {
    const installedSkills: string[] = [];

    for (let i = 0; i < downloadedBundles.length; i++) {
      const { node, buffer } = downloadedBundles[i];
      const targetDir = path.join(installLocation, node.name);
      const currentItem = `${node.name}@${node.version}`;

      // Check if already installed
      try {
        await fs.access(path.join(targetDir, 'SKILL.md'));

        if (options.force !== true) {
          logger.debug('Skill already installed, skipping', { skillName: node.name });
          this.emitProgress(options, {
            type: 'extract-bundle',
            message: `Skipping ${currentItem} (already installed)`,
            currentItem,
            currentIndex: i + 1,
            totalItems: downloadedBundles.length,
          });
          continue;
        }
      } catch {
        // Skill not installed, proceed
      }

      this.emitProgress(options, {
        type: 'extract-bundle',
        message: `Installing ${currentItem}`,
        currentItem,
        currentIndex: i + 1,
        totalItems: downloadedBundles.length,
      });

      try {
        await bundler.extract(buffer, {
          targetDir,
          force: options.force === true,
          verbose: options.verbose === true,
        });
      } catch (error) {
        throw new FileSystemError(
          `Failed to extract bundle for ${currentItem}. Check disk space and permissions: ${error instanceof Error ? error.message : String(error)}`,
          targetDir
        );
      }

      logger.debug('Bundle extracted', {
        skillName: node.name,
        version: node.version,
        targetDir,
      });

      installedSkills.push(currentItem);
    }

    return installedSkills;
  }

  /**
   * Update lock file with installed skill records
   *
   * Graceful degradation: warns on error but doesn't fail installation
   *
   * @param downloadedBundles - Array of downloaded bundles
   * @param installLocation - Installation directory path
   * @param options - Installation options
   * @private
   */
  private async updateLockFile(
    downloadedBundles: IDownloadedBundle[],
    installLocation: string,
    options: IInstallServiceOptions
  ): Promise<void> {
    if (options.noLock === true) {
      logger.debug('Skipping lock file update (noLock=true)');
      return;
    }

    this.emitProgress(options, { type: 'update-lock-file', message: 'Updating lock file...' });

    const lockFilePath = lockFileManager.resolveLockFilePath(installLocation);

    for (let i = 0; i < downloadedBundles.length; i++) {
      const { node, metadata } = downloadedBundles[i];
      const targetDir = path.join(installLocation, node.name);

      const installedRecord: IInstalledSkillRecord = {
        name: node.name,
        version: node.version,
        arweaveTxId: metadata.arweaveTxId,
        installedAt: Date.now(),
        installedPath: targetDir,
        dependencies: node.dependencies.map((dep: IDependencyNode) => ({
          name: dep.name,
          version: dep.version,
          arweaveTxId: '',
          installedAt: 0,
          installedPath: '',
          dependencies: [],
          isDirectDependency: false,
        })),
        isDirectDependency: i === downloadedBundles.length - 1, // Last item is root skill
      };

      try {
        await lockFileManager.update(installedRecord, lockFilePath);
        logger.debug('Lock file updated', { skillName: node.name, lockFilePath });
      } catch (error) {
        // Graceful degradation - warn but don't fail installation
        logger.warn(`Failed to update lock file for ${node.name}: ${error instanceof Error ? error.message : String(error)}`);
        this.emitProgress(options, {
          type: 'update-lock-file',
          message: `Warning: Failed to update lock file for ${node.name}@${node.version}`,
        });
      }
    }
  }

  /**
   * Record download telemetry (fire-and-forget)
   *
   * Non-critical feature - silently ignores errors
   *
   * @param metadata - Skill metadata
   * @param wallet - Optional wallet for telemetry
   * @private
   */
  private async recordDownloadOptional(metadata: ISkillMetadata, wallet?: JWK): Promise<void> {
    if (!wallet) {
      logger.debug('Skipping download recording (no wallet provided)');
      return;
    }

    try {
      await aoRegistryClient.recordDownload(metadata.name, metadata.version, wallet);
      logger.debug('Download recorded', { name: metadata.name, version: metadata.version });
    } catch (error) {
      // Silently ignore - non-critical telemetry feature
      logger.debug('Failed to record download (non-critical)', { error });
    }
  }

  /**
   * Emit progress event via callback
   *
   * @param options - Installation options
   * @param event - Progress event to emit
   * @private
   */
  private emitProgress(options: IInstallServiceOptions, event: InstallProgressEvent): void {
    if (options.progressCallback) {
      options.progressCallback(event);
    }
  }
}
