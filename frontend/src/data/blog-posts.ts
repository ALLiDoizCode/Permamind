/**
 * Blog Posts Metadata
 *
 * Central registry of all blog posts with metadata.
 * Blog post content stored in public/blog/{slug}.md files.
 *
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

import { BlogPost } from '@/types/blog';

/**
 * Array of all blog posts
 *
 * To add a new blog post:
 * 1. Add metadata entry to this array
 * 2. Create markdown file at public/blog/{slug}.md
 * 3. Test locally with `npm run dev`
 *
 * Posts are displayed:
 * - Featured posts first (featured: true)
 * - Then sorted by date (newest first)
 */
export const blogPosts: BlogPost[] = [
  {
    slug: 'getting-started-with-permamind',
    title: 'Getting Started with Permamind',
    date: '2025-11-12', // Today's date
    author: 'Permamind Team',
    tags: ['tutorials', 'getting-started', 'cli'],
    excerpt:
      'Learn how to install and publish your first skill to the Permamind registry using the CLI.',
    readTime: 3, // 449 words / 200 wpm ≈ 2.2 min, rounded to 3
    featured: true,
    heroImage: '/blog-images/getting-started-with-permamind.png',
  },
  {
    slug: 'using-permamind-mcp-server',
    title: 'Using the Permamind MCP Server',
    date: '2025-11-12', // Today's date
    author: 'Permamind Team',
    tags: ['tutorials', 'mcp'],
    excerpt:
      'Set up and use the Permamind MCP Server to publish, search, and install skills directly from Claude Desktop.',
    readTime: 5, // 872 words / 200 wpm ≈ 4.4 min, rounded to 5
    featured: true,
    heroImage: '/blog-images/using-permamind-mcp-server.png',
  },
  {
    slug: 'understanding-permamind-architecture',
    title: "Understanding Permamind's Architecture",
    date: '2025-11-12', // Today's date
    author: 'Permamind Team',
    tags: ['architecture', 'arweave'],
    excerpt:
      'Learn how Permamind uses Arweave and AO networks to create a permanent, decentralized registry for Claude Code skills.',
    readTime: 6, // ~1200 words / 200 wpm = 6 min
    featured: false,
    heroImage: '/blog-images/understanding-permamind-architecture.png',
  },
];
