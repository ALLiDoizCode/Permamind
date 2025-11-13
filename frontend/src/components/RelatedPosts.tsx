/**
 * Related Posts Component
 *
 * Displays up to 3 related blog posts based on tag overlap.
 * Uses BlogPostCard component for consistent styling.
 *
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

import { useNavigate } from 'react-router-dom';
import { BlogPost } from '@/types/blog';
import { BlogPostCard } from '@/components/BlogPostCard';

interface RelatedPostsProps {
  /** Current blog post */
  currentPost: BlogPost;
  /** All available blog posts */
  allPosts: BlogPost[];
}

/**
 * Calculate related posts based on tag overlap
 * @param currentPost - The current blog post being viewed
 * @param allPosts - All available blog posts
 * @returns Array of up to 3 related posts, sorted by tag overlap (descending)
 */
function getRelatedPosts(
  currentPost: BlogPost,
  allPosts: BlogPost[]
): BlogPost[] {
  return allPosts
    .filter((post) => post.slug !== currentPost.slug) // Exclude current post
    .map((post) => ({
      post,
      overlap: currentPost.tags.filter((tag) => post.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.overlap - a.overlap) // Sort by tag overlap (descending)
    .slice(0, 3) // Take top 3
    .map(({ post }) => post);
}

export function RelatedPosts({ currentPost, allPosts }: RelatedPostsProps) {
  const navigate = useNavigate();
  const relatedPosts = getRelatedPosts(currentPost, allPosts);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-terminal-border pt-12 mt-12">
      {/* Section heading */}
      <h2 className="text-2xl font-mono text-syntax-purple mb-8 font-bold">
        {'// related_posts'}
      </h2>

      {/* Related post cards - responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {relatedPosts.map((post) => (
          <BlogPostCard
            key={post.slug}
            post={post}
            onClick={() => navigate(`/blog/${post.slug}`)}
          />
        ))}
      </div>
    </section>
  );
}
