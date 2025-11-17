import { registryClient } from '@/lib/ao-registry-client';
import type {
  SkillMetadata,
  PaginatedSkills,
  VersionInfo,
  RegistryInfo,
  ListSkillsOptions,
  DownloadStats,
} from '@/types/ao';
import type { GetSkillResponse } from '@/types/hyperbeam';

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
 */
export async function searchSkills(query: string): Promise<SkillMetadata[]> {
  // Validate and sanitize query
  const sanitizedQuery = query.trim().slice(0, 256);

  // Check cache
  const cacheKey = getCacheKey('search', { query: sanitizedQuery });
  const cached = getFromCache<SkillMetadata[]>(cacheKey);
  if (cached) return cached;

  try {
    // Use AORegistryClient (handles HyperBEAM + dryrun fallback + retry logic)
    const response = await registryClient.searchSkills(sanitizedQuery);

    // Map downloadCount to downloads for frontend compatibility
    const data = response.results.map((skill: any) => ({
      ...skill,
      downloads: skill.downloadCount ?? skill.downloads ?? 0,
    }));

    // Cache successful result
    setCache(cacheKey, data);

    return data;
  } catch (error) {
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
  options: ListSkillsOptions = {}
): Promise<PaginatedSkills> {
  // Check cache
  const cacheKey = getCacheKey('list', options);
  const cached = getFromCache<PaginatedSkills>(cacheKey);
  if (cached) return cached;

  try {
    // Use AORegistryClient (handles HyperBEAM + dryrun fallback + retry logic)
    const response = await registryClient.listSkills(options);

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
  version?: string
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
    // Use AORegistryClient (handles HyperBEAM + dryrun fallback + retry logic)
    const response: GetSkillResponse = await registryClient.getSkill(
      sanitizedName
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
export async function getSkillVersions(name: string): Promise<VersionInfo[]> {
  const sanitizedName = name.trim();
  if (!sanitizedName) {
    throw new RegistryError('Skill name is required', 'INVALID_INPUT');
  }

  // Check cache
  const cacheKey = getCacheKey('versions', { name: sanitizedName });
  const cached = getFromCache<VersionInfo[]>(cacheKey);
  if (cached) return cached;

  try {
    // Use AORegistryClient (handles HyperBEAM + dryrun fallback + retry logic)
    const response = await registryClient.getSkillVersions(sanitizedName);

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
export async function getRegistryInfo(): Promise<RegistryInfo> {
  // Check cache
  const cacheKey = getCacheKey('info', {});
  const cached = getFromCache<RegistryInfo>(cacheKey);
  if (cached) return cached;

  try {
    // Use AORegistryClient (handles HyperBEAM + dryrun fallback + retry logic)
    const response = await registryClient.getInfo();

    // Transform to RegistryInfo structure
    const info: RegistryInfo = {
      processId: response.process?.name || '',
      adpVersion: response.process?.adpVersion || '1.0',
      handlers: response.handlers || [],
      totalSkills: 0, // Will be populated by registry
    };

    // Cache successful result
    setCache(cacheKey, info);

    return info;
  } catch (error) {
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
  options: { scope: 'all' } | { skillName: string }
): Promise<DownloadStats | null> {
  // Check cache
  const cacheKey = getCacheKey('downloadStats', options);
  const cached = getFromCache<DownloadStats>(cacheKey);
  if (cached) return cached;

  try {
    // Use AORegistryClient (handles HyperBEAM + dryrun fallback + retry logic)
    const skillName = 'skillName' in options ? options.skillName : '';
    const response = await registryClient.getDownloadStats(skillName);

    if (!response) {
      return null;
    }

    // Transform HyperBEAM response to DownloadStats format
    const data: DownloadStats = {
      downloads7Days: 0, // Not provided in current implementation
      downloads30Days: 0, // Not provided in current implementation
      downloadsTotal: response.totalDownloads ?? 0,
      totalSkills: 0, // Not provided in current implementation
      skillName: response.skillName,
    };

    // Cache successful result
    setCache(cacheKey, data);

    return data;
  } catch (error) {
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
