import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BlogListing } from '@/pages/BlogListing';

// Mock the blog posts data
vi.mock('@/data/blog-posts', () => ({
  blogPosts: [
    {
      slug: 'featured-post',
      title: 'Featured Post',
      date: '2025-01-10',
      author: 'Author 1',
      tags: ['tutorials', 'getting-started'],
      excerpt: 'Featured post excerpt about tutorials',
      readTime: 5,
      featured: true,
    },
    {
      slug: 'regular-post-1',
      title: 'Regular Post 1',
      date: '2025-01-15',
      author: 'Author 2',
      tags: ['ao-protocol', 'guides'],
      excerpt: 'Regular post 1 excerpt about AO',
      readTime: 3,
      featured: false,
    },
    {
      slug: 'regular-post-2',
      title: 'Regular Post 2',
      date: '2025-01-12',
      author: 'Author 3',
      tags: ['cli', 'tutorials'],
      excerpt: 'Regular post 2 excerpt about CLI',
      readTime: 7,
      featured: false,
    },
  ],
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BlogListing', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render with correct responsive grid classes', () => {
    const { container } = render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('gap-6');
  });

  it('should render featured posts first', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const posts = screen.getAllByRole('button');
    // First post should be featured
    expect(posts[0]).toHaveAttribute('aria-label', 'Blog post: Featured Post');
  });

  it('should sort posts by date (newest first) after featured', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const posts = screen.getAllByRole('button');
    // Order: Featured Post (featured), Regular Post 1 (2025-01-15), Regular Post 2 (2025-01-12)
    expect(posts[0]).toHaveAttribute('aria-label', 'Blog post: Featured Post');
    expect(posts[1]).toHaveAttribute('aria-label', 'Blog post: Regular Post 1');
    expect(posts[2]).toHaveAttribute('aria-label', 'Blog post: Regular Post 2');
  });

  it('should render all posts as BlogPostCard components', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    expect(screen.getByText('Featured Post')).toBeInTheDocument();
    expect(screen.getByText('Regular Post 1')).toBeInTheDocument();
    expect(screen.getByText('Regular Post 2')).toBeInTheDocument();
  });

  it('should navigate to blog post detail on card click', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const firstPost = screen.getByRole('button', {
      name: 'Blog post: Featured Post',
    });
    fireEvent.click(firstPost);

    expect(mockNavigate).toHaveBeenCalledWith('/blog/featured-post');
  });

  it('should render hero section with title and subtitle', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    expect(screen.getByText('// blog_posts')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tutorials, guides, and announcements from the Permamind team'
      )
    ).toBeInTheDocument();
  });

  it('should render Header and Footer components', () => {
    const { container } = render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    // Header should be present (check for header element)
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();

    // Footer should be present (contains Arweave badge)
    expect(screen.getByText(/Powered by Arweave/)).toBeInTheDocument();
  });

  // Tag filtering tests
  it('should filter posts by selected tag', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    // Initially all posts visible
    expect(screen.getByText('Featured Post')).toBeInTheDocument();
    expect(screen.getByText('Regular Post 1')).toBeInTheDocument();
    expect(screen.getByText('Regular Post 2')).toBeInTheDocument();

    // Click "tutorials" tag (get first occurrence which is in filter bar)
    const tutorialsTag = screen.getAllByText('tutorials')[0];
    fireEvent.click(tutorialsTag);

    // Only posts with "tutorials" tag should be visible
    expect(screen.getByText('Featured Post')).toBeInTheDocument(); // has "tutorials"
    expect(screen.queryByText('Regular Post 1')).not.toBeInTheDocument(); // no "tutorials"
    expect(screen.getByText('Regular Post 2')).toBeInTheDocument(); // has "tutorials"
  });

  it('should toggle tag selection on click', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const tutorialsTag = screen.getAllByText('tutorials')[0];

    // Tag not active initially
    expect(tutorialsTag).not.toHaveClass('bg-syntax-cyan');

    // Click to activate
    fireEvent.click(tutorialsTag);
    expect(tutorialsTag).toHaveClass('bg-syntax-cyan');

    // Click again to deactivate
    fireEvent.click(tutorialsTag);
    expect(tutorialsTag).not.toHaveClass('bg-syntax-cyan');
  });

  it('should support multiple tag selection (OR logic)', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    // Click "ao-protocol" tag
    fireEvent.click(screen.getAllByText('ao-protocol')[0]);

    // Only Regular Post 1 visible
    expect(screen.queryByText('Featured Post')).not.toBeInTheDocument();
    expect(screen.getByText('Regular Post 1')).toBeInTheDocument();
    expect(screen.queryByText('Regular Post 2')).not.toBeInTheDocument();

    // Add "cli" tag (OR logic)
    fireEvent.click(screen.getAllByText('cli')[0]);

    // Now Regular Post 1 and Regular Post 2 visible
    expect(screen.queryByText('Featured Post')).not.toBeInTheDocument();
    expect(screen.getByText('Regular Post 1')).toBeInTheDocument();
    expect(screen.getByText('Regular Post 2')).toBeInTheDocument();
  });

  it('should show clear filters button when tags selected', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    // No clear button initially
    expect(screen.queryByText('Clear filters')).not.toBeInTheDocument();

    // Click a tag
    fireEvent.click(screen.getAllByText('tutorials')[0]);

    // Clear button appears
    expect(screen.getByText('Clear filters')).toBeInTheDocument();
  });

  it('should clear tag filters when Clear filters clicked', () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    // Select a tag
    fireEvent.click(screen.getAllByText('tutorials')[0]);

    // 2 posts visible (Featured Post and Regular Post 2)
    expect(
      screen
        .getAllByRole('button')
        .filter((el) => el.getAttribute('aria-label')?.startsWith('Blog post'))
        .length
    ).toBe(2);

    // Click clear filters
    fireEvent.click(screen.getByText('Clear filters'));

    // All 3 posts visible again
    expect(
      screen
        .getAllByRole('button')
        .filter((el) => el.getAttribute('aria-label')?.startsWith('Blog post'))
        .length
    ).toBe(3);
  });

  // Search functionality tests
  it('should filter posts by search query (title match)', async () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(
      'search blog posts --query tutorials'
    );

    // Type search query
    fireEvent.change(searchInput, { target: { value: 'Featured' } });

    // Wait for debounce (300ms) + rendering time
    await waitFor(
      () => {
        expect(screen.getByText('Featured Post')).toBeInTheDocument();
        expect(screen.queryByText('Regular Post 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Regular Post 2')).not.toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should filter posts by search query (excerpt match)', async () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(
      'search blog posts --query tutorials'
    );

    // Search by excerpt content
    fireEvent.change(searchInput, { target: { value: 'CLI' } });

    // Wait for debounce (300ms) + rendering time
    await waitFor(
      () => {
        expect(screen.queryByText('Featured Post')).not.toBeInTheDocument();
        expect(screen.queryByText('Regular Post 1')).not.toBeInTheDocument();
        expect(screen.getByText('Regular Post 2')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('should be case-insensitive for search', async () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(
      'search blog posts --query tutorials'
    );

    // Search with lowercase
    fireEvent.change(searchInput, { target: { value: 'featured' } });

    await waitFor(
      () => {
        expect(screen.getByText('Featured Post')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should combine search and tag filtering (AND logic)', async () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    // Select "tutorials" tag (Featured Post and Regular Post 2)
    fireEvent.click(screen.getAllByText('tutorials')[0]);

    // Search for "CLI" (Regular Post 2)
    const searchInput = screen.getByPlaceholderText(
      'search blog posts --query tutorials'
    );
    fireEvent.change(searchInput, { target: { value: 'CLI' } });

    // Wait for debounce - should only show Regular Post 2 (has both "tutorials" tag AND "CLI" in excerpt)
    await waitFor(
      () => {
        expect(screen.queryByText('Featured Post')).not.toBeInTheDocument();
        expect(screen.queryByText('Regular Post 1')).not.toBeInTheDocument();
        expect(screen.getByText('Regular Post 2')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should show empty state when no posts match search', async () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText(
      'search blog posts --query tutorials'
    );
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(
      () => {
        expect(screen.getByText('No blog posts found')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should clear search when Clear filters clicked', async () => {
    render(
      <BrowserRouter>
        <BlogListing />
      </BrowserRouter>
    );

    // Type search query
    const searchInput = screen.getByPlaceholderText(
      'search blog posts --query tutorials'
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'Featured' } });

    // Wait for debounce
    await waitFor(() => {
      expect(searchInput.value).toBe('Featured');
    });

    // Click clear filters
    fireEvent.click(screen.getByText('Clear filters'));

    // Search input should be cleared
    expect(searchInput.value).toBe('');

    // All posts visible
    await waitFor(() => {
      expect(screen.getByText('Featured Post')).toBeInTheDocument();
      expect(screen.getByText('Regular Post 1')).toBeInTheDocument();
      expect(screen.getByText('Regular Post 2')).toBeInTheDocument();
    });
  });
});
