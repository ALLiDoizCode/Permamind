import { getRegistryProcessId, getHyperBeamNode } from './registry-config';

// Get configuration from centralized config
const REGISTRY_PROCESS_ID = getRegistryProcessId();
const HYPERBEAM_NODE = getHyperBeamNode();

// Script transaction IDs from deployment log
export const SEARCH_SKILLS_SCRIPT_ID =
  'hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk';
export const GET_SKILL_SCRIPT_ID =
  'oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA';
export const GET_SKILL_VERSIONS_SCRIPT_ID =
  'qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo';
export const GET_DOWNLOAD_STATS_SCRIPT_ID =
  'pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8';
export const INFO_SCRIPT_ID = 'fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4';
export const LIST_SKILLS_SCRIPT_ID =
  'gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs';
export const RECORD_DOWNLOAD_SCRIPT_ID =
  '-jzL_97376OTQbf46__dr1MQBllkAJPuetVHlDq_KVA';

/**
 * Build HyperBEAM Dynamic Reads URL
 * @param scriptTxId - Arweave transaction ID of the Lua transformation script
 * @param functionName - Name of the Lua function to invoke
 * @param queryParams - Optional query parameters as key-value pairs
 * @param useCache - Use /cache path (faster, potentially stale) instead of /now (real-time)
 * @returns Complete HyperBEAM URL
 */
export function buildHyperbeamUrl(
  scriptTxId: string,
  functionName: string,
  queryParams?: Record<string, string | number | undefined>,
  useCache: boolean = false
): string {
  // State path: /cache (faster, potentially stale) or /now (real-time)
  const statePath = useCache ? 'cache' : 'now';

  // Base URL pattern: /{PROCESS_ID}~process@1.0/{STATE_PATH}/~lua@5.3a&module={SCRIPT_TX_ID}/{function_name}/serialize~json@1.0
  let url = `${HYPERBEAM_NODE}/${REGISTRY_PROCESS_ID}~process@1.0/${statePath}/~lua@5.3a&module=${scriptTxId}/${functionName}/serialize~json@1.0`;

  // Append query parameters if provided
  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  return url;
}

/**
 * Fetch data from HyperBEAM Dynamic Reads endpoint with fallback support
 * @param url - Complete HyperBEAM URL
 * @param fallbackFn - Optional fallback function to execute if HyperBEAM fails (e.g., dryrun)
 * @returns Parsed JSON response
 * @throws Error if both HyperBEAM and fallback fail
 */
export async function hyperbeamFetch<T>(
  url: string,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  try {
    // Try HyperBEAM fetch with 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Validate HTTP response
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse and validate JSON response
    const data = await response.json();

    // Check for error status in response (if present)
    if (data.status && data.status >= 400) {
      throw new Error(data.error || `HyperBEAM error: ${data.status}`);
    }

    return data as T;
  } catch (error) {
    console.warn('HyperBEAM request failed, attempting fallback:', error);

    // If fallback function provided, execute it
    if (fallbackFn) {
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        console.error('Fallback function also failed:', fallbackError);
        throw fallbackError;
      }
    }

    // No fallback available, throw original error
    throw error;
  }
}

/**
 * Record a skill download (fire-and-forget)
 * @param skillName - Name of the skill to record download for
 * @param version - Optional version number
 * @description Fires an async request to record download but doesn't wait for response
 */
export function recordDownload(skillName: string, version?: string): void {
  // Build HyperBEAM URL for download tracking
  const params: Record<string, string> = { name: skillName };
  if (version) {
    params.version = version;
  }

  const url = buildHyperbeamUrl(
    RECORD_DOWNLOAD_SCRIPT_ID,
    'recordDownload',
    params
  );

  // Fire-and-forget: don't await, don't block user interaction
  fetch(url)
    .then((response) => {
      if (!response.ok && import.meta.env.DEV) {
        console.warn(
          'Download tracking failed (non-critical):',
          response.status
        );
      }
    })
    .catch((error) => {
      // Silently log errors in dev mode only
      if (import.meta.env.DEV) {
        console.warn('Download tracking request failed (non-critical):', error);
      }
    });
}
