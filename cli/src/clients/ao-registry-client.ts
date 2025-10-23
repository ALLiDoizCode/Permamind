/**
 * AO Registry Client Module
 *
 * Handles message passing to AO Registry Process for skill registration,
 * search queries, and metadata retrieval with retry logic and error handling.
 *
 * This module provides the interface for interacting with the decentralized
 * skill registry process on the AO network.
 */

import { message, dryrun, createDataItemSigner } from '@permaweb/aoconnect';
import { loadConfig } from '../lib/config-loader.js';
import logger from '../utils/logger.js';
import {
  ISkillMetadata,
  IRegistryInfo,
  IAODryrunResult,
} from '../types/ao-registry.js';
import { JWK } from '../types/arweave.js';
import { NetworkError, ConfigurationError } from '../types/errors.js';

/**
 * Constants for AO operations
 */
const MAX_RETRY_ATTEMPTS = 2; // 2 attempts for queries only
const RETRY_DELAY_MS = 5000; // 5 seconds between retries
const DEFAULT_TIMEOUT_MS = 30000; // 30 seconds default timeout
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache expiration

/**
 * Cache entry structure with timestamp for TTL expiration
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * In-memory cache for search results and skill metadata
 *
 * Reduces redundant network requests for frequently queried data.
 * Cache entries expire after CACHE_TTL_MS (5 minutes).
 */
const searchCache = new Map<string, CacheEntry<ISkillMetadata[]>>();
const skillCache = new Map<string, CacheEntry<ISkillMetadata | null>>();

/**
 * Get AO Registry Process ID from environment or config
 *
 * Priority order:
 * 1. AO_REGISTRY_PROCESS_ID environment variable
 * 2. registry field in .skillsrc config
 * 3. Error (no default value for security)
 *
 * @returns Registry process ID (43-character Arweave address)
 * @throws {ConfigurationError} If registry process ID not configured
 * @private
 */
async function getRegistryProcessId(): Promise<string> {
  // Priority 1: Environment variable
  if (process.env.AO_REGISTRY_PROCESS_ID) {
    return process.env.AO_REGISTRY_PROCESS_ID;
  }

  // Priority 2: Config file
  const config = await loadConfig();
  if (config.registry) {
    return config.registry;
  }

  // No registry configured
  throw new ConfigurationError(
    '[ConfigurationError] AO Registry Process ID not configured. -> Solution: Set AO_REGISTRY_PROCESS_ID environment variable or add "registry" field to .skillsrc',
    'registry'
  );
}

/**
 * Register a skill in the AO registry
 *
 * Sends a Register-Skill message to the AO registry process with skill metadata.
 * This is a state-changing operation and will NOT be retried on failure.
 *
 * @param metadata - Complete skill metadata including arweaveTxId
 * @param wallet - Wallet JWK for signing the message
 * @returns AO message ID for the registration transaction
 * @throws {NetworkError} If message sending fails
 * @throws {ConfigurationError} If registry process ID not configured
 *
 * @example
 * ```typescript
 * const messageId = await registerSkill({
 *   name: 'ao-basics',
 *   version: '1.0.0',
 *   description: 'AO fundamentals',
 *   author: 'Skills Team',
 *   owner: 'abc123...xyz789',
 *   tags: ['ao', 'tutorial'],
 *   dependencies: [],
 *   arweaveTxId: 'tx123...tx789',
 *   publishedAt: Date.now(),
 *   updatedAt: Date.now()
 * }, walletJWK);
 * ```
 */
export async function registerSkill(
  metadata: ISkillMetadata,
  wallet: JWK
): Promise<string> {
  const processId = await getRegistryProcessId();

  try {
    logger.debug('Sending Register-Skill message to AO registry', {
      processId,
      skillName: metadata.name,
      version: metadata.version,
    });

    // Create data item signer from wallet JWK
    const signer = createDataItemSigner(wallet);

    // Send message with Register-Skill action
    const messageId = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Register-Skill' },
        { name: 'Name', value: metadata.name },
        { name: 'Version', value: metadata.version },
        { name: 'Description', value: metadata.description },
        { name: 'Author', value: metadata.author },
        { name: 'Tags', value: JSON.stringify(metadata.tags) },
        { name: 'ArweaveTxId', value: metadata.arweaveTxId },
        { name: 'Dependencies', value: JSON.stringify(metadata.dependencies) },
      ],
      signer,
    });

    logger.debug('Register-Skill message sent successfully', { messageId });
    return messageId;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new NetworkError(
      `[NetworkError] Failed to register skill in AO registry. -> Solution: Check your network connection and ensure the AO registry process is available. Try again in a few moments.`,
      error instanceof Error ? error : new Error(errorMessage),
      'ao-registry',
      'gateway_error'
    );
  }
}

