/**
 * Centralized Registry Configuration
 *
 * This module provides a single source of truth for AO Registry configuration
 * shared across CLI, MCP server, and frontend.
 *
 * Users should NOT need to configure the registry process ID manually.
 * Environment variables can be used to override defaults for testing/development.
 */

/**
 * Production registry configuration
 * These values are baked into the package and should work out-of-the-box
 */
export const REGISTRY_CONFIG = {
  /**
   * AO Registry Process ID (Production)
   * This is the official registry for Claude Agent Skills
   */
  PROCESS_ID: 'afj-S1wpWK07iSs9jIttoPJsptf4Db6ubZ_CLODdEpQ',

  /**
   * AO Messaging Unit (MU) endpoint - Primary
   * Default: Randao MU for reliable message delivery
   */
  MU_URL: 'https://ur-mu.randao.net',

  /**
   * AO Compute Unit (CU) endpoint - Primary
   * Default: Randao CU for reliable computation
   */
  CU_URL: 'https://ur-cu.randao.net',

  /**
   * AO Messaging Unit (MU) endpoint - Fallback
   * Used when primary MU fails
   */
  MU_URL_FALLBACK: 'https://mu.ao-testnet.xyz',

  /**
   * AO Compute Unit (CU) endpoint - Fallback
   * Used when primary CU fails
   */
  CU_URL_FALLBACK: 'https://cu.ao-testnet.xyz',

  /**
   * Arweave Gateway for file uploads
   * Default: Official Arweave gateway
   */
  GATEWAY: 'https://arweave.net',

  /**
   * HyperBEAM node endpoint for serverless read-only queries
   * Used for fast (<500ms) registry reads via Dynamic Reads
   */
  HYPERBEAM_NODE: 'https://hb.randao.net',
} as const;
