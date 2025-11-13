import { dryrun, dryrunFallback, REGISTRY_PROCESS_ID } from '@/lib/ao-client';
import {
  buildHyperbeamUrl,
  hyperbeamFetch,
  SEARCH_SKILLS_SCRIPT_ID,
  GET_SKILL_SCRIPT_ID,
  GET_SKILL_VERSIONS_SCRIPT_ID,
  GET_DOWNLOAD_STATS_SCRIPT_ID,
  INFO_SCRIPT_ID,
  LIST_SKILLS_SCRIPT_ID,
} from '@/lib/hyperbeam-client';
import type {
  SkillMetadata,
  PaginatedSkills,
  VersionInfo,
  RegistryInfo,
  ListSkillsOptions,
  DownloadStats,
} from '@/types/ao';

// Cache for query results
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(
  operation: string,
  params: Record<string, unknown>
): string {
  return `${operation}:${JSON.stringify(params)}`;
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// Delay utility for retry logic
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute dryrun with automatic fallback to secondary endpoints
 * @param tags - Message tags for the dryrun query
 * @returns Dryrun result
 */
async function dryrunWithFallback(tags: Array<{ name: string; value: string }>) {
  try {
    // Try primary endpoint first
    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags,
    });
    return result;
  } catch (primaryError) {
    // Log primary failure in dev mode
    if (import.meta.env.DEV) {
      console.warn('Primary endpoint failed, trying fallback:', primaryError);
    }

    // Try fallback endpoint
    try {
      const result = await dryrunFallback({
        process: REGISTRY_PROCESS_ID,
        tags,
      });

      if (import.meta.env.DEV) {
        console.warn('Successfully used fallback endpoint (ao-testnet)');
      }

      return result;
    } catch (fallbackError) {
      // Both failed - throw the original error
      if (import.meta.env.DEV) {
        console.error('Both primary and fallback endpoints failed:', {
          primary: primaryError,
          fallback: fallbackError,
        });
      }
      throw primaryError;
    }
  }
}

// Error types for better error handling
export class RegistryError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'RegistryError';
  }
}

/**
 * Search skills by query string
 * @param query - Search query (empty string returns all skills)
 * @param retries - Number of retry attempts remaining
 */
export async function searchSkills(
  query: string,
  retries = 3
): Promise<SkillMetadata[]> {
  // Validate and sanitize query
  const sanitizedQuery = query.trim().slice(0, 256);

  // Check cache
  const cacheKey = getCacheKey('search', { query: sanitizedQuery });
  const cached = getFromCache<SkillMetadata[]>(cacheKey);
  if (cached) return cached;

  try {
    // HyperBEAM Dynamic Reads with dryrun fallback
    const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills', {
      query: sanitizedQuery,
    });

    const response = await hyperbeamFetch<{
      results: SkillMetadata[];
      total: number;
      query: string;
    }>(url, async () => {
      // Fallback to dryrun with automatic endpoint fallback if HyperBEAM fails
      const result = await dryrunWithFallback([
        { name: 'Action', value: 'Search-Skills' },
        { name: 'Query', value: sanitizedQuery },
      ]);

      // Validate response structure
      if (!result || !result.Messages || !Array.isArray(result.Messages)) {
        throw new RegistryError(
          'Invalid response structure from registry',
          'INVALID_RESPONSE'
        );
      }

      if (result.Messages.length === 0) {
        throw new RegistryError(
          'No response from registry process',
          'EMPTY_RESPONSE'
        );
      }

      // Check for error message
      if (result.Error) {
        throw new RegistryError(
          `Registry error: ${result.Error}`,
          'REGISTRY_ERROR'
        );
      }

      // Parse JSON safely
      const rawData = JSON.parse(result.Messages[0].Data);

      // Validate expected structure - registry sends direct array
      if (!Array.isArray(rawData)) {
        throw new RegistryError(
          'Invalid response structure: expected array',
          'INVALID_STRUCTURE'
        );
      }

      return { results: rawData, total: rawData.length, query: sanitizedQuery };
    });

    // Map downloadCount to downloads for frontend compatibility
    const data = response.results.map((skill: any) => ({
      ...skill,
      downloads: skill.downloadCount ?? skill.downloads ?? 0,
    }));

    // Cache successful result
    setCache(cacheKey, data);

    return data;
  } catch (error) {
    // Retry logic with exponential backoff
    if (retries > 0) {
      const backoffDelay = 2000 * (4 - retries); // 2s, 4s, 8s
      await delay(backoffDelay);
      return searchSkills(query, retries - 1);
    }

    // Log error with context (dev only)
    if (import.meta.env.DEV) {
      console.error('Search skills failed:', {
        query: sanitizedQuery,
        error,
      });
    }

    // Re-throw as RegistryError
    if (error instanceof RegistryError) {
      throw error;
    }

    throw new RegistryError('Failed to search skills', 'NETWORK_ERROR', error);
  }
}

