/**
 * Configuration Loader Module
 *
 * Handles loading and parsing of .skillsrc configuration file for CLI settings.
 * Supports both local (./.skillsrc) and global (~/.skillsrc) configuration files.
 *
 * Configuration Format (.skillsrc):
 * ```json
 * {
 *   "wallet": "~/.arweave/wallet.json",
 *   "registry": "REGISTRY_PROCESS_ID",
 *   "gateway": "https://arweave.net"
 * }
 * ```
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigurationError, ValidationError } from '../types/errors.js';

/**
 * Configuration interface for .skillsrc file
 */
export interface Config {
  /** Path to Arweave wallet JWK file */
  wallet?: string;
  /** AO registry process ID */
  registry?: string;
  /** Arweave gateway URL */
  gateway?: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Config = {
  gateway: 'https://arweave.net',
};

/**
 * Load configuration from .skillsrc file
 *
 * Priority order:
 * 1. Local .skillsrc (current working directory)
 * 2. Global .skillsrc (user home directory)
 * 3. Default configuration (if no config files exist)
 *
 * @param configPath - Optional explicit path to config file
 * @returns Parsed configuration object with defaults applied
 * @throws {ValidationError} If config file contains malformed JSON
 *
 * @example
 * ```typescript
 * const config = await loadConfig();
 * console.log('Wallet path:', config.wallet);
 * ```
 */
export async function loadConfig(configPath?: string): Promise<Config> {
  // If explicit path provided, use it exclusively
  if (configPath !== undefined && configPath !== '') {
    return await loadConfigFromPath(configPath);
  }

  // Try local .skillsrc first
  const localConfigPath = path.join(process.cwd(), '.skillsrc');
  try {
    return await loadConfigFromPath(localConfigPath);
  } catch (error: unknown) {
    // Local config not found or invalid, try global
  }

  // Try global .skillsrc (~/.skillsrc)
  const globalConfigPath = path.join(os.homedir(), '.skillsrc');
  try {
    return await loadConfigFromPath(globalConfigPath);
  } catch (error) {
    // Global config not found or invalid, use defaults
  }

  // No config file found, return defaults
  return DEFAULT_CONFIG;
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
