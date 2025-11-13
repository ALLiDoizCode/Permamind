import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Code splitting: Lazy load route components for better performance
const Home = lazy(() =>
  import('@/pages/Home').then((module) => ({ default: module.Home }))
);
const SearchResults = lazy(() =>
  import('@/pages/SearchResults').then((module) => ({
    default: module.SearchResults,
  }))
);
const SkillDetail = lazy(() =>
  import('@/pages/SkillDetail').then((module) => ({
    default: module.SkillDetail,
  }))
);
const Documentation = lazy(() =>
  import('@/pages/Documentation').then((module) => ({
    default: module.Documentation,
  }))
);
const CliGuide = lazy(() =>
  import('@/pages/CliGuide').then((module) => ({
    default: module.CliGuide,
  }))
);
const PublishSkill = lazy(() =>
  import('@/pages/PublishSkill').then((module) => ({
    default: module.PublishSkill,
  }))
);
const McpGuide = lazy(() =>
  import('@/pages/McpGuide').then((module) => ({
    default: module.McpGuide,
  }))
);
const BlogListing = lazy(() =>
  import('@/pages/BlogListing').then((module) => ({
    default: module.BlogListing,
  }))
);
const BlogPost = lazy(() =>
  import('@/pages/BlogPost').then((module) => ({
    default: module.BlogPost,
  }))
);
const NotFound = lazy(() =>
  import('@/pages/NotFound').then((module) => ({ default: module.NotFound }))
);
const MarkdownDemo = lazy(() =>
  import('@/pages/MarkdownDemo').then((module) => ({
    default: module.MarkdownDemo,
  }))
);

/**
 * Root router configuration for Permamind
 *
 * Routes:
 * - / : Homepage with hero section and featured skills
 * - /search : Search results page with URL query parameters
 * - /skills/:name : Skill detail page with tabbed interface
 * - * : 404 Not Found page
 *
 * Uses React.lazy() for code splitting to reduce initial bundle size.
 * Each route is loaded on-demand when accessed.
 */
export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      }
    >
      <Routes>
        {/* Homepage */}
        <Route path="/" element={<Home />} />

        {/* Search results page */}
        <Route path="/search" element={<SearchResults />} />

        {/* Skill detail page with tabs */}
        <Route path="/skills/:name" element={<SkillDetail />} />

        {/* Documentation pages */}
        <Route path="/docs" element={<Documentation />} />
        <Route path="/cli-guide" element={<CliGuide />} />
        <Route path="/mcp-guide" element={<McpGuide />} />
        <Route path="/publish" element={<PublishSkill />} />

        {/* Blog listing page */}
        <Route path="/blog" element={<BlogListing />} />

        {/* Blog post detail page */}
        <Route path="/blog/:slug" element={<BlogPost />} />

        {/* Markdown demo (development only) */}
        <Route path="/markdown-demo" element={<MarkdownDemo />} />

        {/* 404 Not Found - must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
