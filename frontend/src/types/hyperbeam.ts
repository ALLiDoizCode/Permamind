/**
 * HyperBEAM Dynamic Read Response Types
 *
 * TypeScript interfaces for HyperBEAM HTTP API responses.
 * These types match the JSON structures returned by dynamic read scripts.
 *
 * Reference: ao-process/hyperbeam/SCRIPT_REFERENCE.md
 */

import { SkillMetadata } from './ao';

/**
 * Search Skills Response
 * Endpoint: searchSkills
 * Script: hjL7_fEj2onw1Uhyk4bmMum8lewZjWrn01IZXsY1utk
 */
export interface SearchSkillsResponse {
  /** Array of matching skills (latest versions only) */
  results: SkillMetadata[];
  /** Total number of matching skills */
  total: number;
  /** Original search query */
  query: string;
}

/**
 * Get Skill Response
 * Endpoint: getSkill
 * Script: oH8kYBrZAv2J1O2htWCMkyaUhdG1IddSFwr3lzCAfEA
 */
export interface GetSkillResponse {
  /** Skill metadata (present on success) */
  skill?: SkillMetadata;
  /** HTTP status code (200, 400, 404) */
  status: number;
  /** Error message (present on failure) */
  error?: string;
}

/**
 * Pagination Metadata
 * Used in list-skills and other paginated endpoints
 */
export interface PaginationMetadata {
  /** Total number of skills (across all pages) */
  total: number;
  /** Results per page (requested) */
  limit: number;
  /** Pagination offset (requested) */
  offset: number;
  /** Actual number of results returned in this page */
  returned: number;
  /** Whether there's a next page available */
  hasNextPage: boolean;
  /** Whether there's a previous page available */
  hasPrevPage: boolean;
}

/**
 * List Skills Response
 * Endpoint: listSkills
 * Script: gxeEPGrxbfh4Uf7NEbPdE2iSTgALaz58RX8zrAreAqs
 */
export interface ListSkillsResponse {
  /** Array of skills (paginated) */
  skills: SkillMetadata[];
  /** Pagination metadata */
  pagination: PaginationMetadata;
  /** HTTP status code */
  status: number;
}

/**
 * Get Skill Versions Response
 * Endpoint: getSkillVersions
 * Script: qRlxuHc_NnhOnfql1oaJ1CrTbjViDOXcLbkXZpLmJGo
 */
export interface SkillVersionsResponse {
  /** Array of all versions (sorted latest first) */
  versions: SkillMetadata[];
  /** Latest version string (e.g., "1.2.0") */
  latest: string;
  /** Total number of versions */
  total: number;
  /** HTTP status code (200, 400, 404) */
  status: number;
  /** Error message (present on failure) */
  error?: string;
}

/**
 * Download Stats Response
 * Endpoint: getDownloadStats
 * Script: pbdp0HUfN3pnJzYo0mRkF-n9D1lGsg6NYRREEo5BvZ8
 */
export interface DownloadStatsResponse {
  /** Skill name (for per-skill queries) */
  skillName?: string;
  /** Total downloads across all skills (for scope=all) */
  totalDownloads?: number;
  /** Per-version download stats (for per-skill queries) */
  versions?: Array<{
    version: string;
    downloads: number;
  }>;
  /** HTTP status code (200, 400, 404) */
  status: number;
  /** Error message (present on failure) */
  error?: string;
}

/**
 * Info Response (ADP v1.0 Compliant)
 * Endpoint: info
 * Script: fKI_pC6Mo0iRad3CADOkdwPHxTxL3OXfML5curbh3x4
 */
export interface InfoResponse {
  /** Process metadata */
  process: {
    /** Process name */
    name: string;
    /** Process version */
    version: string;
    /** ADP protocol version */
    adpVersion: string;
    /** Process capabilities (list of actions) */
    capabilities: string[];
    /** Message schemas for all handlers */
    messageSchemas: Record<string, unknown>;
  };
  /** List of handler names */
  handlers: string[];
  /** Documentation metadata */
  documentation: {
    /** ADP compliance version */
    adpCompliance: string;
    /** Self-documenting capability */
    selfDocumenting: boolean;
  };
  /** HTTP status code */
  status: number;
}

/**
 * List Skills Options
 * Query parameters for listSkills endpoint
 */
export interface ListSkillsOptions {
  /** Results per page (1-100, default: 10) */
  limit?: number;
  /** Pagination offset (default: 0) */
  offset?: number;
  /** Filter by author (case-insensitive exact match) */
  author?: string;
  /** Filter by tags (AND logic - skill must have ALL tags) */
  filterTags?: string[];
  /** Filter by name pattern (case-insensitive substring) */
  filterName?: string;
}

/**
 * HyperBEAM Error Context
 * Additional context for error handling and debugging
 */
export interface HyperBEAMErrorContext {
  /** HyperBEAM URL that failed */
  url: string;
  /** HTTP status code (if available) */
  statusCode?: number;
  /** Error type classification */
  errorType: 'network' | 'http' | 'parse' | 'timeout' | 'unknown';
  /** Original error object */
  originalError?: Error;
  /** Timestamp of error occurrence */
  timestamp: number;
}
