import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HeroSection } from '@/components/sections/HeroSection';

// Mock the hooks
vi.mock('@/hooks/useSkillSearch', () => ({
  useSkillSearch: () => ({
    skills: [],
    loading: false,
    error: null,
  }),
}));

describe('HeroSection', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('renders 2-line hero heading with gradient animation', () => {
    renderWithRouter(<HeroSection />);

    // Check for first line of heading with gradient
    const gradientText = screen.getByText(/Discover Agent Skills/i);
    expect(gradientText).toBeTruthy();
    expect(gradientText.className).toContain('mono-gradient-animated');

    // Check for second line of heading
    const secondLine = screen.getByText(/for Claude/i);
    expect(secondLine).toBeTruthy();
  });

  it('renders subheading with purple comment syntax', () => {
    renderWithRouter(<HeroSection />);

    const description = screen.getByText(
      /Extend Claude's capabilities with production-ready agent skills/i
    );
    expect(description).toBeTruthy();
  });

  it('renders search bar', () => {
    renderWithRouter(<HeroSection />);

    const searchInput = screen.getByRole('textbox', { name: /search skills/i });
    expect(searchInput).toBeTruthy();
  });

  it('renders CTA buttons', () => {
    renderWithRouter(<HeroSection />);

    // Check for "Explore Skills" button
    const exploreButton = screen.getByText(/Explore Skills/i).closest('button');
    expect(exploreButton).toBeTruthy();

    // Check for "CLI Guide" button
    const cliButton = screen.getByText(/CLI Guide/i).closest('button');
    expect(cliButton).toBeTruthy();
  });

  it('renders terminal window with CLI examples', () => {
    renderWithRouter(<HeroSection />);

    // Check for filename tab
    expect(screen.getByText('quick-start.sh')).toBeTruthy();

    // Check for CLI commands
    expect(screen.getByText(/npm install -g @permamind\/skills/i)).toBeTruthy();
    expect(screen.getByText(/skills search/i)).toBeTruthy();
  });

  it('has dark terminal background', () => {
    renderWithRouter(<HeroSection />);

    const section = screen
      .getByText(/Discover Agent Skills/i)
      .closest('section');

    expect(section?.className).toContain('bg-terminal-bg');
  });
});
