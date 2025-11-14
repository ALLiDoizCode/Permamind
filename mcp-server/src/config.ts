import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { REGISTRY_CONFIG } from './registry-constants.js';

/**
 * MCP Server configuration interface
 */
export interface IMCPServerConfig {
  seedPhrase?: string; // Optional - CLI will handle wallet fallback
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

/**
 * Load and validate MCP server configuration from environment variables
 * @returns {IMCPServerConfig} Validated configuration object
 *
 * Note: SEED_PHRASE is now optional. If not provided, the CLI will fall back to:
 * 1. Browser wallet (ArConnect/Wander) via local auth server
 * 2. File-based wallet at ~/.arweave/wallet.json
 */
export function loadConfig(): IMCPServerConfig {
  // Load environment variables from .env file
  dotenv.config();

  // SEED_PHRASE is now optional - CLI handles wallet fallback
  const seedPhrase = process.env.SEED_PHRASE?.trim() || undefined;

  // Return configuration with defaults for optional variables
  return {
    seedPhrase,
    // Use shared registry config with environment variable override
    registryProcessId: process.env.REGISTRY_PROCESS_ID || process.env.AO_REGISTRY_PROCESS_ID || REGISTRY_CONFIG.PROCESS_ID,
    installLocation: process.env.INSTALL_LOCATION || path.join(os.homedir(), '.claude', 'skills'),
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
  };
}