/**
 * Update an existing skill in the AO registry
 *
 * Sends an Update-Skill message to the AO registry process with updated metadata.
 * This is a state-changing operation and will NOT be retried on failure.
 * Only the skill owner can update a skill.
 *
 * @param metadata - Complete skill metadata including arweaveTxId
 * @param wallet - Wallet JWK for signing the message
 * @returns AO message ID for the update transaction
 * @throws {NetworkError} If message sending fails
 * @throws {ConfigurationError} If registry process ID not configured
 */
export async function updateSkill(
  metadata: ISkillMetadata,
  wallet: JWK
): Promise<string> {
  const processId = await getRegistryProcessId();

  try {
    logger.debug('Sending Update-Skill message to AO registry', {
      processId,
      skillName: metadata.name,
      version: metadata.version,
    });

    // Create data item signer from wallet JWK
    const signer = createDataItemSigner(wallet);

    // Send message with Update-Skill action
    const messageId = await message({
      process: processId,
      tags: [
        { name: 'Action', value: 'Update-Skill' },
        { name: 'Name', value: metadata.name },
        { name: 'Version', value: metadata.version },
        { name: 'Description', value: metadata.description },
        { name: 'Author', value: metadata.author },
        { name: 'Tags', value: JSON.stringify(metadata.tags) },
        { name: 'ArweaveTxId', value: metadata.arweaveTxId },
        { name: 'Dependencies', value: JSON.stringify(metadata.dependencies) },
      ],
      signer,
    });

    logger.debug('Update-Skill message sent successfully', { messageId });
    return messageId;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new NetworkError(
      `[NetworkError] Failed to update skill in AO registry. -> Solution: Check your network connection and ensure the AO registry process is available. Try again in a few moments.`,
      error instanceof Error ? error : new Error(errorMessage),
      'ao-registry',
      'gateway_error'
    );
  }
}

/**
 * Search for skills in the AO registry
 *
 * Sends a dryrun query to the registry process to search for skills matching the query.
 * This is a read-only operation and will be retried on network failures.
 *
 * @param query - Search query string
 * @param options - Optional search options (limit, offset)
 * @returns Array of skill metadata matching the query
 * @throws {NetworkError} If query fails after retries
 * @throws {ConfigurationError} If registry process ID not configured
 *
 * @example
 * ```typescript
 * const results = await searchSkills('ao tutorial');
 * console.log(`Found ${results.length} skills`);
 * ```
 */
export async function searchSkills(
  query: string
): Promise<ISkillMetadata[]> {
  // Check cache first
  const now = Date.now();
  const cached = searchCache.get(query);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    logger.debug('Search results retrieved from cache', { query, age: now - cached.timestamp });
    return cached.data;
  }

  const processId = await getRegistryProcessId();

  const executeQuery = async (): Promise<ISkillMetadata[]> => {
    logger.debug('Sending Search-Skills dryrun query', { processId, query });

    const result = (await dryrun({
      process: processId,
      tags: [
        { name: 'Action', value: 'Search-Skills' },
        { name: 'Query', value: query },
      ],
    })) as IAODryrunResult;

    // Parse response from Messages[0].Data
    if (!result.Messages || result.Messages.length === 0) {
      logger.debug('No results found for search query', { query });
      return [];
    }

    const data = JSON.parse(result.Messages[0].Data) as ISkillMetadata[];
    logger.debug('Search-Skills query successful', {
      resultCount: data.length,
    });

    return data;
  };

  // Retry logic for dryrun queries
  const results = await retryQuery(executeQuery, 'Search-Skills');

  // Cache results
  searchCache.set(query, { data: results, timestamp: now });
  logger.debug('Search results cached', { query, resultCount: results.length });

  return results;
}

/**
 * Get a specific skill by name from the AO registry
 *
 * Sends a dryrun query to retrieve metadata for a specific skill.
 * This is a read-only operation and will be retried on network failures.
 *
 * @param name - Skill name to retrieve
 * @returns Skill metadata, or null if not found
 * @throws {NetworkError} If query fails after retries
 * @throws {ConfigurationError} If registry process ID not configured
 *
 * @example
 * ```typescript
 * const skill = await getSkill('ao-basics');
 * if (skill) {
 *   console.log(`Found skill: ${skill.name} v${skill.version}`);
 * }
 * ```
 */
