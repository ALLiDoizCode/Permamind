import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { SkillDetail } from '@/pages/SkillDetail';
import * as aoRegistry from '@/services/ao-registry';
import type { DownloadStats, SkillMetadata } from '@/types/ao';

vi.mock('@/services/ao-registry');

// Mock search bar to avoid complex dependencies
vi.mock('@/components/SearchBar', () => ({
  SearchBar: () => <div data-testid="search-bar">SearchBar</div>,
}));

// Mock useParams for SkillDetail tests
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ name: 'test-skill' }),
  };
});

describe('Download Stats Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Homepage Aggregate Stats', () => {
    it('displays aggregate stats on homepage', async () => {
      const mockStats: DownloadStats = {
        totalSkills: 150,
        downloads7Days: 1234,
        downloads30Days: 5678,
        downloadsTotal: 9012,
      };

      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue(mockStats);
      vi.mocked(aoRegistry.listSkills).mockResolvedValue({
        skills: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      // Wait for stats to load
      await waitFor(
        () => {
          expect(screen.getByText('Total Skills')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify all three stat cards are displayed
      expect(screen.getByText('Total Skills')).toBeInTheDocument();
      expect(screen.getByText('Downloads · Last Week')).toBeInTheDocument();
      expect(screen.getByText('Downloads · Last Month')).toBeInTheDocument();

      // Verify values are formatted correctly
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
      expect(screen.getByText('5,678')).toBeInTheDocument();
    });

    it('shows loading skeletons while fetching stats', async () => {
      vi.mocked(aoRegistry.getDownloadStats).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      vi.mocked(aoRegistry.listSkills).mockResolvedValue({
        skills: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      // Should show skeleton loaders
      const skeletons = document.querySelectorAll('[data-testid]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides stats section on error', async () => {
      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue(null);
      vi.mocked(aoRegistry.listSkills).mockResolvedValue({
        skills: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Total Skills')).not.toBeInTheDocument();
      });
    });
  });

  describe('Skill Detail Page Stats', () => {
    const createMockSkill = (
      overrides?: Partial<SkillMetadata>
    ): SkillMetadata => ({
      name: 'test-skill',
      version: '1.0.0',
      author: 'test-author',
      owner: 'test-owner',
      description: 'Test description',
      tags: ['test'],
      dependencies: [],
      arweaveTxId: 'test-tx-id',
      publishedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
      updatedAt: Date.now(),
      downloads: 50,
      ...overrides,
    });

    it('renders skill detail page with smart stats component', async () => {
      const mockSkill = createMockSkill();
      const mockStats: DownloadStats = {
        downloads7Days: 10,
        downloads30Days: 20,
        downloadsTotal: 50,
        skillName: 'test-skill',
      };

      vi.mocked(aoRegistry.getSkill).mockResolvedValue(mockSkill);
      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue(mockStats);
      vi.mocked(aoRegistry.getSkillVersions).mockResolvedValue([]);

      render(
        <BrowserRouter>
          <SkillDetail />
        </BrowserRouter>
      );

      // Verify page renders (SmartStatsDisplay component mounts)
      await waitFor(
        () => {
          const headings = screen.getAllByText('test-skill');
          expect(headings.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it('falls back to simple count on stats fetch error', async () => {
      const mockSkill = createMockSkill({ downloads: 100 });

      vi.mocked(aoRegistry.getSkill).mockResolvedValue(mockSkill);
      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue(null);
      vi.mocked(aoRegistry.getSkillVersions).mockResolvedValue([]);

      render(
        <BrowserRouter>
          <SkillDetail />
        </BrowserRouter>
      );

      // Verify fallback to simple download count
      await waitFor(
        () => {
          expect(screen.getByText(/100 downloads/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Responsive Design', () => {
    it('renders stats section in mobile layout', async () => {
      // Note: Actual responsive testing would require viewport manipulation
      // which is better done with Playwright. This test verifies classes exist.
      const mockStats: DownloadStats = {
        totalSkills: 150,
        downloads7Days: 1234,
        downloads30Days: 5678,
        downloadsTotal: 9012,
      };

      vi.mocked(aoRegistry.getDownloadStats).mockResolvedValue(mockStats);
      vi.mocked(aoRegistry.listSkills).mockResolvedValue({
        skills: [],
        total: 0,
        limit: 20,
        offset: 0,
      });

      const { container } = render(
        <BrowserRouter>
          <Home />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Skills')).toBeInTheDocument();
      });

      // Verify responsive grid classes are present
      const gridElement = container.querySelector('.grid');
      expect(gridElement).toBeInTheDocument();
      expect(gridElement?.className).toMatch(/grid-cols-1/);
      expect(gridElement?.className).toMatch(/md:grid-cols-3/);
    });
  });
});
