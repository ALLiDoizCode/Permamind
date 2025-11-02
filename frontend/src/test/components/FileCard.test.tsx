import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileCard } from '@/components/FileCard';
import type { BundledFile } from '@/types/ao';

describe('FileCard', () => {
  const mockFile: BundledFile = {
    name: 'SKILL.md',
    icon: '📘',
    type: 'markdown',
    size: '4.2 KB',
    description: 'Main skill documentation with usage examples',
    level: 'Level 2',
    preview: '# Test content',
  };

  it('renders file information correctly', () => {
    const onClickMock = vi.fn();
    render(<FileCard file={mockFile} onClick={onClickMock} />);

    expect(screen.getByText('SKILL.md')).toBeInTheDocument();
    expect(screen.getByText('📘')).toBeInTheDocument();
    expect(screen.getByText('Level 2')).toBeInTheDocument();
    expect(screen.getByText('4.2 KB')).toBeInTheDocument();
    expect(
      screen.getByText('Main skill documentation with usage examples')
    ).toBeInTheDocument();
    expect(screen.getByText('Click to preview →')).toBeInTheDocument();
  });

  it('displays Level 2 badge with green variant', () => {
    const onClickMock = vi.fn();
    render(<FileCard file={mockFile} onClick={onClickMock} />);

    const level2Badge = screen.getByText('Level 2');
    expect(level2Badge).toBeInTheDocument();
    // Check parent for green variant classes
    expect(level2Badge.closest('span')).toHaveClass('bg-syntax-green/10');
  });

  it('displays Level 3 badge with purple variant', () => {
    const level3File = { ...mockFile, level: 'Level 3' as const };
    const onClickMock = vi.fn();
    render(<FileCard file={level3File} onClick={onClickMock} />);

    const level3Badge = screen.getByText('Level 3');
    expect(level3Badge).toBeInTheDocument();
    expect(level3Badge.closest('span')).toHaveClass('bg-syntax-purple/10');
  });

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();
    render(<FileCard file={mockFile} onClick={onClickMock} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('renders different file types correctly', () => {
    const pythonFile: BundledFile = {
      name: 'script.py',
      icon: '🐍',
      type: 'python',
      size: '2.1 KB',
      description: 'Python script',
      level: 'Level 3',
      preview: 'print("test")',
    };

    const onClickMock = vi.fn();
    render(<FileCard file={pythonFile} onClick={onClickMock} />);

    expect(screen.getByText('script.py')).toBeInTheDocument();
    expect(screen.getByText('🐍')).toBeInTheDocument();
    expect(screen.getByText('Python script')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const onClickMock = vi.fn();
    render(<FileCard file={mockFile} onClick={onClickMock} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
