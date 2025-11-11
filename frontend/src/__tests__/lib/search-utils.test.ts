import { describe, it, expect, vi } from 'vitest';
import {
  buildSearchUrl,
  parseSearchParams,
  updateSearchUrl,
} from '@/lib/search-utils';

describe('search-utils', () => {
  describe('buildSearchUrl', () => {
    it('builds URL with query only', () => {
      const url = buildSearchUrl('blockchain');
      expect(url).toBe('/search?q=blockchain');
    });

    it('builds URL with query and single tag', () => {
      const url = buildSearchUrl('ao', { tags: ['protocol'] });
      expect(url).toBe('/search?q=ao&tag=protocol');
    });

    it('builds URL with query and multiple tags', () => {
      const url = buildSearchUrl('skills', { tags: ['ao', 'blockchain'] });
      expect(url).toBe('/search?q=skills&tag=ao%2Cblockchain');
    });

    it('builds URL with query and author', () => {
      const url = buildSearchUrl('test', { author: 'Permamind Team' });
      expect(url).toBe('/search?q=test&author=Permamind+Team');
    });

    it('builds URL with all filters', () => {
      const url = buildSearchUrl('search', {
        tags: ['tag1', 'tag2'],
        author: 'author',
      });
      expect(url).toBe('/search?q=search&tag=tag1%2Ctag2&author=author');
    });

    it('handles empty query', () => {
      const url = buildSearchUrl('');
      expect(url).toBe('/search');
    });

    it('trims whitespace from query', () => {
      const url = buildSearchUrl('  trimmed  ');
      expect(url).toBe('/search?q=trimmed');
    });

    it('handles empty tags array', () => {
      const url = buildSearchUrl('test', { tags: [] });
      expect(url).toBe('/search?q=test');
    });
  });

  describe('parseSearchParams', () => {
    it('parses query parameter', () => {
      const params = new URLSearchParams('q=blockchain');
      const result = parseSearchParams(params);
      expect(result.q).toBe('blockchain');
    });

    it('parses single tag', () => {
      const params = new URLSearchParams('tag=ao');
      const result = parseSearchParams(params);
      expect(result.tag).toEqual(['ao']);
    });

    it('parses comma-separated tags', () => {
      const params = new URLSearchParams('tag=ao,protocol,blockchain');
      const result = parseSearchParams(params);
      expect(result.tag).toEqual(['ao', 'protocol', 'blockchain']);
    });

    it('parses author parameter', () => {
      const params = new URLSearchParams('author=Permamind Team');
      const result = parseSearchParams(params);
      expect(result.author).toBe('Permamind Team');
    });

    it('parses limit parameter', () => {
      const params = new URLSearchParams('limit=10');
      const result = parseSearchParams(params);
      expect(result.limit).toBe(10);
    });

    it('parses offset parameter', () => {
      const params = new URLSearchParams('offset=20');
      const result = parseSearchParams(params);
      expect(result.offset).toBe(20);
    });

    it('parses all parameters', () => {
      const params = new URLSearchParams(
        'q=test&tag=tag1,tag2&author=author&limit=5&offset=10'
      );
      const result = parseSearchParams(params);

      expect(result).toEqual({
        q: 'test',
        tag: ['tag1', 'tag2'],
        author: 'author',
        limit: 5,
        offset: 10,
      });
    });

    it('handles empty params', () => {
      const params = new URLSearchParams('');
      const result = parseSearchParams(params);
      expect(result).toEqual({});
    });

    it('ignores invalid limit', () => {
      const params = new URLSearchParams('limit=invalid');
      const result = parseSearchParams(params);
      expect(result.limit).toBeUndefined();
    });

    it('ignores negative limit', () => {
      const params = new URLSearchParams('limit=-5');
      const result = parseSearchParams(params);
      expect(result.limit).toBeUndefined();
    });

    it('ignores negative offset', () => {
      const params = new URLSearchParams('offset=-10');
      const result = parseSearchParams(params);
      expect(result.offset).toBeUndefined();
    });

    it('trims whitespace from tags', () => {
      const params = new URLSearchParams('tag= tag1 , tag2 ');
      const result = parseSearchParams(params);
      expect(result.tag).toEqual(['tag1', 'tag2']);
    });
  });

  describe('updateSearchUrl', () => {
    it('updates URL with new query', () => {
      const navigate = vi.fn();
      updateSearchUrl({ q: 'new query' }, navigate);

      expect(navigate).toHaveBeenCalledWith('/search?q=new+query');
    });

    it('updates URL with tags', () => {
      const navigate = vi.fn();
      updateSearchUrl({ tag: ['tag1', 'tag2'] }, navigate);

      expect(navigate).toHaveBeenCalledWith('/search?tag=tag1%2Ctag2');
    });

    it('updates URL with author', () => {
      const navigate = vi.fn();
      updateSearchUrl({ author: 'Test Author' }, navigate);

      expect(navigate).toHaveBeenCalledWith('/search?author=Test+Author');
    });

    it('updates URL with multiple parameters', () => {
      const navigate = vi.fn();
      updateSearchUrl(
        {
          q: 'search',
          tag: ['tag1'],
          author: 'author',
        },
        navigate
      );

      expect(navigate).toHaveBeenCalledWith(
        '/search?q=search&tag=tag1&author=author'
      );
    });
  });
});
