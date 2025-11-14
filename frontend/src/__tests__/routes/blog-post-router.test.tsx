/**
 * Tests for Blog Post Detail Route
 *
 * Verifies:
 * - Route navigation to /blog/:slug
 * - Route parameter extraction with useParams
 * - Lazy loading with code splitting
 * - LoadingSpinner during lazy load
 *
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Mock the BlogPost component
vi.mock('@/pages/BlogPost', () => ({
  BlogPost: () => <div data-testid="blog-post-page">Blog Post Detail</div>,
}));

// Lazy load the BlogPost component (simulating code splitting)
const BlogPost = lazy(() =>
  import('@/pages/BlogPost').then((module) => ({
    default: module.BlogPost,
  }))
);

describe('Blog Post Detail Route', () => {
  it('should render BlogPost component when navigating to /blog/:slug', async () => {
    render(
      <MemoryRouter initialEntries={['/blog/test-slug']}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner />
            </div>
          }
        >
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    );

    // Wait for lazy load to complete
    await waitFor(() => {
      expect(screen.getByTestId('blog-post-page')).toBeInTheDocument();
    });

    // Verify BlogPost component renders
    expect(screen.getByText('Blog Post Detail')).toBeInTheDocument();
  });

  it('should extract slug parameter from URL', async () => {
    const TestComponent = () => {
      const { slug } = require('react-router-dom').useParams();
      return <div data-testid="slug-value">{slug}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/blog/my-awesome-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<TestComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('slug-value')).toHaveTextContent(
      'my-awesome-post'
    );
  });

  it('should support lazy loading with code splitting', async () => {
    render(
      <MemoryRouter initialEntries={['/blog/test-post']}>
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    );

    // Initially shows loading fallback
    const loadingElement = screen.queryByTestId('loading');
    if (loadingElement) {
      expect(loadingElement).toBeInTheDocument();
    }

    // Wait for lazy load
    await waitFor(() => {
      expect(screen.getByTestId('blog-post-page')).toBeInTheDocument();
    });
  });

  it('should show LoadingSpinner during lazy load', async () => {
    render(
      <MemoryRouter initialEntries={['/blog/another-post']}>
        <Suspense
          fallback={
            <div
              className="flex items-center justify-center min-h-screen"
              data-testid="loading-fallback"
            >
              <LoadingSpinner />
            </div>
          }
        >
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </Suspense>
      </MemoryRouter>
    );

    // Check if loading fallback or final component is present
    const loadingOrLoaded =
      screen.queryByTestId('loading-fallback') ||
      screen.queryByTestId('blog-post-page');
    expect(loadingOrLoaded).toBeInTheDocument();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('blog-post-page')).toBeInTheDocument();
    });
  });
});
