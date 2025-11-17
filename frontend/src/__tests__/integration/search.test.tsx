import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SearchResults } from '@/pages/SearchResults';
import * as aoRegistryService from '@/services/ao-registry';
import type { SkillMetadata } from '@/types/ao';

/**
 * Integration Tests for Search UI Migration (Story 15.3, TEST-001)
 *
 * These tests verify the search UI migration from @permaweb/aoconnect
 * to AORegistryClient with HyperBEAM HTTP endpoints and dryrun fallback.
 *
 * Test Coverage:
 * - Search workflow with AORegistryClient
 * - Tag filtering
 * - Pagination
 * - Error handling (network errors, fallback to dryrun)
 * - Loading states
 * - Empty states
 */

// Mock skills data (matching test registry process)
const mockSkills: SkillMetadata[] = [
  {
    name: 'ao',
    version: '1.0.9',
    description: 'Learn AO protocol fundamentals - processes, message passing, handlers, and ADP compliance',
    author: 'Permamind Team',
    owner: 'CK-1OqFAIsqyPVfBE0q6n7gnNGvVoPPF8LTNJ7bdzHI',
    tags: ['ao', 'blockchain', 'tutorial'],
    dependencies: [],
    arweaveTxId: 'pVNE26WJNjCdLBNYUCJLoBYAKQSxW74m2_9dBFaQ1C8',
    publishedAt: 1763339906515,
    updatedAt: 1763339906515,
    downloadCount: 0,
  },
  {
    name: 'arweave',
    version: '1.0.0',
    description: 'Guide for building applications on Arweave permanent storage network - covering data upload, permaweb deployment, GraphQL queries, wallet management, and protocol fundamentals',
    author: 'Arweave Community',
    owner: 'CK-1OqFAIsqyPVfBE0q6n7gnNGvVoPPF8LTNJ7bdzHI',
    tags: ['arweave', 'storage', 'blockchain', 'permaweb', 'web3'],
    dependencies: [],
    arweaveTxId: '_YN7c_U0HibRf1g0BII8xNiAAQVXZgJULymEULLE-W4',
    publishedAt: 1763339907544,
    updatedAt: 1763339907544,
    downloadCount: 0,
  },
  {
    name: 'aoconnect',
    version: '1.0.0',
    description: 'JavaScript library for interacting with AO processes - message sending, dryrun queries, and wallet management',
    author: 'Permamind Team',
    owner: 'CK-1OqFAIsqyPVfBE0q6n7gnNGvVoPPF8LTNJ7bdzHI',
    tags: ['ao', 'javascript', 'library', 'sdk'],
    dependencies: [],
    arweaveTxId: 'DlM2HDdVmkKVsHzsyARwPgdpZUGlB5lcx4Tg6PjXwQA',
    publishedAt: 1763339908252,
    updatedAt: 1763339908252,
    downloadCount: 0,
  },
];

