import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SearchResults } from '@/pages/SearchResults';

// Mock the hooks and services
vi.mock('@/hooks/useSkillSearch', () => ({
  useSkillSearch: vi.fn(() => ({
    skills: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

describe('SearchResults Page', () => {
  const renderWithRouter = (initialRoute = '/search') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/search" element={<SearchResults />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders search bar at top', () => {
    renderWithRouter();

    const searchInput = screen.getByRole('textbox', { name: /search skills/i });
    expect(searchInput).toBeTruthy();
  });

  it('renders results header with purple comment syntax', () => {
    renderWithRouter('/search?q=blockchain');

    // Check for purple // comment marker
    expect(screen.getByText(/\/\//)).toBeTruthy();
  });

  it('shows results count when not loading', () => {
    renderWithRouter('/search');

    expect(screen.getByText(/0 skills found/i)).toBeTruthy();
  });

  it('renders sort dropdown with options', () => {
    renderWithRouter('/search');

    const sortDropdown = screen.getByRole('combobox');
    expect(sortDropdown).toBeTruthy();

    // Check for sort options
    expect(screen.getByText('Relevance')).toBeTruthy();
    expect(screen.getByText('Most Popular')).toBeTruthy();
  });

  it('shows empty state when no results', () => {
    renderWithRouter('/search?q=nonexistent');

    expect(screen.getByText(/No skills found/i)).toBeTruthy();
  });

  it('displays search tips in empty state', () => {
    renderWithRouter('/search?q=test');

    expect(screen.getByText(/Try these suggestions/i)).toBeTruthy();
    expect(screen.getByText(/Use different keywords/i)).toBeTruthy();
  });

  it('renders "Back to home" link', () => {
    renderWithRouter('/search');

    const link = screen.getByText(/Back to home/i).closest('a');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/');
  });

  it('shows "Browse all skills" button when query exists', () => {
    renderWithRouter('/search?q=test');

    expect(screen.getByText(/Browse all skills/i)).toBeTruthy();
  });

  it('does not show "Browse all skills" when no query', () => {
    renderWithRouter('/search');

    expect(screen.queryByText(/Browse all skills/i)).toBeNull();
  });
});
