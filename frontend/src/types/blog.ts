/**
 * Blog Post Type Definitions
 *
 * Types for blog post metadata and content management.
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

/**
 * Blog post metadata
 *
 * @property slug - URL-friendly identifier (e.g., "getting-started")
 * @property title - Post title (e.g., "Getting Started with Permamind")
 * @property date - ISO date string (e.g., "2025-01-15")
 * @property author - Author name (e.g., "Permamind Team")
 * @property tags - Category tags (e.g., ["tutorials", "getting-started"])
 * @property excerpt - Short description (1-2 sentences, max 200 chars)
 * @property readTime - Estimated reading time in minutes
 * @property featured - Whether to pin to top of listing
 * @property heroImage - Optional hero image URL for detail page
 */
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  excerpt: string;
  readTime: number;
  featured: boolean;
  heroImage?: string;
}