/**
 * List skills with pagination and filters
 */
export async function listSkills(
  options: ListSkillsOptions = {},
  retries = 3
): Promise<PaginatedSkills> {
  const {
    limit = 20,
    offset = 0,
    filterTags = [],
    filterName = '',
    featured = false,
  } = options;

  // Check cache
  const cacheKey = getCacheKey('list', options);
  const cached = getFromCache<PaginatedSkills>(cacheKey);
  if (cached) return cached;

  try {
    // HyperBEAM Dynamic Reads with dryrun fallback
    const url = buildHyperbeamUrl(LIST_SKILLS_SCRIPT_ID, 'listSkills', {
      limit,
      offset,
      filterTags:
        filterTags.length > 0 ? JSON.stringify(filterTags) : undefined,
      filterName: filterName || undefined,
      author: undefined, // Not used in current implementation
    });

    const response = await hyperbeamFetch<{
      skills: SkillMetadata[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        returned: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    }>(url, async () => {
      // Fallback to dryrun with automatic endpoint fallback if HyperBEAM fails
      const tags = [
        { name: 'Action', value: 'List-Skills' },
        { name: 'Limit', value: String(limit) },
        { name: 'Offset', value: String(offset) },
      ];

      if (filterTags.length > 0) {
        tags.push({ name: 'FilterTags', value: filterTags.join(',') });
      }

      if (filterName) {
        tags.push({ name: 'FilterName', value: filterName });
      }

      if (featured) {
        tags.push({ name: 'Featured', value: 'true' });
      }

      const result = await dryrunWithFallback(tags);

      // Validate response structure
      if (!result?.Messages?.[0]?.Data) {
        throw new RegistryError(
          'No response from registry process',
          'EMPTY_RESPONSE'
        );
      }

      return JSON.parse(result.Messages[0].Data);
    });

    // Validate structure
    if (!response.skills || !Array.isArray(response.skills)) {
      throw new RegistryError(
        'Invalid response structure',
        'INVALID_STRUCTURE'
      );
    }

    // Map downloadCount to downloads for frontend compatibility
    const data: PaginatedSkills = {
      skills: response.skills.map((skill: any) => ({
        ...skill,
        downloads: skill.downloadCount ?? skill.downloads ?? 0,
      })),
      total: response.pagination.total,
      limit: response.pagination.limit,
      offset: response.pagination.offset,
    };

    // Cache successful result
    setCache(cacheKey, data);

    return data;
  } catch (error) {
    // Retry logic
    if (retries > 0) {
      const backoffDelay = 2000 * (4 - retries);
      await delay(backoffDelay);
      return listSkills(options, retries - 1);
    }

    if (import.meta.env.DEV) {
      console.error('List skills failed:', { options, error });
    }

    if (error instanceof RegistryError) {
      throw error;
    }

    throw new RegistryError('Failed to list skills', 'NETWORK_ERROR', error);
  }
}

/**
 * Get specific skill by name and optional version
 */
export async function getSkill(
  name: string,
  version?: string,
  retries = 3
): Promise<SkillMetadata> {
  // Validate name
  const sanitizedName = name.trim();
  if (!sanitizedName) {
    throw new RegistryError('Skill name is required', 'INVALID_INPUT');
  }

  // Check cache
  const cacheKey = getCacheKey('get', { name: sanitizedName, version });
  const cached = getFromCache<SkillMetadata>(cacheKey);
  if (cached) return cached;

  try {
    // HyperBEAM Dynamic Reads with dryrun fallback
    const url = buildHyperbeamUrl(GET_SKILL_SCRIPT_ID, 'getSkill', {
      name: sanitizedName,
    });

    const response = await hyperbeamFetch<{ skill: SkillMetadata }>(
      url,
      async () => {
        // Fallback to dryrun with automatic endpoint fallback if HyperBEAM fails
        const tags = [
          { name: 'Action', value: 'Get-Skill' },
          { name: 'Name', value: sanitizedName },
        ];

        if (version) {
          tags.push({ name: 'Version', value: version });
        }

        const result = await dryrunWithFallback(tags);

        if (!result?.Messages?.[0]?.Data) {
          throw new RegistryError(
            'No response from registry process',
            'EMPTY_RESPONSE'
          );
        }

        const rawData = JSON.parse(result.Messages[0].Data);
        return { skill: rawData };
      }
    );

    // Validate skill object
    if (!response.skill || typeof response.skill !== 'object') {
      throw new RegistryError('Skill not found', 'NOT_FOUND');
    }

    // Map downloadCount to downloads for frontend compatibility
    const skill: SkillMetadata = {
      ...response.skill,
      downloads:
        (response.skill as any).downloadCount ?? response.skill.downloads ?? 0,
    };

    // Cache successful result
    setCache(cacheKey, skill);

    return skill;
  } catch (error) {
    if (retries > 0) {
      const backoffDelay = 2000 * (4 - retries);
      await delay(backoffDelay);
      return getSkill(name, version, retries - 1);
    }

    if (import.meta.env.DEV) {
      console.error('Get skill failed:', { name, version, error });
    }

    if (error instanceof RegistryError) {
      throw error;
    }

    throw new RegistryError('Failed to get skill', 'NETWORK_ERROR', error);
  }
}

/**
 * Get all versions of a skill
 */
export async function getSkillVersions(
  name: string,
  retries = 3
): Promise<VersionInfo[]> {
  const sanitizedName = name.trim();
  if (!sanitizedName) {
    throw new RegistryError('Skill name is required', 'INVALID_INPUT');
  }

  // Check cache
  const cacheKey = getCacheKey('versions', { name: sanitizedName });
  const cached = getFromCache<VersionInfo[]>(cacheKey);
  if (cached) return cached;

  try {
    // HyperBEAM Dynamic Reads with dryrun fallback
    const url = buildHyperbeamUrl(
      GET_SKILL_VERSIONS_SCRIPT_ID,
      'getSkillVersions',
      {
        name: sanitizedName,
      }
    );

    const response = await hyperbeamFetch<{
      versions: VersionInfo[];
      latest: string;
      total: number;
    }>(url, async () => {
      // Fallback to dryrun with automatic endpoint fallback if HyperBEAM fails
      const result = await dryrunWithFallback([
        { name: 'Action', value: 'Get-Skill-Versions' },
        { name: 'Name', value: sanitizedName },
      ]);

      if (!result?.Messages?.[0]?.Data) {
        throw new RegistryError(
          'No response from registry process',
          'EMPTY_RESPONSE'
        );
      }

      return JSON.parse(result.Messages[0].Data);
    });

    if (!response.versions || !Array.isArray(response.versions)) {
      throw new RegistryError(
        'Invalid response structure',
        'INVALID_STRUCTURE'
      );
    }

    // Cache successful result
    setCache(cacheKey, response.versions);

    return response.versions;
  } catch (error) {
    if (retries > 0) {
      const backoffDelay = 2000 * (4 - retries);
      await delay(backoffDelay);
      return getSkillVersions(name, retries - 1);
    }

    if (import.meta.env.DEV) {
      console.error('Get skill versions failed:', { name, error });
    }

    if (error instanceof RegistryError) {
      throw error;
    }

    throw new RegistryError(
      'Failed to get skill versions',
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Get registry information
 */
export async function getRegistryInfo(retries = 3): Promise<RegistryInfo> {
  // Check cache
  const cacheKey = getCacheKey('info', {});
  const cached = getFromCache<RegistryInfo>(cacheKey);
  if (cached) return cached;

  try {
    // HyperBEAM Dynamic Reads with dryrun fallback
    const url = buildHyperbeamUrl(INFO_SCRIPT_ID, 'info');

    const response = await hyperbeamFetch<{
      process: { name: string; version: string; adpVersion: string };
      handlers: string[];
      documentation: { adpCompliance: string; selfDocumenting: boolean };
    }>(url, async () => {
      // Fallback to dryrun with automatic endpoint fallback if HyperBEAM fails
      const result = await dryrunWithFallback([
        { name: 'Action', value: 'Info' },
      ]);

      if (!result?.Messages?.[0]?.Data) {
        throw new RegistryError(
          'No response from registry process',
          'EMPTY_RESPONSE'
        );
      }

      return JSON.parse(result.Messages[0].Data);
    });

    // Transform to RegistryInfo structure
    const info: RegistryInfo = {
      processId: REGISTRY_PROCESS_ID,
      adpVersion: response.process?.adpVersion || '1.0',
      handlers: response.handlers || [],
      totalSkills: 0, // Will be populated by registry
    };

    // Cache successful result
    setCache(cacheKey, info);

    return info;
  } catch (error) {
    if (retries > 0) {
      const backoffDelay = 2000 * (4 - retries);
      await delay(backoffDelay);
      return getRegistryInfo(retries - 1);
    }

    if (import.meta.env.DEV) {
      console.error('Get registry info failed:', { error });
    }

    if (error instanceof RegistryError) {
      throw error;
    }

    throw new RegistryError(
      'Failed to get registry info',
      'NETWORK_ERROR',
      error
    );
  }
}

/**
 * Get download statistics (aggregate or per-skill)
 */
export async function getDownloadStats(
  options: { scope: 'all' } | { skillName: string },
  retries = 3
): Promise<DownloadStats | null> {
  // Check cache
  const cacheKey = getCacheKey('downloadStats', options);
  const cached = getFromCache<DownloadStats>(cacheKey);
  if (cached) return cached;

  try {
    // HyperBEAM Dynamic Reads with dryrun fallback
    const url = buildHyperbeamUrl(
      GET_DOWNLOAD_STATS_SCRIPT_ID,
      'getDownloadStats',
      'skillName' in options ? { name: options.skillName } : {}
    );

    const response = await hyperbeamFetch<{
      skillName?: string;
      totalDownloads: number;
      totalSkills?: number; // Only in aggregate (scope=all) responses
      downloads7Days?: number; // Only in aggregate responses
      downloads30Days?: number; // Only in aggregate responses
      versions: Record<string, { version: string; downloads: number }>;
      latestVersion?: string;
    }>(url, async () => {
      // Fallback to dryrun with automatic endpoint fallback if HyperBEAM fails
      const tags = [{ name: 'Action', value: 'Get-Download-Stats' }];

      if ('scope' in options) {
        tags.push({ name: 'Scope', value: options.scope });
      } else {
        tags.push({ name: 'Name', value: options.skillName });
      }

      const result = await dryrunWithFallback(tags);

      // Validate response structure
      if (!result || !result.Messages || !Array.isArray(result.Messages)) {
        if (import.meta.env.DEV) {
          console.error('Invalid response structure from Get-Download-Stats');
        }
        return null;
      }

      if (result.Messages.length === 0) {
        if (import.meta.env.DEV) {
          console.error('No messages in Get-Download-Stats response');
        }
        return null;
      }

      return JSON.parse(result.Messages[0].Data);
    });

    if (!response) {
      return null;
    }

    // Transform HyperBEAM response to DownloadStats format
    const data: DownloadStats = {
      downloads7Days: response.downloads7Days ?? 0,
      downloads30Days: response.downloads30Days ?? 0,
      downloadsTotal: response.totalDownloads ?? 0,
      totalSkills: response.totalSkills ?? 0,
    };

    // Cache successful result
    setCache(cacheKey, data);

    return data;
  } catch (error) {
    // Retry logic with exponential backoff
    if (retries > 0) {
      const backoffDelay = 2000 * (4 - retries);
      await delay(backoffDelay);
      return getDownloadStats(options, retries - 1);
    }

    if (import.meta.env.DEV) {
      console.error('Get download stats failed:', { options, error });
    }

    // Return null for graceful degradation (don't throw error)
    return null;
  }
}

/**
 * Clear cache (useful for testing or forced refresh)
 */
export function clearCache(): void {
  cache.clear();
}
