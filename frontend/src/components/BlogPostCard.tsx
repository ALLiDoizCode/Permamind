/**
 * BlogPostCard Component
 *
 * Displays a blog post preview card with title, date, author, tags, excerpt, and reading time.
 * Features terminal-themed styling with gradient hover effects.
 *
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types/blog';

interface BlogPostCardProps {
  post: BlogPost;
  onClick?: () => void;
}

/**
 * Format date to human-readable string (e.g., "Jan 15, 2025")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Blog post preview card component
 *
 * Features:
 * - Terminal-themed styling with gradient hover effect
 * - Displays title, date, author, tags (first 2), excerpt, reading time
 * - Keyboard accessible (Tab, Enter, Space)
 * - Click to navigate to blog post detail page
 *
 * @param post - Blog post metadata
 * @param onClick - Optional click handler for navigation
 */
export function BlogPostCard({ post, onClick }: BlogPostCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Display first 2 tags only
  const displayTags = post.tags.slice(0, 2);

  return (
    <Card
      className="group relative cursor-pointer transition-all duration-300 hover:border-syntax-cyan/50 hover:shadow-[0_0_20px_rgba(86,182,194,0.15)] overflow-hidden bg-terminal-surface/50 flex flex-col h-full"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Blog post: ${post.title}`}
    >
      <CardHeader className="pb-4 flex-1 flex flex-col">
        {/* Title with gradient on hover */}
        <h3 className="text-xl font-bold text-terminal-text mb-3 group-hover:text-syntax-cyan transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt with 3-line clamp */}
        <p className="text-terminal-muted text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {post.excerpt}
        </p>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {displayTags.map((tag) => (
            <Badge
              key={tag}
              className="font-mono text-xs bg-terminal-bg/50 text-syntax-green border-terminal-border/50 hover:bg-syntax-green/10 hover:border-syntax-green/30 transition-colors"
            >
              #{tag}
            </Badge>
          ))}
          {post.tags.length > 2 && (
            <Badge className="font-mono text-xs bg-terminal-bg/50 text-terminal-muted border-terminal-border/50">
              +{post.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 mt-auto">
        {/* Footer with metadata */}
        <div className="flex items-center justify-between text-xs text-terminal-muted font-mono border-t border-terminal-border/30 pt-3">
          <div className="flex items-center gap-2">
            <span>{formatDate(post.date)}</span>
            <span>•</span>
            <span>{post.author}</span>
          </div>
          <div className="flex items-center gap-1.5 text-syntax-blue shrink-0">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{post.readTime} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
