/**
 * Arweave Client Module
 *
 * Handles bundle uploads to Arweave network with transaction creation,
 * progress tracking, confirmation polling, and retry logic for network failures.
 *
 * This module provides the primary interface for uploading skill bundles to
 * permanent storage on the Arweave blockchain.
 */

import Arweave from 'arweave';
import { loadConfig } from '../lib/config-loader.js';
import logger from '../utils/logger.js';
import {
  IBundleMetadata,
  IUploadOptions,
  IUploadResult,
  TransactionStatus,
  JWK,
  ITag,
} from '../types/arweave.js';
import {
  NetworkError,
  AuthorizationError,
  ValidationError,
} from '../types/errors.js';

/**
 * Constants for Arweave operations
 */
const DEFAULT_GATEWAY = 'https://arweave.net';
const UPLOAD_TIMEOUT_MS = 60000; // 60 seconds
const POLL_INTERVAL_MS = 30000; // 30 seconds
const CONFIRMATION_TIMEOUT_MS = 300000; // 5 minutes
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000; // 1 second
const WINSTON_PER_AR = 1_000_000_000_000;

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param shouldRetry - Predicate to determine if error is retryable
 * @param maxAttempts - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Result from successful function execution
 * @throws Last error if all attempts fail or if error is not retryable
 * @private
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  baseDelay: number = BASE_RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error('All retry attempts failed');
}

/**
 * Determine if error is a retryable network error
 *
 * Retryable errors: ETIMEDOUT, ECONNRESET, ENOTFOUND, 502, 503
 * Non-retryable errors: AuthorizationError, ValidationError
 *
 * @param error - Error to check
 * @returns True if error should be retried
 * @private
 */
function isRetryableError(error: Error): boolean {
  // Never retry authorization or validation errors
  if (error instanceof AuthorizationError || error instanceof ValidationError) {
    return false;
  }

  // Check for network timeout errors
  const errorMessage = error.message.toLowerCase();
  const errorCode = (error as NodeJS.ErrnoException).code;

  // Retryable network errors
  const retryableErrorCodes = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND'];
  if (errorCode && retryableErrorCodes.includes(errorCode)) {
    return true;
  }

  // Retryable HTTP status codes (gateway errors)
  if (errorMessage.includes('502') || errorMessage.includes('503')) {
    return true;
  }

  return false;
}

/**
 * Validate gateway URL format
 *
 * @param url - Gateway URL to validate
 * @throws {ValidationError} If URL is not HTTPS
 * @private
 */
function validateGatewayUrl(url: string): void {
  if (!url.startsWith('https://')) {
    throw new ValidationError(
      `Gateway URL must use HTTPS for security → Solution: Use an HTTPS gateway URL (e.g., https://arweave.net)`,
      'gateway',
      url
    );
  }
}

/**
 * Initialize Arweave client with gateway URL
 *
 * @param gatewayUrl - Gateway URL (must be HTTPS)
 * @returns Configured Arweave client instance
 * @private
 */
function initializeArweaveClient(gatewayUrl: string): Arweave {
  validateGatewayUrl(gatewayUrl);

  // Parse gateway URL
  const url = new URL(gatewayUrl);

  return Arweave.init({
    host: url.hostname,
    port: url.port || 443,
    protocol: url.protocol.replace(':', ''),
  });
}

/**
 * Truncate Arweave address for display
 *
 * @param address - Full Arweave address
 * @returns Truncated address (first 6 + last 6 chars)
 * @private
 */
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

/**
 * Format winston to AR
 *
 * @param winston - Amount in winston
 * @returns Formatted AR string (e.g., "0.001 AR")
 * @private
 */
function formatWinstonToAR(winston: number): string {
  const ar = winston / WINSTON_PER_AR;
  return `${ar.toFixed(6)} AR`;
}

/**
 * Upload bundle to Arweave network
 *
 * Creates an Arweave data transaction with the bundle, adds metadata tags,
 * signs with wallet, uploads to gateway, and optionally tracks progress.
 *
 * Includes retry logic for network failures (3 attempts with exponential backoff).
 *
 * @param bundle - Compressed tar.gz bundle buffer
 * @param metadata - Skill name and version for transaction tags
 * @param wallet - JWK for signing transaction
 * @param options - Optional progress callback and custom gateway URL
 * @returns Upload result with transaction ID, size, and cost
 * @throws {NetworkError} On network timeout or gateway failure
 * @throws {AuthorizationError} On insufficient funds
 * @throws {ValidationError} On invalid transaction or gateway URL
 *
 * @example
 * ```typescript
 * const result = await uploadBundle(
 *   bundleBuffer,
 *   { skillName: 'my-skill', skillVersion: '1.0.0' },
 *   walletJwk,
 *   { progressCallback: (pct) => console.log(`${pct}% uploaded`) }
 * );
 * console.log('Transaction ID:', result.txId);
 * ```
 */
