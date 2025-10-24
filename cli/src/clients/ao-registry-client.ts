/**
 * AO Registry Client Module
 *
 * Handles message passing to AO Registry Process for skill registration,
 * search queries, and metadata retrieval with retry logic and error handling.
 *
 * This module provides the interface for interacting with the decentralized
 * skill registry process on the AO network.
 */

import { connect, createDataItemSigner } from '@permaweb/aoconnect';

// Configure aoconnect with custom CU and MU
const ao = connect({
  MU_URL: 'https://ur-mu.randao.net',
  CU_URL: 'https://ur-cu.randao.net',
});

const { message, dryrun, result } = ao;
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
const MAX_RETRY_ATTEMPTS = 3; // 3 attempts for queries only
const RETRY_DELAY_MS = 8000; // 8 seconds between retries (avoid rate limiting)
const DEFAULT_TIMEOUT_MS = 45000; // 45 seconds default timeout (CU queries can be slow)
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
 * Execute a query using message + result (fallback for dryrun failures)
 *
 * Sends a message to the registry and reads the response.
 * More reliable than dryrun but requires wallet signing.
 *
 * @param action - Query action (e.g., 'Search-Skills', 'Get-Skill')
 * @param tags - Additional tags for the query
 * @param wallet - Wallet JWK for signing
 * @returns Result data from registry response
 * @private
 *
 * TODO: Integrate as fallback for searchSkills and getSkill when dryrun fails
 * Requires wallet parameter to be passed through from commands
 */
// @ts-ignore - Function will be used when message-based fallback is implemented
async function queryViaMessage(
  action: string,
  tags: Array<{ name: string; value: string }>,
  wallet: JWK
): Promise<any> {
  const processId = await getRegistryProcessId();

  try {
    // Create signer from wallet
    const signer = createDataItemSigner(wallet);

    // Send query as message
    const messageId = await message({
      process: processId,
      tags: [
        { name: 'Action', value: action },
        ...tags
      ],
      signer,
    });

    logger.debug(`${action} message sent`, { messageId });

    // Wait for processing
    await delay(2000);

    // Read result
    const response = (await result({
      message: messageId,
      process: processId,
    })) as {
      Messages?: Array<{
        Data: string;
        Tags?: Array<{ name: string; value: string }>;
      }>;
    };

    // Parse response
    if (!response.Messages || response.Messages.length === 0) {
      logger.debug(`No response from ${action} message query`);
      return null;
    }

    const responseMsg = response.Messages[0];
    const responseAction = responseMsg.Tags?.find((t) => t.name === 'Action')?.value;

    // Check for error response
    if (responseAction === 'Error') {
      const errorMsg = responseMsg.Tags?.find((t) => t.name === 'Error')?.value;
      throw new Error(errorMsg || 'Unknown error from registry');
    }

    // Parse data
    return JSON.parse(responseMsg.Data);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    throw new NetworkError(
      `[NetworkError] ${action} message query failed. -> Solution: ${err.message}`,
      err,
      'ao-registry',
      'connection_failure'
    );
  }
}

/**
 * List skills with pagination and filtering
 *
 * Sends a dryrun query to retrieve a paginated list of skills with optional filters.
 * This is a read-only operation and will be retried on network failures.
 *
 * @param options - Pagination and filter options
 * @returns Paginated list of skills with metadata
 * @throws {NetworkError} If query fails after retries
 * @throws {ConfigurationError} If registry process ID not configured
 *
 * @example
 * ```typescript
 * // List first page (10 skills)
 * const page1 = await listSkills({ limit: 10, offset: 0 });
 *
 * // Filter by author
 * const perplexSkills = await listSkills({ author: 'Permamind Team' });
 *
 * // Filter by tags
 * const aoSkills = await listSkills({ filterTags: ['ao', 'tutorial'] });
 * ```
 */
