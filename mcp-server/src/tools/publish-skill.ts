/**
 * Publish Skill MCP Tool
 *
 * Exposes PublishService functionality as an MCP tool for Claude AI integration.
 * Generates wallet from SEED_PHRASE environment variable and publishes skills
 * to the Agent Skills Registry on Arweave and AO.
 */

import { WalletFactory } from '@permamind/skills-cli/lib/wallet-factory';
import { PublishService } from '@permamind/skills-cli/lib/publish-service';
import {
  ValidationError,
  ConfigurationError,
  AuthorizationError,
  FileSystemError,
  NetworkError,
} from '@permamind/skills-cli/types/errors';
import { logger } from '../logger.js';
import { loadConfig } from '../config.js';
import Arweave from 'arweave';

/**
 * Publish result returned by PublishService
 */
export interface IPublishResult {
  skillName: string;
  version: string;
  arweaveTxId: string;
  bundleSize: number;
  uploadCost: number;
  registryMessageId: string;
  publishedAt: number;
}

/**
 * MCP error response format
 */
export interface IMCPErrorResponse {
  status: 'error';
  errorType: string;
  message: string;
  solution: string;
  details?: Record<string, unknown>;
}

/**
 * MCP success response format
 */
export interface IMCPSuccessResponse {
  status: 'success';
  message: string;
  skillName: string;
  version: string;
  arweaveTxId: string;
  bundleSize: number;
  uploadCost: number;
  registryMessageId: string;
  publishedAt: number;
  viewUrl: string;
}

/**
 * Custom error types for MCP tool
 */
class InvalidMnemonicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMnemonicError';
  }
}

class WalletGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletGenerationError';
  }
}

/**
 * Translate PublishService errors to MCP error responses
 *
 * @param error - Error from PublishService or WalletFactory
 * @returns MCP error response with actionable solution
 */
export function translateError(error: Error): IMCPErrorResponse {
  logger.error('Error during publish:', {
    errorType: error.constructor.name,
    message: error.message,
    stack: error.stack,
  });

  // Redact sensitive data from error messages
  const redactedMessage = redactSensitiveData(error.message);

  if (error instanceof ValidationError) {
    return {
      status: 'error',
      errorType: 'ValidationError',
      message: redactedMessage,
      solution:
        'Fix validation errors in SKILL.md frontmatter. See https://github.com/anthropics/agent-skills for documentation.',
      details: (error as any).details || {},
    };
  }

  if (error instanceof ConfigurationError) {
    return {
      status: 'error',
      errorType: 'ConfigurationError',
      message: redactedMessage,
      solution: 'Set SEED_PHRASE environment variable with a valid 12-word BIP39 mnemonic.',
    };
  }

  if (error instanceof AuthorizationError) {
    return {
      status: 'error',
      errorType: 'AuthorizationError',
      message: redactedMessage,
      solution: 'Add funds to your wallet. Visit https://faucet.arweave.net/ for testnet AR tokens.',
    };
  }

  if (error instanceof FileSystemError) {
    return {
      status: 'error',
      errorType: 'FileSystemError',
      message: redactedMessage,
      solution: 'Check file permissions and ensure the skill directory is accessible.',
    };
  }

  if (error instanceof NetworkError) {
    return {
      status: 'error',
      errorType: 'NetworkError',
      message: redactedMessage,
      solution: 'Check your network connection and try again. Arweave or AO network may be temporarily unavailable.',
    };
  }

  if (error instanceof InvalidMnemonicError) {
    return {
      status: 'error',
      errorType: 'InvalidMnemonicError',
      message: redactedMessage,
      solution: 'Provide a valid 12-word BIP39 mnemonic seed phrase in SEED_PHRASE environment variable.',
    };
  }

  if (error instanceof WalletGenerationError) {
    return {
      status: 'error',
      errorType: 'WalletGenerationError',
      message: redactedMessage,
      solution: 'Check that SEED_PHRASE is a valid BIP39 mnemonic and try again.',
    };
  }

  // Unknown error
  return {
    status: 'error',
    errorType: 'UnknownError',
    message: redactedMessage,
    solution: 'Check the MCP server logs for more details about this error.',
  };
}

/**
 * Redact sensitive data from error messages
 *
 * @param message - Error message that may contain sensitive data
 * @returns Error message with sensitive data redacted
 */
function redactSensitiveData(message: string): string {
  let redacted = message;

  // Redact seed phrases (12 words separated by spaces)
  redacted = redacted.replace(/\b([a-z]{3,}(\s+[a-z]{3,}){11})\b/gi, '[REDACTED_SEED_PHRASE]');

  // Redact private keys (base64-like strings 64+ characters)
  redacted = redacted.replace(/([a-zA-Z0-9+/]{64,})/g, '[REDACTED_PRIVATE_KEY]');

  return redacted;
}

/**
 * Handle publish_skill MCP tool invocation
 *
 * @param directory - Absolute path to skill directory containing SKILL.md
 * @param verbose - Enable verbose debug logging (default: false)
 * @returns Publish result with transaction IDs and metadata
 * @throws Error if publish fails (caller should use translateError)
 */
export async function handlePublishSkill(
  directory: string,
  verbose: boolean = false
): Promise<IPublishResult> {
  logger.info('Starting publish_skill tool', { directory, verbose });

  try {
    // Load configuration
    const config = loadConfig();

    // Generate wallet from seed phrase
    logger.info('Generating wallet from SEED_PHRASE');
    let wallet;
    try {
      wallet = await WalletFactory.fromSeedPhrase(config.seedPhrase);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid mnemonic')) {
        throw new InvalidMnemonicError(`Invalid SEED_PHRASE: ${error.message}`);
      }
      throw new WalletGenerationError(
        `Failed to generate wallet from seed phrase: ${(error as Error).message}`
      );
    }

    // Derive wallet address for logging
    const arweave = Arweave.init({});
    const walletAddress = await arweave.wallets.jwkToAddress(wallet);
    logger.info(`Using wallet address: ${walletAddress}`);

    // Instantiate PublishService
    const publishService = new PublishService();

    // Call publish with wallet and verbose flag
    logger.info('Invoking PublishService.publish', { directory, verbose });
    const result = await publishService.publish(directory, {
      wallet,
      verbose,
    });

    logger.info('Publish successful', {
      skillName: result.skillName,
      version: result.version,
      arweaveTxId: result.arweaveTxId,
    });

    return result;
  } catch (error) {
    logger.error('Publish failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    throw error;
  }
}

/**
 * Format publish result as MCP success response
 *
 * @param result - Publish result from PublishService
 * @returns MCP success response with formatted data
 */
export function formatSuccessResponse(result: IPublishResult): IMCPSuccessResponse {
  return {
    status: 'success',
    message: 'Skill published successfully',
    skillName: result.skillName,
    version: result.version,
    arweaveTxId: result.arweaveTxId,
    bundleSize: result.bundleSize,
    uploadCost: result.uploadCost,
    registryMessageId: result.registryMessageId,
    publishedAt: result.publishedAt,
    viewUrl: `https://viewblock.io/arweave/tx/${result.arweaveTxId}`,
  };
}
