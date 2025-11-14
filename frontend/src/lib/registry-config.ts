/**
 * Centralized Registry Configuration for Frontend
 *
 * This module provides environment variable override support for the shared registry config.
 * The base configuration is imported from @permamind/registry-config package.
 *
 * Environment variables can be used to override defaults for testing/development:
 * - VITE_REGISTRY_PROCESS_ID: Override registry process ID
 * - VITE_MU_URL: Override MU endpoint
 * - VITE_CU_URL: Override CU endpoint
 * - VITE_HYPERBEAM_NODE: Override HyperBEAM node
 */

// Import and re-export the shared registry configuration
import { REGISTRY_CONFIG as _REGISTRY_CONFIG } from '@permamind/registry-config';
export { REGISTRY_CONFIG } from '@permamind/registry-config';

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
  return import.meta.env.VITE_REGISTRY_PROCESS_ID || _REGISTRY_CONFIG.PROCESS_ID;
}

/**
 * Get MU endpoint with environment variable override support
 *
 * @returns MU URL (primary)
 */
export function getMuUrl(): string {
  return import.meta.env.VITE_MU_URL || _REGISTRY_CONFIG.MU_URL;
}

/**
 * Get CU endpoint with environment variable override support
 *
 * @returns CU URL (primary)
 */
export function getCuUrl(): string {
  return import.meta.env.VITE_CU_URL || _REGISTRY_CONFIG.CU_URL;
}

/**
 * Get fallback MU endpoint
 *
 * @returns Fallback MU URL
 */
export function getMuUrlFallback(): string {
  return _REGISTRY_CONFIG.MU_URL_FALLBACK;
}

/**
 * Get fallback CU endpoint
 *
 * @returns Fallback CU URL
 */
export function getCuUrlFallback(): string {
  return _REGISTRY_CONFIG.CU_URL_FALLBACK;
}

/**
 * Get HyperBEAM node endpoint with environment variable override support
 *
 * @returns HyperBEAM node URL
 */
export function getHyperBeamNode(): string {
  return import.meta.env.VITE_HYPERBEAM_NODE || _REGISTRY_CONFIG.HYPERBEAM_NODE;
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
