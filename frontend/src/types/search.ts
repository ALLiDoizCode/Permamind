/**
 * Search query types for URL parameter handling
 */

/**
 * Search query parameters extracted from URL
 */
export interface SearchQuery {
  q?: string; // Search query text
  tag?: string[]; // Filter by tags
  author?: string; // Filter by author
  limit?: number; // Results per page
  offset?: number; // Pagination offset
}

/**
 * Search filters for constructing queries
 */
export interface SearchFilters {
  tags?: string[];
  author?: string;
}
