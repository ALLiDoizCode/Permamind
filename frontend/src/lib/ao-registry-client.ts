/**
 * AO Registry Client - HyperBEAM HTTP Client
 *
 * This class provides HTTP-based access to the AO Registry using HyperBEAM
 * dynamic reads. It offers 50%+ faster performance vs traditional dryrun queries
 * with automatic fallback to dryrun when HyperBEAM infrastructure fails.
 *
 * Architecture:
 * - Primary: HyperBEAM HTTP GET (target <500ms)
 * - Fallback: @permaweb/aoconnect dryrun (baseline ~2s)
 *
 * Reference: docs/stories/15.3.story.md, ao-process/hyperbeam/FRONTEND_INTEGRATION.md
 */

import {
  buildHyperbeamUrl,
  SEARCH_SKILLS_SCRIPT_ID,
  GET_SKILL_SCRIPT_ID,
  LIST_SKILLS_SCRIPT_ID,
  GET_SKILL_VERSIONS_SCRIPT_ID,
  GET_DOWNLOAD_STATS_SCRIPT_ID,
  INFO_SCRIPT_ID,
} from './hyperbeam-client';
import {
  HyperBEAMError,
  NetworkError,
  HTTPError,
  ParseError,
  TimeoutError,
  classifyError,
} from './hyperbeam-errors';
import { dryrun, REGISTRY_PROCESS_ID } from './ao-client';
import type {
  SearchSkillsResponse,
  GetSkillResponse,
  ListSkillsResponse,
  ListSkillsOptions,
  SkillVersionsResponse,
  DownloadStatsResponse,
  InfoResponse,
} from '../types/hyperbeam';
import type { AODryrunResult } from '../types/ao';

/**
 * AORegistryClient Class
 * HTTP client for AO Registry with HyperBEAM integration
 */
export class AORegistryClient {
  private readonly timeout: number = 5000; // 5 second timeout
  private readonly maxRetries: number = 3;
  private readonly retryDelays: number[] = [100, 200, 400]; // Exponential backoff

  constructor() {
    // Configuration loaded from environment via hyperbeam-client
  }

  /**
   * Search Skills
   * @param query - Search term (empty returns all skills)
   * @returns Search results with metadata
   */
  async searchSkills(query: string = ''): Promise<SearchSkillsResponse> {
    const url = buildHyperbeamUrl(SEARCH_SKILLS_SCRIPT_ID, 'searchSkills', {
      query,
    });

    return this._fetchWithFallback<SearchSkillsResponse>(
      url,
      async () => {
        // Fallback to dryrun
        const result = await dryrun({
          process: REGISTRY_PROCESS_ID,
          tags: [
            { name: 'Action', value: 'Search' },
            { name: 'Query', value: query },
          ],
        });

        return this._parseDryrunSearchResponse(result);
      },
      'searchSkills'
    );
  }

  /**
   * Get Skill Details
   * @param name - Skill name (case-sensitive)
   * @returns Skill metadata or error
   */
  async getSkill(name: string): Promise<GetSkillResponse> {
    const url = buildHyperbeamUrl(GET_SKILL_SCRIPT_ID, 'getSkill', { name });

    return this._fetchWithFallback<GetSkillResponse>(
      url,
      async () => {
        // Fallback to dryrun
        const result = await dryrun({
          process: REGISTRY_PROCESS_ID,
          tags: [
            { name: 'Action', value: 'Get' },
            { name: 'Name', value: name },
          ],
        });

        return this._parseDryrunGetResponse(result);
      },
      'getSkill'
    );
  }

  /**
   * List Skills with Pagination
   * @param options - Pagination and filtering options
   * @returns Paginated skill list
   */
  async listSkills(
    options: ListSkillsOptions = {}
  ): Promise<ListSkillsResponse> {
    const { limit = 10, offset = 0, author, filterTags, filterName } = options;

    const queryParams: Record<string, string | number> = { limit, offset };
    if (author) queryParams.author = author;
    if (filterName) queryParams.filterName = filterName;
    if (filterTags && filterTags.length > 0) {
      queryParams.filterTags = JSON.stringify(filterTags);
    }

    const url = buildHyperbeamUrl(
      LIST_SKILLS_SCRIPT_ID,
      'listSkills',
      queryParams
    );

    return this._fetchWithFallback<ListSkillsResponse>(
      url,
      async () => {
        // Fallback to dryrun
        const tags: Array<{ name: string; value: string }> = [
          { name: 'Action', value: 'List' },
          { name: 'Limit', value: String(limit) },
          { name: 'Offset', value: String(offset) },
        ];
        if (author) tags.push({ name: 'Author', value: author });
        if (filterName) tags.push({ name: 'FilterName', value: filterName });
        if (filterTags && filterTags.length > 0) {
          filterTags.forEach((tag) =>
            tags.push({ name: 'FilterTag', value: tag })
          );
        }

        const result = await dryrun({
          process: REGISTRY_PROCESS_ID,
          tags,
        });

        return this._parseDryrunListResponse(result);
      },
      'listSkills'
    );
  }

