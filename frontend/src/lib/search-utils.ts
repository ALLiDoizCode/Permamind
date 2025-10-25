import type { SearchQuery, SearchFilters } from '@/types/search';

/**
 * Build search URL with query and filters
 *
 * @param query - Search query text
 * @param filters - Optional search filters (tags, author)
 * @returns URL path with query parameters
 *
 * @example
 * buildSearchUrl('blockchain') // => '/search?q=blockchain'
 * buildSearchUrl('ao', { tags: ['protocol'] }) // => '/search?q=ao&tag=protocol'
 */
export function buildSearchUrl(query: string, filters?: SearchFilters): string {
  const params = new URLSearchParams();

  if (query.trim()) {
    params.set('q', query.trim());
  }

  if (filters?.tags && filters.tags.length > 0) {
    // For simplicity, we'll use comma-separated tags
    // Alternative: Use multiple tag parameters
    params.set('tag', filters.tags.join(','));
  }

  if (filters?.author) {
    params.set('author', filters.author.trim());
  }

  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : '/search';
}

/**
 * Parse search parameters from URLSearchParams
 *
 * @param searchParams - URLSearchParams from useSearchParams()
 * @returns Parsed SearchQuery object
 *
 * @example
 * const [searchParams] = useSearchParams();
 * const query = parseSearchParams(searchParams);
 * // { q: 'blockchain', tag: ['ao', 'protocol'] }
 */
export function parseSearchParams(searchParams: URLSearchParams): SearchQuery {
  const query: SearchQuery = {};

  const q = searchParams.get('q');
  if (q) {
    query.q = q;
  }

  const tag = searchParams.get('tag');
  if (tag) {
    // Split comma-separated tags
    query.tag = tag
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const author = searchParams.get('author');
  if (author) {
    query.author = author;
  }

  const limit = searchParams.get('limit');
  if (limit) {
    const parsed = parseInt(limit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      query.limit = parsed;
    }
  }

  const offset = searchParams.get('offset');
  if (offset) {
    const parsed = parseInt(offset, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      query.offset = parsed;
    }
  }

  return query;
}

/**
 * Update search URL with new parameters (browser navigation)
 *
 * @param updates - Partial search query updates
 * @param navigate - React Router navigate function
 *
 * @example
 * updateSearchUrl({ q: 'new query' }, navigate);
 */
export function updateSearchUrl(
  updates: Partial<SearchQuery>,
  navigate: (path: string) => void
): void {
  const filters: SearchFilters = {};

  if (updates.tag) {
    filters.tags = updates.tag;
  }

  if (updates.author) {
    filters.author = updates.author;
  }

  const url = buildSearchUrl(updates.q || '', filters);
  navigate(url);
}
