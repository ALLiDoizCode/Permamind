import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '@/components/layout/Header';

describe('Header', () => {
  const renderWithRouter = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Header />
      </MemoryRouter>
    );
  };

  it('renders terminal branding with link to home', () => {
    renderWithRouter();

    const brandingLink = screen.getByText('agent-skills').closest('a');
    expect(brandingLink).toBeTruthy();
    expect(brandingLink?.getAttribute('href')).toBe('/');
  });

  it('renders $ prompt symbol in branding', () => {
    renderWithRouter();

    // Get all $ symbols
    const prompts = screen.getAllByText('$');
    // The first one should be the branding (before "install cli" button)
    expect(prompts.length).toBeGreaterThan(0);
    expect(prompts[0].className).toContain('text-syntax-green');
  });

  it('renders blinking cursor in branding', () => {
    renderWithRouter();

    const cursor = screen.getByText('_');
    expect(cursor).toBeTruthy();
    expect(cursor.className).toContain('cursor-blink');
    expect(cursor.className).toContain('text-syntax-blue');
  });

  it('renders docs navigation link', () => {
    renderWithRouter();

    const docsLink = screen.getByRole('link', { name: /docs/i });
    expect(docsLink).toBeTruthy();
    expect(docsLink.getAttribute('href')).toBe('/docs');
  });

  it('renders github navigation link', () => {
    renderWithRouter();

    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toBeTruthy();
    expect(githubLink.getAttribute('href')).toBe(
      'https://github.com/ALLiDoizCode/Permamind'
    );
  });

  it('renders install cli link', () => {
    renderWithRouter();

    const installLink = screen.getByRole('link', { name: /install cli/i });
    expect(installLink).toBeTruthy();
    expect(installLink.getAttribute('href')).toBe('/cli-guide');
  });

  it('applies sticky positioning to header', () => {
    const { container } = renderWithRouter();

    const header = container.querySelector('header');
    expect(header?.className).toContain('sticky');
    expect(header?.className).toContain('top-0');
    expect(header?.className).toContain('z-50');
  });

  it('applies backdrop blur and transparency to header', () => {
    const { container } = renderWithRouter();

    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-terminal-bg/95');
    expect(header?.className).toContain('backdrop-blur-sm');
  });
});
