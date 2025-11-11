import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Breadcrumbs } from '@/components/Breadcrumbs';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Breadcrumbs Component', () => {
  it('renders breadcrumb path correctly', () => {
    renderWithRouter(<Breadcrumbs path={['search', 'aoconnect']} />);

    expect(screen.getByText('home')).toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
    expect(screen.getByText('aoconnect')).toBeInTheDocument();
  });

  it('last item has aria-current="page"', () => {
    renderWithRouter(<Breadcrumbs path={['search', 'aoconnect']} />);

    const lastItem = screen.getByText('aoconnect');
    expect(lastItem).toHaveAttribute('aria-current', 'page');
  });

  it('renders separators between items', () => {
    const { container } = renderWithRouter(
      <Breadcrumbs path={['search', 'skill']} />
    );

    const separators = container.querySelectorAll('.text-terminal-muted\\/50');
    expect(separators.length).toBeGreaterThan(0);
  });

  it('home link navigates to /', () => {
    renderWithRouter(<Breadcrumbs path={['search']} />);

    const homeLink = screen.getByText('home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });
});
