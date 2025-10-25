import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';

describe('HowItWorksSection', () => {
  it('renders section header with comment syntax', () => {
    render(<HowItWorksSection />);

    // Verify section header contains "how_it_works"
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain('how_it_works');
  });

  it('renders 3 step cards', () => {
    const { container } = render(<HowItWorksSection />);

    // Verify 3 cards are rendered
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards).toHaveLength(3);
  });

  it('renders numbered icons (1, 2, 3)', () => {
    const { container } = render(<HowItWorksSection />);

    // Verify numbered icons
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain('3');
  });

  it('renders correct card titles', () => {
    render(<HowItWorksSection />);

    // Verify card titles match expected values
    expect(screen.getByText('$ discover')).toBeInTheDocument();
    expect(screen.getByText('$ install')).toBeInTheDocument();
    expect(screen.getByText('$ activate')).toBeInTheDocument();
  });

  it('renders card descriptions', () => {
    render(<HowItWorksSection />);

    // Verify card descriptions are present
    expect(
      screen.getByText(/Search the registry for agent skills/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Install skills via the CLI with a single command/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Skills activate automatically in Claude/)
    ).toBeInTheDocument();
  });

  it('applies responsive grid classes', () => {
    const { container } = render(<HowItWorksSection />);

    // Verify grid container has responsive classes
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-3');
  });

  it('applies hover transition classes to cards', () => {
    const { container } = render(<HowItWorksSection />);

    // Verify cards have hover and transition classes
    const cards = container.querySelectorAll('[data-slot="card"]');
    cards.forEach((card) => {
      expect(card).toHaveClass('hover:scale-105');
      expect(card).toHaveClass('transition-all');
    });
  });
});