  /**
   * Get Skill Version History
   * @param name - Skill name
   * @returns All versions (sorted latest first)
   */
  async getSkillVersions(name: string): Promise<SkillVersionsResponse> {
    const url = buildHyperbeamUrl(
      GET_SKILL_VERSIONS_SCRIPT_ID,
      'getSkillVersions',
      { name }
    );

    return this._fetchWithFallback<SkillVersionsResponse>(
      url,
      async () => {
        // Fallback to dryrun
        const result = await dryrun({
          process: REGISTRY_PROCESS_ID,
          tags: [
            { name: 'Action', value: 'GetVersions' },
            { name: 'Name', value: name },
          ],
        });

        return this._parseDryrunVersionsResponse(result);
      },
      'getSkillVersions'
    );
  }

  /**
   * Get Download Statistics
   * @param name - Skill name
   * @returns Download stats per version
   */
  async getDownloadStats(name: string): Promise<DownloadStatsResponse> {
    const url = buildHyperbeamUrl(
      GET_DOWNLOAD_STATS_SCRIPT_ID,
      'getDownloadStats',
      { name }
    );

    return this._fetchWithFallback<DownloadStatsResponse>(
      url,
      async () => {
        // Fallback to dryrun
        const result = await dryrun({
          process: REGISTRY_PROCESS_ID,
          tags: [
            { name: 'Action', value: 'GetDownloadStats' },
            { name: 'Name', value: name },
          ],
        });

        return this._parseDryrunDownloadStatsResponse(result);
      },
      'getDownloadStats'
    );
  }

  /**
   * Get Registry Info (ADP v1.0 compliant)
   * @returns Registry metadata
   */
  async getInfo(): Promise<InfoResponse> {
    const url = buildHyperbeamUrl(INFO_SCRIPT_ID, 'info');

    return this._fetchWithFallback<InfoResponse>(
      url,
      async () => {
        // Fallback to dryrun
        const result = await dryrun({
          process: REGISTRY_PROCESS_ID,
          tags: [{ name: 'Action', value: 'Info' }],
        });

        return this._parseDryrunInfoResponse(result);
      },
      'getInfo'
    );
  }

  /**
   * Fetch with Retry and Fallback
   * @param url - HyperBEAM URL
   * @param fallbackFn - Dryrun fallback function
   * @param methodName - Method name for logging
   * @returns Parsed JSON response
   * @throws HyperBEAMError if both HyperBEAM and fallback fail
   */
  private async _fetchWithFallback<T>(
    url: string,
    fallbackFn: () => Promise<T>,
    methodName: string
  ): Promise<T> {
    try {
      // Try HyperBEAM with retry logic
      return await this._fetchWithRetry<T>(url);
    } catch (error) {
      const hyperbeamError = classifyError(error, url);

      console.warn(
        `[AORegistryClient.${methodName}] HyperBEAM failed, attempting dryrun fallback:`,
        {
          error: hyperbeamError.message,
          errorType: hyperbeamError.context.errorType,
          statusCode: hyperbeamError.context.statusCode,
        }
      );

      // If fallback function provided, execute it
      try {
        const fallbackResult = await fallbackFn();
        console.info(
          `[AORegistryClient.${methodName}] Dryrun fallback successful`
        );
        return fallbackResult;
      } catch (fallbackError) {
        console.error(
          `[AORegistryClient.${methodName}] Both HyperBEAM and dryrun failed:`,
          {
            hyperbeam: hyperbeamError.message,
            fallback: fallbackError,
          }
        );
        // Throw original HyperBEAM error
        throw hyperbeamError;
      }
    }
  }

