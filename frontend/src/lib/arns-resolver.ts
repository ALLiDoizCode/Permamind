import { ARIO, AoARIORead } from '@ar.io/sdk/web';

// In-memory cache for resolved primary names
const cache = new Map<string, string | null>();

// Initialize ARIO client for mainnet (lazy initialization)
let ario: AoARIORead | null = null;

// Owner address overrides for ArNS resolution
// Maps process owner addresses to actual wallet addresses for name resolution
const OWNER_ADDRESS_OVERRIDES: Record<string, string> = {
  // Process owner → Actual wallet address for ArNS resolution
  'CK-1OqFAIsqyPVfBE0q6n7gnNGvVoPPF8LTNJ7bdzHI':
    'vd97vAnBhKD7zGNDTjTgl5N0WKLcl92MO8Ob3T0w6IM',
};

function getArioClient(): AoARIORead {
  if (!ario) {
    ario = ARIO.mainnet();
  }
  return ario;
}

/**
 * Resolve an Arweave address to its primary ArNS name
 * @param address - Arweave address (43 characters)
 * @returns Primary name (without .ar suffix) or null if not found/error
 */
export async function resolvePrimaryName(
  address: string
): Promise<string | null> {
  // Validate address format (Arweave addresses are 43 characters)
  if (!address || address.length !== 43) {
    return null;
  }

  // Apply address override if configured
  const resolveAddress = OWNER_ADDRESS_OVERRIDES[address] || address;

  // Check cache first (use original address as cache key)
  if (cache.has(address)) {
    return cache.get(address) ?? null;
  }

  try {
    // Set timeout for resolution (2 seconds)
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), 2000);
    });

    const resolutionPromise = getArioClient().getPrimaryName({
      address: resolveAddress,
    });

    const result = await Promise.race([resolutionPromise, timeoutPromise]);

    // Clear timeout if resolution completed first
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Extract name from result (result is null on timeout, or has name property)
    const primaryName =
      result && typeof result === 'object' && 'name' in result
        ? (result.name ?? null)
        : null;

    // Cache result (both success and failure)
    cache.set(address, primaryName);

    return primaryName;
  } catch (error) {
    // Log error (debug only)
    if (import.meta.env.DEV) {
      console.debug('Primary name resolution failed:', address, error);
    }

    // Cache failure to prevent re-querying
    cache.set(address, null);

    return null;
  }
}

/**
 * Clear the resolution cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Reset the ARIO client (useful for testing)
 * @internal
 */
export function _resetArioClient(): void {
  ario = null;
}
