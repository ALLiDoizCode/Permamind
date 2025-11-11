import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CopyButton } from '@/components/CopyButton';

describe('CopyButton Component', () => {
  const mockWriteText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockWriteText.mockClear();
  });

  it('renders clipboard icon by default', () => {
    render(<CopyButton text="test text" />);

    const button = screen.getByLabelText('Copy to clipboard');
    expect(button).toBeInTheDocument();
  });

  it('copies text to clipboard on click', async () => {
    render(<CopyButton text="test text" />);

    const button = screen.getByLabelText('Copy to clipboard');
    fireEvent.click(button);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    });
  });

  it('shows checkmark icon after copying', async () => {
    render(<CopyButton text="test text" />);

    const button = screen.getByLabelText('Copy to clipboard');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
    });
  });

  it('has correct hover and focus classes', () => {
    render(<CopyButton text="test text" />);

    const button = screen.getByLabelText('Copy to clipboard');
    expect(button).toHaveClass('hover:text-terminal-text');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-syntax-blue');
  });

  it('renders SVG icons', () => {
    const { container } = render(<CopyButton text="test text" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    render(<CopyButton text="test" className="custom-class" />);

    const button = screen.getByLabelText('Copy to clipboard');
    expect(button).toHaveClass('custom-class');
  });
});
