/**
 * Configuration Loader Module
 *
 * Handles loading and parsing of .skillsrc configuration file for CLI settings.
 * Supports both local (./.skillsrc) and global (~/.skillsrc) configuration files.
 *
 * NOTE: The registry process ID is now baked into the package and no longer
 * needs to be configured in .skillsrc. The "registry" field is deprecated.
 *
 * Configuration Format (.skillsrc):
 * ```json
 * {
 *   "wallet": "~/.arweave/wallet.json",
 *   "gateway": "https://arweave.net"
 * }
 * ```
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigurationError, ValidationError } from '../types/errors.js';
import { validateGatewayUrl } from './url-validator.js';

/**
 * Configuration interface for .skillsrc file
 */
export interface Config {
  /** Path to Arweave wallet JWK file */
  wallet?: string;
  /** @deprecated Registry process ID is now baked into the package */
  registry?: string;
  /** Arweave gateway URL */
  gateway?: string;
  /**
   * Custom Turbo gateway URL (Epic 9: Free uploads < 100KB)
   * @default undefined (uses Turbo SDK default gateway)
   * @see docs/prd/epic-9.md
   */
  turboGateway?: string;
  /**
   * Force credit-based uploads instead of free tier (Epic 9)
   * @default false (use free tier for bundles < 100KB)
   * @see docs/prd/epic-9.md
   */
  turboUseCredits?: boolean;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Config = {
  gateway: 'https://arweave.net',
};

/**
 * Load configuration from .skillsrc file and environment variables
 *
 * Priority order:
 * 1. Environment variables (highest priority)
 * 2. Local .skillsrc (current working directory)
 * 3. Global .skillsrc (user home directory)
 * 4. Default configuration (if no config files exist)
 *
 * Environment variables:
 * - TURBO_GATEWAY: Custom Turbo gateway URL
 * - TURBO_USE_CREDITS: Force credit-based uploads (true/false)
 *
 * @param configPath - Optional explicit path to config file
 * @returns Parsed configuration object with defaults and env vars applied
 * @throws {ValidationError} If config file contains malformed JSON or invalid URL
 *
 * @example
 * ```typescript
 * const config = await loadConfig();
 * console.log('Wallet path:', config.wallet);
 * console.log('Turbo gateway:', config.turboGateway);
 * ```
 */
export async function loadConfig(configPath?: string): Promise<Config> {
  let baseConfig: Config;

  // If explicit path provided, use it exclusively
  if (configPath !== undefined && configPath !== '') {
    baseConfig = await loadConfigFromPath(configPath);
  } else {
    // Try local .skillsrc first
    const localConfigPath = path.join(process.cwd(), '.skillsrc');
    try {
      baseConfig = await loadConfigFromPath(localConfigPath);
    } catch (error: unknown) {
      // Local config not found or invalid, try global
      const globalConfigPath = path.join(os.homedir(), '.skillsrc');
      try {
        baseConfig = await loadConfigFromPath(globalConfigPath);
      } catch (error) {
        // Global config not found or invalid, use defaults
        baseConfig = DEFAULT_CONFIG;
      }
    }
  }

  // Apply environment variable overrides (highest priority)
  return applyEnvironmentVariables(baseConfig);
}

/**
 * Apply environment variable overrides to configuration
 *
 * Reads TURBO_GATEWAY and TURBO_USE_CREDITS environment variables
 * and validates them before applying to config.
 *
 * @param config - Base configuration from file or defaults
 * @returns Configuration with environment variable overrides
 * @throws {ValidationError} If TURBO_GATEWAY is invalid URL
 * @private
 */
function applyEnvironmentVariables(config: Config): Config {
  const result = { ...config };

  // TURBO_GATEWAY: Custom gateway URL
  if (process.env.TURBO_GATEWAY) {
    const gatewayUrl = process.env.TURBO_GATEWAY.trim();
    validateGatewayUrl(gatewayUrl, 'TURBO_GATEWAY', 'https://upload.ardrive.io');
    result.turboGateway = gatewayUrl;
  }

  // TURBO_USE_CREDITS: Boolean flag for credit-based uploads
  if (process.env.TURBO_USE_CREDITS) {
    result.turboUseCredits = process.env.TURBO_USE_CREDITS.toLowerCase() === 'true';
  }

  return result;
}

/**
 * Load configuration from a specific file path
 *
 * @param configPath - Path to config file
 * @returns Parsed configuration with defaults applied
 * @throws {ValidationError} If JSON is malformed
 * @private
 */
async function loadConfigFromPath(configPath: string): Promise<Config> {
  // Check if file exists
  try {
    await fs.access(configPath);
  } catch (error) {
    throw new ConfigurationError(
      `Configuration file not found at ${path.basename(configPath)}`,
      'configPath'
    );
  }

  // Read config file
  let fileContent: string;
  try {
    fileContent = await fs.readFile(configPath, 'utf-8');
  } catch (error) {
    throw new ConfigurationError(
      `Failed to read configuration file ${path.basename(configPath)} → Solution: Ensure you have read permissions for the config file`,
      'configPath'
    );
  }

  // Parse JSON
  let config: Partial<Config>;
  try {
    config = JSON.parse(fileContent) as Partial<Config>;
  } catch (error) {
    throw new ValidationError(
      `Configuration file ${path.basename(configPath)} contains malformed JSON → Solution: Ensure .skillsrc is valid JSON`,
      'json',
      'malformed'
    );
  }

  // Merge with defaults
  return {
    ...DEFAULT_CONFIG,
    ...config,
  };
}

/**
 * Resolve wallet path with priority handling
 *
 * Priority order:
 * 1. --wallet flag (explicit CLI argument)
 * 2. .skillsrc config file
 * 3. Prompt user (not implemented here, handled by caller)
 *
 * @param walletFlag - Wallet path from CLI --wallet flag
 * @param config - Loaded configuration object
 * @returns Resolved wallet path, or undefined if not configured
 */
export function resolveWalletPath(
  walletFlag: string | undefined,
  config: Config
): string | undefined {
  // Priority 1: CLI flag (must be truthy and non-empty)
  if (walletFlag !== undefined && walletFlag !== '') {
    return walletFlag;
  }

  // Priority 2: Config file (must be truthy and non-empty)
  if (config.wallet !== undefined && config.wallet !== '') {
    return config.wallet;
  }

  // Priority 3: Not configured (caller should prompt or error)
  return undefined;
}