  /**
   * Fetch with Retry Logic
   * @param url - HyperBEAM URL
   * @returns Parsed JSON response
   * @throws HyperBEAMError after max retries
   */
  private async _fetchWithRetry<T>(url: string): Promise<T> {
    let lastError: HyperBEAMError | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this._fetch<T>(url);
      } catch (error) {
        lastError = classifyError(error, url);

        // Don't retry client errors (4xx) except timeout
        if (!lastError.isRetryable()) {
          throw lastError;
        }

        // Log retry attempt
        if (attempt < this.maxRetries - 1) {
          const delay = this.retryDelays[attempt];
          console.debug(
            `[AORegistryClient._fetchWithRetry] Retry attempt ${attempt + 1}/${this.maxRetries} after ${delay}ms:`,
            lastError.message
          );
          await this._sleep(delay);
        }
      }
    }

    // Max retries exceeded
    throw lastError;
  }

  /**
   * Execute HTTP Fetch with Timeout
   * @param url - HyperBEAM URL
   * @returns Parsed JSON response
   * @throws NetworkError, HTTPError, ParseError, or TimeoutError
   */
  private async _fetch<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.timeout
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Validate HTTP response
      if (!response.ok) {
        throw new HTTPError(url, response.status, response.statusText);
      }

      // Parse JSON response
      try {
        const data = (await response.json()) as T;

        // NOTE: Don't throw errors for 4xx/5xx status in JSON response body
        // These are application-level errors (e.g., skill not found)
        // and should be returned to the caller to handle
        // Only throw HTTPError for HTTP-level errors (response.ok === false)

        return data;
      } catch (parseError) {
        if (parseError instanceof HTTPError) {
          throw parseError;
        }
        throw new ParseError(url, parseError as Error);
      }
    } catch (error) {
      clearTimeout(timeoutId);

      // Timeout error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new TimeoutError(url, this.timeout);
      }

      // Network error (fetch failed)
      if (error instanceof TypeError) {
        throw new NetworkError(url, error);
      }

      // Re-throw classified errors
      if (error instanceof HyperBEAMError) {
        throw error;
      }

      // Unknown error
      throw classifyError(error, url);
    }
  }

  /**
   * Sleep Utility for Retry Delays
   * @param ms - Milliseconds to sleep
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse Dryrun Response - Search
   */
  private _parseDryrunSearchResponse(
    result: AODryrunResult
  ): SearchSkillsResponse {
    if (!result.Messages || result.Messages.length === 0) {
      return { results: [], total: 0, query: '' };
    }

    const data = JSON.parse(result.Messages[0].Data);
    return {
      results: data.results || [],
      total: data.total || 0,
      query: data.query || '',
    };
  }

  /**
   * Parse Dryrun Response - Get Skill
   */
  private _parseDryrunGetResponse(result: AODryrunResult): GetSkillResponse {
    if (!result.Messages || result.Messages.length === 0) {
      return { status: 404, error: 'Skill not found' };
    }

    const data = JSON.parse(result.Messages[0].Data);
    return {
      skill: data.skill,
      status: data.status || 200,
      error: data.error,
    };
  }

  /**
   * Parse Dryrun Response - List Skills
   */
  private _parseDryrunListResponse(
    result: AODryrunResult
  ): ListSkillsResponse {
    if (!result.Messages || result.Messages.length === 0) {
      return {
        skills: [],
        pagination: {
          total: 0,
          limit: 10,
          offset: 0,
          returned: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        status: 200,
      };
    }

    const data = JSON.parse(result.Messages[0].Data);
    return {
      skills: data.skills || [],
      pagination: data.pagination || {
        total: 0,
        limit: 10,
        offset: 0,
        returned: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      status: data.status || 200,
    };
  }

  /**
   * Parse Dryrun Response - Skill Versions
   */
  private _parseDryrunVersionsResponse(
    result: AODryrunResult
  ): SkillVersionsResponse {
    if (!result.Messages || result.Messages.length === 0) {
      return {
        versions: [],
        latest: '',
        total: 0,
        status: 404,
        error: 'Skill not found',
      };
    }

    const data = JSON.parse(result.Messages[0].Data);
    return {
      versions: data.versions || [],
      latest: data.latest || '',
      total: data.total || 0,
      status: data.status || 200,
      error: data.error,
    };
  }

  /**
   * Parse Dryrun Response - Download Stats
   */
  private _parseDryrunDownloadStatsResponse(
    result: AODryrunResult
  ): DownloadStatsResponse {
    if (!result.Messages || result.Messages.length === 0) {
      return { status: 404, error: 'Stats not found' };
    }

    const data = JSON.parse(result.Messages[0].Data);
    return {
      skillName: data.skillName,
      totalDownloads: data.totalDownloads,
      versions: data.versions,
      status: data.status || 200,
      error: data.error,
    };
  }

  /**
   * Parse Dryrun Response - Info
   */
  private _parseDryrunInfoResponse(result: AODryrunResult): InfoResponse {
    if (!result.Messages || result.Messages.length === 0) {
      throw new Error('No info response');
    }

    const data = JSON.parse(result.Messages[0].Data);
    return {
      process: data.process || {},
      handlers: data.handlers || [],
      documentation: data.documentation || {},
      status: data.status || 200,
    } as InfoResponse;
  }
}

/**
 * Singleton Instance
 * Export a default instance for convenience
 */
export const registryClient = new AORegistryClient();