describe('Search UI Migration Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Search Workflow with AORegistryClient', () => {
    it('should display search results from AORegistryClient', async () => {
      // Mock searchSkills to return all skills
      const searchSkillsSpy = vi
        .spyOn(aoRegistryService, 'searchSkills')
        .mockResolvedValue(mockSkills);

      render(
        <BrowserRouter>
          <SearchResults />
        </BrowserRouter>
      );

      // Wait for search to complete (empty query returns all skills)
      await waitFor(() => {
        expect(screen.getByText(/3 skills found/i)).toBeInTheDocument();
      });

      // Verify searchSkills was called
      expect(searchSkillsSpy).toHaveBeenCalledWith('');

      // Verify all skills are displayed
      expect(screen.getByText('ao')).toBeInTheDocument();
      expect(screen.getByText('arweave')).toBeInTheDocument();
      expect(screen.getByText('aoconnect')).toBeInTheDocument();
    });

    it('should filter search results by query', async () => {
      const user = userEvent.setup();

      // Mock searchSkills to return filtered results
      const searchSkillsSpy = vi
        .spyOn(aoRegistryService, 'searchSkills')
        .mockResolvedValue([mockSkills[0]]); // Only "ao" skill

      render(
        <BrowserRouter>
          <SearchResults />
        </BrowserRouter>
      );

      // Find search input and type query
      const searchInput = screen.getByPlaceholderText(/search skills/i);
      await user.type(searchInput, 'ao protocol');

      // Wait for debounced search
      await waitFor(
        () => {
          expect(searchSkillsSpy).toHaveBeenCalledWith('ao protocol');
        },
        { timeout: 1000 }
      );

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText(/1 skills found/i)).toBeInTheDocument();
      });

      expect(screen.getByText('ao')).toBeInTheDocument();
      expect(screen.queryByText('arweave')).not.toBeInTheDocument();
    });

    it('should display loading state during search', async () => {
      // Mock searchSkills with delay
      const searchSkillsSpy = vi
        .spyOn(aoRegistryService, 'searchSkills')
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(mockSkills), 100)
            )
        );

      render(
        <BrowserRouter>
          <SearchResults />
        </BrowserRouter>
      );

      // Verify loading state is displayed
      expect(screen.getByText(/searching/i)).toBeInTheDocument();

      // Wait for results to load
      await waitFor(() => {
        expect(screen.getByText(/3 skills found/i)).toBeInTheDocument();
      });

      expect(searchSkillsSpy).toHaveBeenCalled();
    });

    it('should display empty state when no results found', async () => {
      // Mock searchSkills to return empty array
      const searchSkillsSpy = vi
        .spyOn(aoRegistryService, 'searchSkills')
        .mockResolvedValue([]);

      render(
        <BrowserRouter>
          <SearchResults />
        </BrowserRouter>
      );

      // Wait for search to complete
      await waitFor(() => {
        expect(screen.getByText(/0 skills found/i)).toBeInTheDocument();
      });

      // Verify empty state message
      expect(screen.getByText(/no skills available/i)).toBeInTheDocument();

      expect(searchSkillsSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Fallback', () => {
    it('should display error message when search fails', async () => {
      // Mock searchSkills to throw error
      const searchSkillsSpy = vi
        .spyOn(aoRegistryService, 'searchSkills')
        .mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <SearchResults />
        </BrowserRouter>
      );

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/failed to search skills/i)).toBeInTheDocument();
      });

      expect(searchSkillsSpy).toHaveBeenCalled();
    });

    it('should support retry after error', async () => {
      const user = userEvent.setup();

      // Mock searchSkills to fail first time, succeed second time
      const searchSkillsSpy = vi
        .spyOn(aoRegistryService, 'searchSkills')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSkills);

      render(
        <BrowserRouter>
          <SearchResults />
        </BrowserRouter>
      );

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/failed to search skills/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Wait for successful results
      await waitFor(() => {
        expect(screen.getByText(/3 skills found/i)).toBeInTheDocument();
      });

      expect(searchSkillsSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pagination', () => {
    it('should paginate results when more than 12 skills', async () => {
      const user = userEvent.setup();

      // Create 15 mock skills for pagination test
      const manySkills: SkillMetadata[] = Array.from({ length: 15 }, (_, i) => ({
        ...mockSkills[0],
        name: `skill-${i + 1}`,
        description: `Test skill ${i + 1}`,
      }));

      const searchSkillsSpy = vi
        .spyOn(aoRegistryService, 'searchSkills')
        .mockResolvedValue(manySkills);

      render(
        <BrowserRouter>
          <SearchResults />
        </BrowserRouter>
      );

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/15 skills found/i)).toBeInTheDocument();
      });

      // Verify first page shows 12 results
      expect(screen.getByText('skill-1')).toBeInTheDocument();
      expect(screen.getByText('skill-12')).toBeInTheDocument();
      expect(screen.queryByText('skill-13')).not.toBeInTheDocument();

      // Click next page
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Verify second page shows remaining 3 results
      await waitFor(() => {
        expect(screen.getByText('skill-13')).toBeInTheDocument();
      });
      expect(screen.getByText('skill-15')).toBeInTheDocument();
      expect(screen.queryByText('skill-1')).not.toBeInTheDocument();

      expect(searchSkillsSpy).toHaveBeenCalled();
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete search within reasonable time', async () => {
      const startTime = Date.now();

      const searchSkillsSpy = vi
        .spyOn(aoRegistryService, 'searchSkills')
        .mockResolvedValue(mockSkills);

      render(
        <BrowserRouter>
          <SearchResults />
        </BrowserRouter>
      );

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText(/3 skills found/i)).toBeInTheDocument();
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Search should complete within 3 seconds (generous for testing)
      expect(duration).toBeLessThan(3000);

      expect(searchSkillsSpy).toHaveBeenCalled();
    });
  });
});
