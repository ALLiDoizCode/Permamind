import { dryrun, REGISTRY_PROCESS_ID } from '@/lib/ao-client';
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
    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags: [
        { name: 'Action', value: 'Search-Skills' },
        { name: 'Query', value: sanitizedQuery },
      ],
    });

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
    let data: SkillMetadata[];
    try {
      const rawData = JSON.parse(result.Messages[0].Data);

      // Validate expected structure - registry sends direct array
      if (!Array.isArray(rawData)) {
        throw new RegistryError(
          'Invalid response structure: expected array',
          'INVALID_STRUCTURE'
        );
      }

      // Map downloadCount to downloads for frontend compatibility
      data = rawData.map((skill: any) => ({
        ...skill,
        downloads: skill.downloadCount ?? skill.downloads ?? 0,
      }));
    } catch (parseError) {
      throw new RegistryError(
        'Failed to parse registry response as JSON',
        'PARSE_ERROR',
        parseError
      );
    }

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

    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags,
    });

    // Validate response structure
    if (!result?.Messages?.[0]?.Data) {
      throw new RegistryError(
        'No response from registry process',
        'EMPTY_RESPONSE'
      );
    }

    // Parse JSON safely
    let data: PaginatedSkills;
    try {
      const rawData = JSON.parse(result.Messages[0].Data);

      // Validate structure
      if (!rawData.skills || !Array.isArray(rawData.skills)) {
        throw new RegistryError(
          'Invalid response structure',
          'INVALID_STRUCTURE'
        );
      }

      // Map downloadCount to downloads for frontend compatibility
      data = {
        ...rawData,
        skills: rawData.skills.map((skill: any) => ({
          ...skill,
          downloads: skill.downloadCount ?? skill.downloads ?? 0,
        })),
      };
    } catch (parseError) {
      throw new RegistryError(
        'Failed to parse registry response',
        'PARSE_ERROR',
        parseError
      );
    }

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
    const tags = [
      { name: 'Action', value: 'Get-Skill' },
      { name: 'Name', value: sanitizedName },
    ];

    if (version) {
      tags.push({ name: 'Version', value: version });
    }

    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags,
    });

    if (!result?.Messages?.[0]?.Data) {
      throw new RegistryError(
        'No response from registry process',
        'EMPTY_RESPONSE'
      );
    }

    let skill: SkillMetadata;
    try {
      const rawData = JSON.parse(result.Messages[0].Data);

      // Map downloadCount to downloads for frontend compatibility
      skill = {
        ...rawData,
        downloads: rawData.downloadCount ?? rawData.downloads ?? 0,
      };
    } catch (parseError) {
      throw new RegistryError(
        'Failed to parse registry response',
        'PARSE_ERROR',
        parseError
      );
    }

    // Validate skill object - registry sends direct object
    if (!skill || typeof skill !== 'object') {
      throw new RegistryError('Skill not found', 'NOT_FOUND');
    }

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
    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags: [
        { name: 'Action', value: 'Get-Skill-Versions' },
        { name: 'Name', value: sanitizedName },
      ],
    });

    if (!result?.Messages?.[0]?.Data) {
      throw new RegistryError(
        'No response from registry process',
        'EMPTY_RESPONSE'
      );
    }

    let data: { versions?: VersionInfo[] };
    try {
      data = JSON.parse(result.Messages[0].Data);
    } catch (parseError) {
      throw new RegistryError(
        'Failed to parse registry response',
        'PARSE_ERROR',
        parseError
      );
    }

    if (!data.versions || !Array.isArray(data.versions)) {
      throw new RegistryError(
        'Invalid response structure',
        'INVALID_STRUCTURE'
      );
    }

    // Cache successful result
    setCache(cacheKey, data.versions);

    return data.versions;
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
    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags: [{ name: 'Action', value: 'Info' }],
    });

    if (!result?.Messages?.[0]?.Data) {
      throw new RegistryError(
        'No response from registry process',
        'EMPTY_RESPONSE'
      );
    }

    let data: { process?: { adpVersion?: string }; handlers?: string[] };
    try {
      data = JSON.parse(result.Messages[0].Data);
    } catch (parseError) {
      throw new RegistryError(
        'Failed to parse registry response',
        'PARSE_ERROR',
        parseError
      );
    }

    // Transform to RegistryInfo structure
    const info: RegistryInfo = {
      processId: REGISTRY_PROCESS_ID,
      adpVersion: data.process?.adpVersion || '1.0',
      handlers: data.handlers || [],
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
    const tags = [{ name: 'Action', value: 'Get-Download-Stats' }];

    if ('scope' in options) {
      tags.push({ name: 'Scope', value: options.scope });
    } else {
      tags.push({ name: 'Name', value: options.skillName });
    }

    const result = await dryrun({
      process: REGISTRY_PROCESS_ID,
      tags,
    });

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

    // Parse JSON safely - handle HTML error responses
    let data: DownloadStats;
    try {
      data = JSON.parse(result.Messages[0].Data);
    } catch (parseError) {
      // HTML error responses will fail JSON.parse
      if (import.meta.env.DEV) {
        console.error('Failed to parse Get-Download-Stats response:', parseError);
        if (
          typeof result.Messages[0].Data === 'string' &&
          result.Messages[0].Data.trim().startsWith('<')
        ) {
          console.error('Received HTML error response from CU');
        }
      }
      return null;
    }

    // Validate data structure
    if (
      typeof data.downloads7Days !== 'number' ||
      typeof data.downloads30Days !== 'number' ||
      typeof data.downloadsTotal !== 'number'
    ) {
      if (import.meta.env.DEV) {
        console.error('Invalid download stats structure:', data);
      }
      return null;
    }

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
