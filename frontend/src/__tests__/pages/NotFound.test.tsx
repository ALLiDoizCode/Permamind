import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFound } from '@/pages/NotFound';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotFound Page', () => {
  const renderWithRouter = () => {
    return render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders 404 heading in red', () => {
    renderWithRouter();

    const heading = screen.getByRole('heading', { name: '404', level: 1 });
    expect(heading).toBeTruthy();
    expect(heading.className).toContain('text-syntax-red');
  });

  it('renders "Page not found" message', () => {
    renderWithRouter();

    expect(screen.getByText('Page not found')).toBeTruthy();
  });

  it('renders helpful description', () => {
    renderWithRouter();

    expect(
      screen.getByText(/the page you're looking for doesn't exist/i)
    ).toBeTruthy();
  });

  it('renders "Back to Home" button', () => {
    renderWithRouter();

    const button = screen.getByRole('button', { name: /back to home/i });
    expect(button).toBeTruthy();
  });

  it('navigates to home when "Back to Home" clicked', () => {
    renderWithRouter();

    const button = screen.getByRole('button', { name: /back to home/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('renders "Search Skills" button', () => {
    renderWithRouter();

    const button = screen.getByRole('button', { name: /search skills/i });
    expect(button).toBeTruthy();
  });

  it('navigates to search when "Search Skills" clicked', () => {
    renderWithRouter();

    const button = screen.getByRole('button', { name: /search skills/i });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  it('renders "Browse Categories" link', () => {
    renderWithRouter();

    const link = screen.getByText(/browse categories/i).closest('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('renders ASCII art terminal decoration', () => {
    renderWithRouter();

    expect(screen.getByText(/ERROR: Resource Not Found/i)).toBeTruthy();
  });

  it('renders terminal command suggestion', () => {
    renderWithRouter();

    expect(screen.getByText(/Terminal Suggestion/i)).toBeTruthy();
    expect(screen.getByText(/\$ cd \/ && ls --all-skills/i)).toBeTruthy();
  });
});
