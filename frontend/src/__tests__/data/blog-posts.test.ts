import { describe, it, expect } from 'vitest';
import { blogPosts } from '@/data/blog-posts';

describe('Blog Posts Data', () => {
  it('should have blog posts array', () => {
    expect(blogPosts).toBeDefined();
    expect(Array.isArray(blogPosts)).toBe(true);
  });

  it('should not be empty', () => {
    expect(blogPosts.length).toBeGreaterThan(0);
  });

  it('should have all required fields for each post', () => {
    blogPosts.forEach((post) => {
      expect(post).toHaveProperty('slug');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('date');
      expect(post).toHaveProperty('author');
      expect(post).toHaveProperty('tags');
      expect(post).toHaveProperty('excerpt');
      expect(post).toHaveProperty('readTime');
      expect(post).toHaveProperty('featured');

      // Validate types
      expect(typeof post.slug).toBe('string');
      expect(typeof post.title).toBe('string');
      expect(typeof post.date).toBe('string');
      expect(typeof post.author).toBe('string');
      expect(Array.isArray(post.tags)).toBe(true);
      expect(typeof post.excerpt).toBe('string');
      expect(typeof post.readTime).toBe('number');
      expect(typeof post.featured).toBe('boolean');
    });
  });

  it('should have at least one featured post', () => {
    const featuredPosts = blogPosts.filter((post) => post.featured);
    expect(featuredPosts.length).toBeGreaterThan(0);
  });

  it('should have unique slugs', () => {
    const slugs = blogPosts.map((post) => post.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('should have valid date format (YYYY-MM-DD)', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    blogPosts.forEach((post) => {
      expect(post.date).toMatch(dateRegex);
      // Verify it's a valid date
      const date = new Date(post.date);
      expect(date.toString()).not.toBe('Invalid Date');
    });
  });

  it('should have non-empty tags array', () => {
    blogPosts.forEach((post) => {
      expect(post.tags.length).toBeGreaterThan(0);
      post.tags.forEach((tag) => {
        expect(typeof tag).toBe('string');
        expect(tag.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have reasonable excerpt length', () => {
    blogPosts.forEach((post) => {
      expect(post.excerpt.length).toBeGreaterThan(0);
      expect(post.excerpt.length).toBeLessThanOrEqual(250);
    });
  });

  it('should have reasonable read time', () => {
    blogPosts.forEach((post) => {
      expect(post.readTime).toBeGreaterThan(0);
      expect(post.readTime).toBeLessThan(60); // Less than 1 hour
    });
  });
});
