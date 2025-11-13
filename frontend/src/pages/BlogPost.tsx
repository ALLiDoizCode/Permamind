/**
 * Blog Post Detail Page
 *
 * Displays individual blog posts with:
 * - Full markdown content rendering
 * - Metadata (title, author, date, tags, read time)
 * - Optional hero image
 * - Table of contents (desktop only)
 * - Social sharing buttons
 * - Related posts section
 *
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { blogPosts } from '@/data/blog-posts';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { ShareButtons } from '@/components/ShareButtons';
import { RelatedPosts } from '@/components/RelatedPosts';

/**
 * Format ISO date string to readable format
 * @param dateStr - ISO date string (e.g., "2025-01-15")
 * @returns Formatted date (e.g., "January 15, 2025")
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find blog post metadata
  const post = slug ? blogPosts.find((p) => p.slug === slug) : null;

  const handleBackToBlog = () => {
    navigate('/blog');
  };

  useEffect(() => {
    const fetchMarkdown = async () => {
      if (!slug) {
        setError('No slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/blog/${slug}.md`);
        if (!response.ok) {
          throw new Error('Blog post not found');
        }
        const content = await response.text();
        setMarkdown(content);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load blog post'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [slug]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-terminal-text">Loading...</div>
      </div>
    );
  }

  // Error state - post not found
  if (!post || error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold text-terminal-text mb-4">
            Blog post not found
          </h1>
          <p className="text-terminal-muted mb-8">
            {error || 'The blog post you are looking for does not exist.'}
          </p>
          <a
            href="/blog"
            className="text-syntax-cyan hover:text-syntax-purple underline"
          >
            ← Back to Blog
          </a>
        </div>
      </div>
    );
  }

  const baseUrl = 'https://permamind.app';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{post.title} | Permamind Blog</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={`${baseUrl}/blog/${slug}`} />

        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta
          property="og:image"
          content={post.heroImage || `${baseUrl}/og-default.jpg`}
        />
        <meta property="og:url" content={`${baseUrl}/blog/${slug}`} />
        <meta property="og:type" content="article" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <meta
          name="twitter:image"
          content={post.heroImage || `${baseUrl}/twitter-default.jpg`}
        />
      </Helmet>

      <article className="max-w-3xl mx-auto">
        {/* Back to Blog button */}
        <button
          onClick={handleBackToBlog}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBackToBlog();
            }
          }}
          className="flex items-center gap-2 text-syntax-cyan hover:text-syntax-purple transition-colors mb-8 cursor-pointer bg-transparent border-none"
        >
          ← Back to Blog
        </button>

        {/* Article Header */}
        <header className="border-b border-terminal-border pb-6 mb-8">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-terminal-text mb-4">
            {post.title}
          </h1>

          {/* Metadata line */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-terminal-muted mb-4">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{formatDate(post.date)}</span>
            <span>•</span>
            <span>{post.readTime} min read</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                className="cursor-pointer hover:bg-syntax-cyan hover:text-terminal-bg transition-colors"
                onClick={() => navigate(`/blog?tag=${tag}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/blog?tag=${tag}`);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Filter by ${tag} tag`}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Optional Hero Image */}
          {post.heroImage && (
            <img
              src={post.heroImage}
              alt={post.title}
              className="w-full max-h-96 object-cover border border-terminal-border rounded-lg mt-6"
              loading="lazy"
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </header>

        {/* Article content */}
        <div className="prose prose-invert max-w-none py-8">
          <MarkdownRenderer content={markdown} />
        </div>

        {/* Share buttons - fixed on desktop, relative on mobile */}
        <ShareButtons
          url={typeof window !== 'undefined' ? window.location.href : ''}
          title={post.title}
          position="fixed"
        />

        {/* Share buttons for mobile (below article) */}
        <div className="md:hidden border-t border-terminal-border pt-6">
          <h3 className="text-sm font-mono text-terminal-muted mb-4">
            {'// share_post'}
          </h3>
          <ShareButtons
            url={typeof window !== 'undefined' ? window.location.href : ''}
            title={post.title}
            position="relative"
          />
        </div>

        {/* Related posts section */}
        <RelatedPosts currentPost={post} allPosts={blogPosts} />
      </article>
    </div>
  );
}
