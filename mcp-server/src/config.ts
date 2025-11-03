import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

/**
 * MCP Server configuration interface
 */
export interface IMCPServerConfig {
  seedPhrase: string;
  registryProcessId: string;
  installLocation: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Error class for missing environment variables
 */
export class MissingEnvironmentVariableError extends Error {
  constructor(message: string, public readonly solution: string) {
    super(message);
    this.name = 'MissingEnvironmentVariableError';
  }
}

// Default registry process ID (mainnet)
const DEFAULT_REGISTRY_PROCESS_ID = 'your_mainnet_registry_process_id';

/**
 * Load and validate MCP server configuration from environment variables
 * @throws {MissingEnvironmentVariableError} if SEED_PHRASE is not provided
 * @returns {IMCPServerConfig} Validated configuration object
 */
export function loadConfig(): IMCPServerConfig {
  // Load environment variables from .env file
  dotenv.config();

  // Validate required environment variables
  if (!process.env.SEED_PHRASE) {
    throw new MissingEnvironmentVariableError(
      'SEED_PHRASE environment variable is required',
      'Add SEED_PHRASE to .env file or set as environment variable. Generate with: npx bip39-cli generate --words 12'
    );
  }

  // Return configuration with defaults for optional variables
  return {
    seedPhrase: process.env.SEED_PHRASE,
    registryProcessId: process.env.REGISTRY_PROCESS_ID || DEFAULT_REGISTRY_PROCESS_ID,
    installLocation: process.env.INSTALL_LOCATION || path.join(os.homedir(), '.claude', 'skills'),
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  };
}
