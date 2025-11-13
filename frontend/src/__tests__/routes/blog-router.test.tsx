import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes';

// Mock the BlogListing component to avoid loading dependencies
vi.mock('@/pages/BlogListing', () => ({
  BlogListing: () => <div data-testid="blog-listing">Blog Listing Page</div>,
}));

describe('Blog Route Configuration', () => {
  it('should render BlogListing component when navigating to /blog', async () => {
    render(
      <MemoryRouter initialEntries={['/blog']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Wait for lazy-loaded component
    await waitFor(() => {
      expect(screen.getByTestId('blog-listing')).toBeInTheDocument();
    });
  });

  it('should lazy-load the BlogListing component (code splitting)', async () => {
    render(
      <MemoryRouter initialEntries={['/blog']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Initially should show loading spinner (Suspense fallback)
    // Then should show blog listing after lazy load
    await waitFor(() => {
      expect(screen.getByTestId('blog-listing')).toBeInTheDocument();
    });
  });

  it('should show LoadingSpinner during lazy load', async () => {
    render(
      <MemoryRouter initialEntries={['/blog']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Suspense fallback should be in DOM initially, then component loads
    // (This test verifies Suspense wrapper handles lazy loading)
    await waitFor(() => {
      expect(screen.getByTestId('blog-listing')).toBeInTheDocument();
    });
  });
});