export async function getSkill(name: string): Promise<ISkillMetadata | null> {
  // Check cache first
  const now = Date.now();
  const cached = skillCache.get(name);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    logger.debug('Skill metadata retrieved from cache', { name, age: now - cached.timestamp });
    return cached.data;
  }

  const processId = await getRegistryProcessId();

  const executeQuery = async (): Promise<ISkillMetadata | null> => {
    logger.debug('Sending Get-Skill dryrun query', { processId, name });

    const result = (await dryrun({
      process: processId,
      tags: [
        { name: 'Action', value: 'Get-Skill' },
        { name: 'Name', value: name },
      ],
    })) as IAODryrunResult;

    // Parse response from Messages[0].Data
    if (!result.Messages || result.Messages.length === 0) {
      logger.debug('Skill not found in registry', { name });
      return null;
    }

    const data = JSON.parse(result.Messages[0].Data) as ISkillMetadata | null;
    logger.debug('Get-Skill query successful', { name, found: !!data });

    return data;
  };

  // Retry logic for dryrun queries
  const result = await retryQuery(executeQuery, 'Get-Skill');

  // Cache result (even if null - skill not found)
  skillCache.set(name, { data: result, timestamp: now });
  logger.debug('Skill metadata cached', { name, found: !!result });

  return result;
}

/**
 * Get AO registry process information (ADP v1.0 compliance)
 *
 * Sends a dryrun query to retrieve registry metadata and capabilities.
 * This is a read-only operation and will be retried on network failures.
 *
 * @returns Registry process information
 * @throws {NetworkError} If query fails after retries
 * @throws {ConfigurationError} If registry process ID not configured
 *
 * @example
 * ```typescript
 * const info = await getRegistryInfo();
 * console.log(`Registry: ${info.process.name} v${info.process.version}`);
 * console.log(`Capabilities: ${info.process.capabilities.join(', ')}`);
 * ```
 */
export async function getRegistryInfo(): Promise<IRegistryInfo> {
  const processId = await getRegistryProcessId();

  const executeQuery = async (): Promise<IRegistryInfo> => {
    logger.debug('Sending Info dryrun query for ADP compliance', { processId });

    const result = (await dryrun({
      process: processId,
      tags: [{ name: 'Action', value: 'Info' }],
    })) as IAODryrunResult;

    // Parse response from Messages[0].Data
    if (!result.Messages || result.Messages.length === 0) {
      throw new Error('Registry Info query returned no data');
    }

    const data = JSON.parse(result.Messages[0].Data) as IRegistryInfo;
    logger.debug('Info query successful', {
      registryName: data.process.name,
      adpVersion: data.process.adpVersion,
    });

    return data;
  };

  // Retry logic for dryrun queries
  return await retryQuery(executeQuery, 'Info');
}

/**
 * Wrap a function with a timeout using Promise.race()
 *
 * @param fn - Function to execute with timeout
 * @param timeoutMs - Timeout duration in milliseconds
 * @param actionName - Name of action for error messages
 * @returns Result from successful function execution
 * @throws {NetworkError} If timeout is exceeded
 * @private
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  actionName: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new NetworkError(
              `[NetworkError] ${actionName} query timed out after ${timeoutMs / 1000} seconds. -> Solution: The AO registry process may be slow or unresponsive. Try again or check network connectivity.`,
              new Error('Timeout exceeded'),
              'ao-registry',
              'timeout'
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Retry a query function with fixed delay between attempts
 *
 * IMPORTANT: Only use this for dryrun queries (read-only operations).
 * Do NOT retry message() calls (state-changing operations).
 *
 * @param fn - Query function to retry
 * @param actionName - Name of the action for error messages
 * @returns Result from successful query execution
 * @throws {NetworkError} If all retry attempts fail
 * @private
 */
async function retryQuery<T>(
  fn: () => Promise<T>,
  actionName: string
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      // Wrap function execution with timeout
      return await withTimeout(fn, DEFAULT_TIMEOUT_MS, actionName);
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Fast fail on timeout errors - do not retry
      if (lastError.message.includes('timed out')) {
        throw lastError;
      }

      if (attempt < MAX_RETRY_ATTEMPTS) {
        logger.debug(`${actionName} query failed, retrying...`, {
          attempt,
          maxAttempts: MAX_RETRY_ATTEMPTS,
          error: lastError.message,
        });
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  // All attempts failed
  throw new NetworkError(
    `[NetworkError] Failed to execute ${actionName} query after ${MAX_RETRY_ATTEMPTS} attempts. -> Solution: Check your network connection and ensure the AO registry process is available. Try again in a few moments.`,
    lastError!,
    'ao-registry',
    'connection_failure'
  );
}

/**
 * Delay execution for a specified number of milliseconds
 *
 * @param ms - Milliseconds to delay
 * @private
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clear all cached search results and skill metadata
 *
 * Useful for testing or when fresh data is required.
 * This function is exported for use in testing and administrative operations.
 *
 * @example
 * ```typescript
 * clearCache(); // Clear all cached queries and skill metadata
 * ```
 */
export function clearCache(): void {
  searchCache.clear();
  skillCache.clear();
  logger.debug('Cache cleared', {
    searchCacheSize: 0,
    skillCacheSize: 0,
  });
}
