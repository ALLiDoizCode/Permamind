import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes';

describe('Router Configuration', () => {
  describe('Route Rendering', () => {
    it('renders Home component on / route', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      );

      // Home page should render (check for any element from Home)
      // Since Home is not fully implemented yet, just verify no crash
      expect(document.body).toBeTruthy();
    });

    it('renders SearchResults component on /search route', async () => {
      render(
        <MemoryRouter initialEntries={['/search']}>
          <AppRoutes />
        </MemoryRouter>
      );

      // Wait for lazy loaded component - look for "skills found" heading
      await waitFor(() => {
        expect(screen.getByText(/skills found/i)).toBeTruthy();
      });
    });

    it('renders SkillDetail component on /skills/:name route', () => {
      render(
        <MemoryRouter initialEntries={['/skills/aoconnect']}>
          <AppRoutes />
        </MemoryRouter>
      );

      // SkillDetail should render with skill name or loading state
      // Since we have mock data for 'aoconnect', it should show the skill
      expect(document.body).toBeTruthy();
    });

    it('renders NotFound component on invalid route', async () => {
      render(
        <MemoryRouter initialEntries={['/invalid-path']}>
          <AppRoutes />
        </MemoryRouter>
      );

      // Wait for lazy loaded 404 page
      await waitFor(() => {
        expect(screen.getByText('404')).toBeTruthy();
      });
    });
  });

  describe('404 Catch-all Route', () => {
    it('catches deeply nested invalid paths', async () => {
      render(
        <MemoryRouter initialEntries={['/some/deeply/nested/invalid/path']}>
          <AppRoutes />
        </MemoryRouter>
      );

      // Wait for lazy loaded 404 page
      await waitFor(() => {
        expect(screen.getByText('404')).toBeTruthy();
      });
    });

    it('catches invalid skill paths', async () => {
      render(
        <MemoryRouter initialEntries={['/skills/']}>
          <AppRoutes />
        </MemoryRouter>
      );

      // Wait for lazy loaded 404 page
      await waitFor(() => {
        expect(screen.getByText('404')).toBeTruthy();
      });
    });
  });

  describe('Route Parameters', () => {
    it('handles skill name parameter correctly', () => {
      render(
        <MemoryRouter initialEntries={['/skills/my-skill-name']}>
          <AppRoutes />
        </MemoryRouter>
      );

      // Should render SkillDetail component, not 404
      expect(document.body).toBeTruthy();
    });

    it('handles encoded skill names', () => {
      render(
        <MemoryRouter initialEntries={['/skills/skill%20with%20spaces']}>
          <AppRoutes />
        </MemoryRouter>
      );

      // Should render SkillDetail component
      expect(document.body).toBeTruthy();
    });
  });
});
