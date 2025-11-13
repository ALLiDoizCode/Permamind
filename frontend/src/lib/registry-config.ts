/**
 * Centralized Registry Configuration
 *
 * This module provides a single source of truth for AO Registry configuration.
 * Users should NOT need to configure the registry process ID manually.
 *
 * Environment variables can be used to override defaults for testing/development:
 * - VITE_REGISTRY_PROCESS_ID: Override registry process ID
 * - VITE_MU_URL: Override MU endpoint
 * - VITE_CU_URL: Override CU endpoint
 * - VITE_HYPERBEAM_NODE: Override HyperBEAM node
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
   * HyperBEAM node endpoint for serverless read-only queries
   * Used for fast (<500ms) registry reads via Dynamic Reads
   */
  HYPERBEAM_NODE: 'https://hb.randao.net',
} as const;

/**
 * Get registry process ID with environment variable override support
 *
 * Priority:
 * 1. VITE_REGISTRY_PROCESS_ID environment variable (for testing/dev)
 * 2. Default production registry (recommended)
 *
 * @returns Registry process ID
 */
export function getRegistryProcessId(): string {
  return import.meta.env.VITE_REGISTRY_PROCESS_ID || REGISTRY_CONFIG.PROCESS_ID;
}

/**
 * Get MU endpoint with environment variable override support
 *
 * @returns MU URL (primary)
 */
export function getMuUrl(): string {
  return import.meta.env.VITE_MU_URL || REGISTRY_CONFIG.MU_URL;
}

/**
 * Get CU endpoint with environment variable override support
 *
 * @returns CU URL (primary)
 */
export function getCuUrl(): string {
  return import.meta.env.VITE_CU_URL || REGISTRY_CONFIG.CU_URL;
}

/**
 * Get fallback MU endpoint
 *
 * @returns Fallback MU URL
 */
export function getMuUrlFallback(): string {
  return REGISTRY_CONFIG.MU_URL_FALLBACK;
}

/**
 * Get fallback CU endpoint
 *
 * @returns Fallback CU URL
 */
export function getCuUrlFallback(): string {
  return REGISTRY_CONFIG.CU_URL_FALLBACK;
}

/**
 * Get HyperBEAM node endpoint with environment variable override support
 *
 * @returns HyperBEAM node URL
 */
export function getHyperBeamNode(): string {
  return import.meta.env.VITE_HYPERBEAM_NODE || REGISTRY_CONFIG.HYPERBEAM_NODE;
}

/**
 * Get complete registry configuration with all overrides applied
 *
 * @returns Complete registry configuration
 */
export function getRegistryConfig() {
  return {
    processId: getRegistryProcessId(),
    muUrl: getMuUrl(),
    cuUrl: getCuUrl(),
    hyperbeamNode: getHyperBeamNode(),
  };
}