export async function uploadBundle(
  bundle: Buffer,
  metadata: IBundleMetadata,
  wallet: JWK,
  options?: IUploadOptions
): Promise<IUploadResult> {
  // Load configuration to get gateway URL
  const config = await loadConfig();
  const gatewayUrl = options?.gatewayUrl || config.gateway || DEFAULT_GATEWAY;

  // Initialize Arweave client
  const arweave = initializeArweaveClient(gatewayUrl);

  // Derive wallet address for balance check and error messages
  const address = await arweave.wallets.jwkToAddress(wallet);

  // Check wallet balance before attempting upload
  try {
    const balanceWinston = await retryWithBackoff(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

        try {
          const balance = await arweave.wallets.getBalance(address);
          return parseInt(balance, 10);
        } finally {
          clearTimeout(timeoutId);
        }
      },
      isRetryableError,
      MAX_RETRY_ATTEMPTS,
      BASE_RETRY_DELAY_MS
    );

    // Estimate transaction cost
    const tx = await arweave.createTransaction({ data: bundle }, wallet);
    const costWinston = parseInt(tx.reward, 10);

    // Check if wallet has sufficient balance
    if (balanceWinston < costWinston) {
      throw new AuthorizationError(
        `Insufficient funds (${formatWinstonToAR(balanceWinston)}) for transaction (estimated cost: ${formatWinstonToAR(costWinston)}) → Solution: Add funds to wallet address ${truncateAddress(address)}`,
        address,
        balanceWinston
      );
    }
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }

    const err = error instanceof Error ? error : new Error(String(error));
    throw new NetworkError(
      `Failed to check wallet balance → Solution: Verify network connection and try again`,
      err,
      gatewayUrl
    );
  }

  // Report initial progress
  if (options?.progressCallback) {
    options.progressCallback(0);
  }

  // Create and configure transaction
  let txId: string;
  let uploadSize: number;
  let cost: number;

  try {
    txId = await retryWithBackoff(
      async () => {
        // Create transaction
        const tx = await arweave.createTransaction({ data: bundle }, wallet);

        // Add transaction tags
        const tags: ITag[] = [
          { name: 'App-Name', value: 'Agent-Skills-Registry' },
          { name: 'Content-Type', value: 'application/x-tar+gzip' },
          { name: 'Skill-Name', value: metadata.skillName },
          { name: 'Skill-Version', value: metadata.skillVersion },
        ];

        for (const tag of tags) {
          tx.addTag(tag.name, tag.value);
        }

        // Sign transaction
        await arweave.transactions.sign(tx, wallet);

        // Upload transaction with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

        try {
          const response = await arweave.transactions.post(tx);

          if (response.status !== 200) {
            throw new Error(
              `Gateway returned status ${response.status}: ${response.statusText}`
            );
          }

          return tx.id;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      isRetryableError,
      MAX_RETRY_ATTEMPTS,
      BASE_RETRY_DELAY_MS
    );

    uploadSize = bundle.length;

    // Calculate cost
    const tx = await arweave.createTransaction({ data: bundle }, wallet);
    cost = parseInt(tx.reward, 10);

    // Report completion progress
    if (options?.progressCallback) {
      options.progressCallback(100);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Check for specific error types
    if ((err as NodeJS.ErrnoException).code === 'ABORT_ERR') {
      throw new NetworkError(
        `Upload failed: network timeout after ${UPLOAD_TIMEOUT_MS / 1000} seconds → Solution: Check your internet connection and try again. If the issue persists, try a different gateway using --gateway flag`,
        err,
        gatewayUrl
      );
    }

    // Gateway errors
    if (err.message.includes('502') || err.message.includes('503')) {
      throw new NetworkError(
        `Gateway unavailable (${gatewayUrl} returned ${err.message.match(/\d{3}/)?.[0]}) → Solution: Try an alternative gateway: --gateway https://g8way.io`,
        err,
        gatewayUrl
      );
    }

    // Invalid transaction errors
    if (err.message.toLowerCase().includes('invalid') || err.message.toLowerCase().includes('malformed')) {
      throw new ValidationError(
        `Invalid transaction → Solution: Ensure bundle is a valid tar.gz file and metadata is correct`,
        'transaction',
        err.message
      );
    }

    // Generic network error
    throw new NetworkError(
      `Upload failed → Solution: ${err.message}`,
      err,
      gatewayUrl
    );
  }

  logger.info(`Successfully uploaded bundle to Arweave: ${txId}`);

  return {
    txId,
    uploadSize,
    cost,
  };
}

/**
 * Check transaction status on Arweave network
 *
 * Queries the transaction status endpoint to determine if a transaction
 * is pending, confirming, confirmed, or failed.
 *
 * @param txId - Arweave transaction ID (43 characters)
 * @param gatewayUrl - Optional custom gateway URL (defaults to config)
 * @returns Transaction status
 * @throws {NetworkError} On network failure or gateway error
 *
 * @example
 * ```typescript
 * const status = await checkTransactionStatus('abc123...xyz789');
 * console.log('Status:', status);
 * ```
 */
export async function checkTransactionStatus(
  txId: string,
  gatewayUrl?: string
): Promise<TransactionStatus> {
  // Load configuration if gateway not provided
  if (!gatewayUrl) {
    const config = await loadConfig();
    gatewayUrl = config.gateway || DEFAULT_GATEWAY;
  }

  validateGatewayUrl(gatewayUrl);

  try {
    const statusUrl = `${gatewayUrl}/tx/${txId}/status`;
    const response = await fetch(statusUrl);

    if (response.status === 404) {
      return 'pending';
    }

    if (!response.ok) {
      throw new Error(`Gateway returned status ${response.status}`);
    }

    const statusData = (await response.json()) as {
      block_height?: number;
      number_of_confirmations?: number;
    };

    // Transaction is confirmed if it has confirmations
    if (
      statusData.block_height !== undefined &&
      statusData.number_of_confirmations !== undefined &&
      statusData.number_of_confirmations > 0
    ) {
      return 'confirmed';
    }

    // Transaction is in a block but awaiting confirmations
    if (statusData.block_height !== undefined) {
      return 'confirming';
    }

    return 'pending';
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    throw new NetworkError(
      `Failed to check transaction status → Solution: Verify network connection and try again`,
      err,
      gatewayUrl
    );
  }
}

/**
 * Poll for transaction confirmation
 *
 * Polls the transaction status endpoint every 30 seconds until the transaction
 * is confirmed or the timeout is exceeded (default 5 minutes).
 *
 * @param txId - Arweave transaction ID (43 characters)
 * @param timeoutMs - Timeout in milliseconds (default: 5 minutes)
 * @param gatewayUrl - Optional custom gateway URL (defaults to config)
 * @returns True if transaction confirmed, false if timeout exceeded
 * @throws {NetworkError} On network failure or gateway error
 *
 * @example
 * ```typescript
 * const confirmed = await pollConfirmation('abc123...xyz789');
 * if (confirmed) {
 *   console.log('Transaction confirmed!');
 * } else {
 *   console.log('Timeout waiting for confirmation');
 * }
 * ```
 */
export async function pollConfirmation(
  txId: string,
  timeoutMs: number = CONFIRMATION_TIMEOUT_MS,
  gatewayUrl?: string
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await checkTransactionStatus(txId, gatewayUrl);

    if (status === 'confirmed') {
      logger.info(`Transaction ${txId} confirmed`);
      return true;
    }

    if (status === 'failed') {
      logger.warn(`Transaction ${txId} failed`);
      return false;
    }

    logger.info(`Transaction ${txId} status: ${status}. Polling again in ${POLL_INTERVAL_MS / 1000}s...`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  logger.warn(`Timeout waiting for transaction ${txId} to confirm`);
  return false;
}

/**
 * Download bundle from Arweave by transaction ID
 *
 * Retrieves a previously uploaded bundle from the Arweave network.
 * This function will be used by the install command (Story 3.x).
 *
 * @param txId - Arweave transaction ID (43 characters)
 * @param gatewayUrl - Optional custom gateway URL (defaults to config)
 * @returns Bundle buffer (compressed tar.gz)
 * @throws {NetworkError} On network failure or gateway error
 *
 * @example
 * ```typescript
 * const bundle = await downloadBundle('abc123...xyz789');
 * console.log('Downloaded', bundle.length, 'bytes');
 * ```
 */
export async function downloadBundle(
  txId: string,
  gatewayUrl?: string
): Promise<Buffer> {
  // Load configuration if gateway not provided
  if (!gatewayUrl) {
    const config = await loadConfig();
    gatewayUrl = config.gateway || DEFAULT_GATEWAY;
  }

  validateGatewayUrl(gatewayUrl);

  try {
    const dataUrl = `${gatewayUrl}/${txId}`;
    const response = await fetch(dataUrl);

    if (!response.ok) {
      throw new Error(`Gateway returned status ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    throw new NetworkError(
      `Failed to download bundle → Solution: Verify transaction ID and network connection`,
      err,
      gatewayUrl
    );
  }
}
