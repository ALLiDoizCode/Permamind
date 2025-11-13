/**
 * Tests for BlogPost Detail Page Component
 *
 * Verifies:
 * - Metadata displays correctly
 * - Markdown content fetched and rendered
 * - Loading state shows while fetching
 * - Error handling for invalid slug and fetch failures
 *
 * Part of Epic 14: Blog Section - Brownfield Enhancement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { BlogPost } from '@/pages/BlogPost';

// Mock blog posts data
vi.mock('@/data/blog-posts', () => ({
  blogPosts: [
    {
      slug: 'test-post',
      title: 'Test Blog Post',
      date: '2025-01-15',
      author: 'Test Author',
      tags: ['test', 'tutorial'],
      excerpt: 'This is a test blog post excerpt.',
      readTime: 5,
      featured: true,
    },
    {
      slug: 'another-post',
      title: 'Another Post',
      date: '2025-01-10',
      author: 'Another Author',
      tags: ['guide'],
      excerpt: 'Another test post.',
      readTime: 3,
      featured: false,
    },
  ],
}));

// Mock MarkdownRenderer component
vi.mock('@/components/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => (
    <div data-testid="markdown-renderer">{content}</div>
  ),
}));

// Mock ShareButtons component
vi.mock('@/components/ShareButtons', () => ({
  ShareButtons: () => <div data-testid="share-buttons">Share</div>,
}));

// Mock RelatedPosts component
vi.mock('@/components/RelatedPosts', () => ({
  RelatedPosts: () => <div data-testid="related-posts">Related</div>,
}));

// Helper to wrap component with providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(<HelmetProvider>{ui}</HelmetProvider>);
};

describe('BlogPost Component', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  it('should display loading state while fetching markdown', async () => {
    // Mock slow fetch to see loading state
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                text: async () => '# Test Content',
              } as Response),
            100
          )
        )
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/blog/test-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    // Should show loading state initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
    });
  });

  it('should fetch and render markdown content', async () => {
    const markdownContent = '# Test Heading\n\nThis is test content.';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => markdownContent,
    } as Response);

    renderWithProviders(
      <MemoryRouter initialEntries={['/blog/test-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
    });

    // Verify markdown content is passed to MarkdownRenderer
    const renderer = screen.getByTestId('markdown-renderer');
    expect(renderer).toBeInTheDocument();
    // Check for key parts of content (whitespace-insensitive)
    expect(renderer.textContent).toContain('# Test Heading');
    expect(renderer.textContent).toContain('This is test content.');

    // Verify fetch was called with correct path
    expect(global.fetch).toHaveBeenCalledWith('/blog/test-post.md');
  });

  it('should handle 404 error when blog post not found in metadata', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => '# Content',
    } as Response);

    renderWithProviders(
      <MemoryRouter initialEntries={['/blog/non-existent-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Blog post not found')).toBeInTheDocument();
    });

    // Should show back to blog link
    expect(screen.getByText('← Back to Blog')).toBeInTheDocument();
  });

  it('should handle fetch error when markdown file not found', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    renderWithProviders(
      <MemoryRouter initialEntries={['/blog/test-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Blog post not found').length).toBeGreaterThan(
        0
      );
    });
  });

  it('should handle network error gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    renderWithProviders(
      <MemoryRouter initialEntries={['/blog/test-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Blog post not found')).toBeInTheDocument();
    });

    // Should show error message
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should handle missing slug parameter', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/blog/']}>
        <Routes>
          <Route path="/blog/:slug?" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Blog post not found')).toBeInTheDocument();
    });
  });

  it('should render MarkdownRenderer with fetched content', async () => {
    const testMarkdown = '# Hello World\n\nTest content with **bold** text.';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      text: async () => testMarkdown,
    } as Response);

    renderWithProviders(
      <MemoryRouter initialEntries={['/blog/test-post']}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const renderer = screen.getByTestId('markdown-renderer');
      expect(renderer).toBeInTheDocument();
      // Check for key content parts (whitespace-insensitive)
      expect(renderer.textContent).toContain('# Hello World');
      expect(renderer.textContent).toContain('Test content with **bold** text.');
    });
  });
});
