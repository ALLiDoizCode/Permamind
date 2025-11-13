/**
 * BlogListing Page
 *
 * Displays a list of blog posts with filtering, search, and responsive grid layout.
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogPostCard } from '@/components/BlogPostCard';
import { Badge } from '@/components/ui/badge';
import { blogPosts } from '@/data/blog-posts';
import type { BlogPost } from '@/types/blog';

// Available tags for filtering
const AVAILABLE_TAGS = [
  'tutorials',
  'announcements',
  'ao-protocol',
  'arweave',
  'cli',
  'skills',
  'guides',
];

export function BlogListing() {
  const navigate = useNavigate();
  const [posts] = useState<BlogPost[]>(blogPosts);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter and sort posts
  const filteredPosts = posts
    .filter((post) => {
      // Tag filtering (OR logic - match ANY selected tag)
      const matchesTags =
        selectedTags.length === 0 ||
        post.tags.some((tag) => selectedTags.includes(tag));

      // Search filtering (case-insensitive, matches title OR excerpt)
      const matchesSearch =
        debouncedQuery === '' ||
        post.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(debouncedQuery.toLowerCase());

      return matchesTags && matchesSearch;
    })
    .sort((a, b) => {
      // Sort: Featured first, then by date (newest first)
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const handleCardClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-text">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold font-mono text-syntax-purple mb-4">
          // blog_posts
        </h1>
        <p className="text-lg text-terminal-muted">
          Tutorials, guides, and announcements from the Permamind team
        </p>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-syntax-green font-mono text-lg pointer-events-none">
              $
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search blog posts --query tutorials"
              className="w-full bg-terminal-surface border border-terminal-border rounded-lg px-12 py-3 text-terminal-text placeholder:text-terminal-muted font-mono focus:outline-none focus:border-syntax-blue focus:ring-2 focus:ring-syntax-blue/20 transition-colors"
              aria-label="Search blog posts"
            />
          </div>

          {/* Tag Filter Bar */}
          <div className="flex flex-wrap gap-2 items-center">
            {AVAILABLE_TAGS.map((tag) => {
              const isActive = selectedTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isActive ? 'cyan' : 'default'}
                  className={`cursor-pointer font-mono text-xs transition-colors ${
                    isActive
                      ? 'bg-syntax-cyan text-terminal-bg hover:bg-syntax-cyan/90'
                      : 'hover:border-syntax-cyan hover:text-syntax-cyan'
                  }`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              );
            })}

            {/* Clear Filters Button */}
            {(selectedTags.length > 0 || searchQuery) && (
              <button
                onClick={handleClearFilters}
                className="text-sm text-terminal-muted hover:text-syntax-blue font-mono transition-colors ml-2"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

      {/* Blog Posts Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-terminal-muted font-mono text-lg mb-4">
                No blog posts found
              </p>
              {(selectedTags.length > 0 || debouncedQuery) && (
                <div className="space-y-2">
                  {debouncedQuery && (
                    <p className="text-terminal-muted text-sm">
                      Search: &ldquo;{debouncedQuery}&rdquo;
                    </p>
                  )}
                  {selectedTags.length > 0 && (
                    <p className="text-terminal-muted text-sm">
                      Tags: {selectedTags.join(', ')}
                    </p>
                  )}
                  <button
                    onClick={handleClearFilters}
                    className="mt-4 px-4 py-2 bg-terminal-surface border border-syntax-blue hover:bg-syntax-blue/10 text-syntax-blue font-mono rounded-lg transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {filteredPosts.map((post) => (
                <BlogPostCard
                  key={post.slug}
                  post={post}
                  onClick={() => handleCardClick(post.slug)}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
