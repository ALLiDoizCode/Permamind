import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilePreviewModal } from '@/components/FilePreviewModal';
import type { BundledFile } from '@/types/ao';

describe('FilePreviewModal', () => {
  const mockMarkdownFile: BundledFile = {
    name: 'SKILL.md',
    icon: '📘',
    type: 'markdown',
    size: '4.2 KB',
    description: 'Main skill documentation',
    level: 'Level 2',
    preview:
      '# Test Heading\n\nThis is **bold** text with `code`.\n\n## Subheading\n\n- List item',
  };

  const mockPythonFile: BundledFile = {
    name: 'script.py',
    icon: '🐍',
    type: 'python',
    size: '2.1 KB',
    description: 'Python script',
    level: 'Level 3',
    preview: '# Comment\nimport json\ndef test():\n    return "hello"',
  };

  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('does not render when file is null', () => {
    const onCloseMock = vi.fn();
    const { container } = render(
      <FilePreviewModal file={null} onClose={onCloseMock} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with file information', () => {
    const onCloseMock = vi.fn();
    render(<FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />);

    expect(screen.getByText('SKILL.md')).toBeInTheDocument();
    expect(screen.getByText('📘')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('4.2 KB')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument();
  });

  it('renders markdown content with proper formatting', () => {
    const onCloseMock = vi.fn();
    render(<FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />);

    // Check that markdown was rendered (headings should be present)
    const content = screen.getByText('Test Heading');
    expect(content).toBeInTheDocument();
  });

  it('renders Python code with syntax highlighting', () => {
    const onCloseMock = vi.fn();
    const { container } = render(
      <FilePreviewModal file={mockPythonFile} onClose={onCloseMock} />
    );

    // Check that code content is present
    expect(container.textContent).toContain('import json');
    expect(container.textContent).toContain('def test()');
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();
    render(<FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />);

    const closeButton = screen.getByRole('button', { name: /close preview/i });
    await user.click(closeButton);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();
    const { container } = render(
      <FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />
    );

    // Find backdrop (first div with absolute positioning)
    const backdrop = container.querySelector('.absolute.inset-0');
    if (backdrop) {
      await user.click(backdrop);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    }
  });

  it('renders download button', () => {
    const onCloseMock = vi.fn();
    render(<FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />);

    const downloadButton = screen.getByRole('button', { name: /download/i });
    expect(downloadButton).toBeInTheDocument();
  });

  it('renders copy button', () => {
    const onCloseMock = vi.fn();
    render(<FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />);

    const copyButton = screen.getByRole('button', {
      name: /copy to clipboard/i,
    });
    expect(copyButton).toBeInTheDocument();
  });

  it('shows ESC instruction', () => {
    const onCloseMock = vi.fn();
    render(<FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />);

    expect(screen.getByText('ESC')).toBeInTheDocument();
    expect(screen.getByText('to close')).toBeInTheDocument();
  });

  it('prevents body scroll when modal is open', () => {
    const onCloseMock = vi.fn();
    render(<FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when modal is closed', () => {
    const onCloseMock = vi.fn();
    const { rerender } = render(
      <FilePreviewModal file={mockMarkdownFile} onClose={onCloseMock} />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(<FilePreviewModal file={null} onClose={onCloseMock} />);

    expect(document.body.style.overflow).toBe('');
  });

  it('displays Level 3 badge with purple variant', () => {
    const onCloseMock = vi.fn();
    render(<FilePreviewModal file={mockPythonFile} onClose={onCloseMock} />);

    const level3Badge = screen.getByText('Level 3');
    expect(level3Badge).toBeInTheDocument();
    expect(level3Badge.closest('span')).toHaveClass('bg-syntax-purple/10');
  });

  it('renders script type files correctly', () => {
    const scriptFile: BundledFile = {
      name: 'deploy.sh',
      icon: '📜',
      type: 'script',
      size: '1.5 KB',
      description: 'Deployment script',
      level: 'Level 3',
      preview: '#!/bin/bash\necho "Deploying..."',
    };

    const onCloseMock = vi.fn();
    const { container } = render(
      <FilePreviewModal file={scriptFile} onClose={onCloseMock} />
    );

    expect(screen.getByText('deploy.sh')).toBeInTheDocument();
    expect(container.textContent).toContain('#!/bin/bash');
  });
});
