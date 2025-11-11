import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders with correct classes', () => {
    render(<Input data-testid="input" placeholder="Enter text" />);

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('border-terminal-border');
    expect(input).toHaveClass('bg-terminal-surface');
    expect(input).toHaveClass('text-terminal-text');
    expect(input).toHaveClass('font-mono');
  });

  it('applies focus state with ring and border color', () => {
    render(<Input data-testid="input" />);

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('focus-visible:ring-2');
    expect(input).toHaveClass('focus-visible:ring-syntax-blue');
  });

  it('applies disabled state', () => {
    render(<Input data-testid="input" disabled />);

    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
    expect(input).toHaveClass('disabled:cursor-not-allowed');
  });

  it('updates value on change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Input data-testid="input" onChange={onChange} />);

    const input = screen.getByTestId('input') as HTMLInputElement;
    await user.type(input, 'test');

    expect(onChange).toHaveBeenCalled();
    expect(input.value).toBe('test');
  });

  it('supports common input types', () => {
    const types = ['text', 'email', 'password', 'search', 'number'] as const;

    types.forEach((type) => {
      render(<Input type={type} data-testid={`input-${type}`} />);
      const input = screen.getByTestId(`input-${type}`);
      expect(input).toHaveAttribute('type', type);
    });
  });

  it('renders placeholder text', () => {
    render(<Input placeholder="Search skills..." data-testid="input" />);

    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('placeholder', 'Search skills...');
    expect(input).toHaveClass('placeholder:text-terminal-muted');
  });

  it('accepts custom className', () => {
    render(<Input className="custom-class" data-testid="input" />);

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-class');
  });
});
