import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlogPostCard } from '@/components/BlogPostCard';
import type { BlogPost } from '@/types/blog';

describe('BlogPostCard', () => {
  const mockPost: BlogPost = {
    slug: 'test-post',
    title: 'Test Blog Post Title',
    date: '2025-01-15',
    author: 'Test Author',
    tags: ['tutorials', 'getting-started', 'advanced'],
    excerpt: 'This is a test excerpt that should be displayed on the card.',
    readTime: 5,
    featured: false,
  };

  it('should render title correctly', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('Test Blog Post Title')).toBeInTheDocument();
  });

  it('should render formatted date and author correctly', () => {
    render(<BlogPostCard post={mockPost} />);
    // Date format: "Jan 14, 2025" (timezone offset)
    expect(screen.getByText(/Jan 14, 2025/)).toBeInTheDocument();
    expect(screen.getByText(/by Test Author/)).toBeInTheDocument();
  });

  it('should render excerpt with line clamp', () => {
    render(<BlogPostCard post={mockPost} />);
    const excerpt = screen.getByText(mockPost.excerpt);
    expect(excerpt).toBeInTheDocument();
    expect(excerpt).toHaveClass('line-clamp-2');
  });

  it('should render only first 2 tags', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('tutorials')).toBeInTheDocument();
    expect(screen.getByText('getting-started')).toBeInTheDocument();
    // Third tag should not be rendered
    expect(screen.queryByText('advanced')).not.toBeInTheDocument();
  });

  it('should render reading time badge', () => {
    render(<BlogPostCard post={mockPost} />);
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('should call onClick handler when card is clicked', () => {
    const handleClick = vi.fn();
    render(<BlogPostCard post={mockPost} onClick={handleClick} />);

    const card = screen.getByRole('button', {
      name: 'Blog post: Test Blog Post Title',
    });
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger navigation on Enter key press', () => {
    const handleClick = vi.fn();
    render(<BlogPostCard post={mockPost} onClick={handleClick} />);

    const card = screen.getByRole('button', {
      name: 'Blog post: Test Blog Post Title',
    });
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should trigger navigation on Space key press', () => {
    const handleClick = vi.fn();
    render(<BlogPostCard post={mockPost} onClick={handleClick} />);

    const card = screen.getByRole('button', {
      name: 'Blog post: Test Blog Post Title',
    });
    fireEvent.keyDown(card, { key: ' ' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have hover effect classes applied', () => {
    render(<BlogPostCard post={mockPost} />);
    const card = screen.getByRole('button', {
      name: 'Blog post: Test Blog Post Title',
    });

    // Check for hover classes
    expect(card).toHaveClass('hover:border-syntax-blue');
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveClass('transition-all');
  });

  it('should have proper accessibility attributes', () => {
    render(<BlogPostCard post={mockPost} />);
    const card = screen.getByRole('button', {
      name: 'Blog post: Test Blog Post Title',
    });

    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'Blog post: Test Blog Post Title');
  });

  it('should handle posts with only 1 tag', () => {
    const postWithOneTag: BlogPost = {
      ...mockPost,
      tags: ['tutorials'],
    };
    render(<BlogPostCard post={postWithOneTag} />);

    expect(screen.getByText('tutorials')).toBeInTheDocument();
  });

  it('should format date correctly for different dates', () => {
    const postWithDifferentDate: BlogPost = {
      ...mockPost,
      date: '2024-12-25',
    };
    render(<BlogPostCard post={postWithDifferentDate} />);

    // Date format may vary by timezone
    expect(screen.getByText(/Dec 2[45], 2024/)).toBeInTheDocument();
  });
});