export async function listSkills(options?: {
  limit?: number;
  offset?: number;
  author?: string;
  filterTags?: string[];
  filterName?: string;
}): Promise<{
  skills: ISkillMetadata[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    returned: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> {
  const processId = await getRegistryProcessId();

  const executeQuery = async () => {
    logger.debug('Sending List-Skills dryrun query', { processId, options });

    const tags: Array<{ name: string; value: string }> = [
      { name: 'Action', value: 'List-Skills' },
    ];

    // Add optional parameters
    if (options?.limit !== undefined) {
      tags.push({ name: 'Limit', value: String(options.limit) });
    }
    if (options?.offset !== undefined) {
      tags.push({ name: 'Offset', value: String(options.offset) });
    }
    if (options?.author) {
      tags.push({ name: 'Author', value: options.author });
    }
    if (options?.filterName) {
      tags.push({ name: 'FilterName', value: options.filterName });
    }
    if (options?.filterTags && options.filterTags.length > 0) {
      tags.push({ name: 'FilterTags', value: JSON.stringify(options.filterTags) });
    }

    const result = (await dryrun({
      process: processId,
      tags,
    })) as IAODryrunResult;

    // Parse response from Messages[0].Data
    if (!result.Messages || result.Messages.length === 0) {
      logger.debug('No results found for list query');
      return { skills: [], pagination: { total: 0, limit: 10, offset: 0, returned: 0, hasNextPage: false, hasPrevPage: false } };
    }

    const data = JSON.parse(result.Messages[0].Data) as {
      skills: ISkillMetadata[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        returned: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    };

    logger.debug('List-Skills query successful', {
      total: data.pagination.total,
      returned: data.pagination.returned,
    });

    return data;
  };

  // Retry logic for dryrun queries
  return await retryQuery(executeQuery, 'List-Skills');
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
 * Get a specific skill by name and optional version from the AO registry
 *
 * Sends a dryrun query to retrieve metadata for a specific skill.
 * If version is not specified, returns the latest version.
 * This is a read-only operation and will be retried on network failures.
 *
 * @param name - Skill name to retrieve
 * @param version - Optional specific version (defaults to latest)
 * @returns Skill metadata, or null if not found
 * @throws {NetworkError} If query fails after retries
 * @throws {ConfigurationError} If registry process ID not configured
 *
 * @example
 * ```typescript
 * // Get latest version
 * const skill = await getSkill('ao-basics');
 *
 * // Get specific version
 * const oldVersion = await getSkill('ao-basics', '1.0.0');
 * ```
 */
export async function getSkill(name: string, version?: string): Promise<ISkillMetadata | null> {
  // Check cache first
  const now = Date.now();
  const cached = skillCache.get(name);
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    logger.debug('Skill metadata retrieved from cache', { name, age: now - cached.timestamp });
    return cached.data;
  }

  const processId = await getRegistryProcessId();

  const executeQuery = async (): Promise<ISkillMetadata | null> => {
    logger.debug('Sending Get-Skill dryrun query', { processId, name, version: version || 'latest' });

    const tags: Array<{ name: string; value: string }> = [
      { name: 'Action', value: 'Get-Skill' },
      { name: 'Name', value: name },
    ];

    // Add version tag if specified
    if (version) {
      tags.push({ name: 'Version', value: version });
    }

    const result = (await dryrun({
      process: processId,
      tags,
    })) as IAODryrunResult;

    // Parse response from Messages[0].Data
    if (!result.Messages || result.Messages.length === 0) {
      logger.debug('Skill not found in registry', { name });
      return null;
    }

    // Check if response is HTML (gateway error)
    const responseData = result.Messages[0].Data;
    if (typeof responseData === 'string' && responseData.trim().startsWith('<')) {
      throw new Error(`CU gateway returned HTML error page instead of JSON. This may be due to rate limiting or gateway issues.`);
    }

    const data = JSON.parse(responseData) as ISkillMetadata | null;
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

      // Log the actual error for debugging
      logger.warn(`${actionName} query attempt ${attempt} failed: ${lastError.message} (${lastError.name})`);

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

  // All attempts failed - include the actual error details
  throw new NetworkError(
    `[NetworkError] Failed to execute ${actionName} query after ${MAX_RETRY_ATTEMPTS} attempts. -> Solution: Check your network connection and ensure the AO registry process is available. Try again in a few moments. Last error: ${lastError!.message}`,
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
