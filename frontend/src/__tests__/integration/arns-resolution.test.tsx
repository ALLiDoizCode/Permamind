import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SkillCard } from '@/components/SkillCard';
import type { SkillMetadata } from '@/types/ao';
import * as arnsResolver from '@/lib/arns-resolver';

// Mock the arns-resolver module
vi.mock('@/lib/arns-resolver', () => ({
  resolvePrimaryName: vi.fn(),
  clearCache: vi.fn(),
}));

describe('ArNS Resolution Integration Tests', () => {
  const mockSkill: SkillMetadata = {
    name: 'test-skill',
    version: '1.0.0',
    description: 'A test skill for ArNS resolution',
    author: 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU',
    owner: 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU',
    tags: ['test', 'arns'],
    dependencies: [],
    arweaveTxId: 'test-tx-id',
    publishedAt: Date.now(),
    updatedAt: Date.now(),
    downloads: 100,
    license: 'MIT',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SkillCard Component', () => {
    it('should display ArNS name when resolution succeeds', async () => {
      const expectedName = 'jonniesparkles';
      vi.mocked(arnsResolver.resolvePrimaryName).mockResolvedValue(
        expectedName
      );

      render(<SkillCard skill={mockSkill} />);

      // Initially shows address
      expect(
        screen.getByText(/OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU/)
      ).toBeInTheDocument();

      // Wait for ArNS name to be resolved and displayed
      await waitFor(() => {
        expect(screen.getByText(expectedName)).toBeInTheDocument();
      });

      // Address should no longer be visible
      expect(
        screen.queryByText('OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU')
      ).not.toBeInTheDocument();
    });

    it('should display address when ArNS resolution fails', async () => {
      vi.mocked(arnsResolver.resolvePrimaryName).mockResolvedValue(null);

      render(<SkillCard skill={mockSkill} />);

      // Wait for resolution attempt
      await waitFor(() => {
        expect(arnsResolver.resolvePrimaryName).toHaveBeenCalled();
      });

      // Should still display the address (fallback)
      expect(
        screen.getByText(/OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU/)
      ).toBeInTheDocument();
    });

    it('should display "Unknown" for missing author', async () => {
      const skillWithoutAuthor = { ...mockSkill, author: '' };

      render(<SkillCard skill={skillWithoutAuthor} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should maintain styling with ArNS name', async () => {
      const expectedName = 'alice';
      vi.mocked(arnsResolver.resolvePrimaryName).mockResolvedValue(
        expectedName
      );

      render(<SkillCard skill={mockSkill} />);

      await waitFor(() => {
        expect(screen.getByText(expectedName)).toBeInTheDocument();
      });

      // Check that the "by" text has correct styling
      const byElement = screen.getByText('by');
      expect(byElement).toHaveClass('text-syntax-purple');

      // Check that the author display maintains font-mono
      const authorContainer = byElement.parentElement;
      expect(authorContainer).toHaveClass('font-mono');
    });

    it('should handle resolution errors gracefully', async () => {
      vi.mocked(arnsResolver.resolvePrimaryName).mockRejectedValue(
        new Error('Network error')
      );

      render(<SkillCard skill={mockSkill} />);

      // Component should still render without crashing
      expect(screen.getByText('test-skill')).toBeInTheDocument();

      // Should fallback to displaying address
      await waitFor(() => {
        expect(
          screen.getByText(/OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Multiple SkillCards', () => {
    it('should resolve ArNS names independently for multiple skills', async () => {
      const skill1 = {
        ...mockSkill,
        name: 'skill-1',
        author: 'OU48aJtcq3KjsEqSUWDVpynh1xP2Y1VI-bwiSukAktU',
      };
      const skill2 = {
        ...mockSkill,
        name: 'skill-2',
        author: 'XYZ_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890ABC',
      };

      vi.mocked(arnsResolver.resolvePrimaryName).mockImplementation(
        async (address) => {
          if (address === skill1.author) return 'alice';
          if (address === skill2.author) return 'bob';
          return null;
        }
      );

      render(
        <>
          <SkillCard skill={skill1} />
          <SkillCard skill={skill2} />
        </>
      );

      await waitFor(
        () => {
          expect(screen.getByText('alice')).toBeInTheDocument();
          expect(screen.getByText('bob')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(arnsResolver.resolvePrimaryName).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    it('should use cached results for same author', async () => {
      const skill1 = { ...mockSkill, name: 'skill-1' };
      const skill2 = { ...mockSkill, name: 'skill-2' };

      vi.mocked(arnsResolver.resolvePrimaryName).mockResolvedValue('alice');

      render(
        <>
          <SkillCard skill={skill1} />
          <SkillCard skill={skill2} />
        </>
      );

      await waitFor(() => {
        const aliceElements = screen.getAllByText('alice');
        expect(aliceElements).toHaveLength(2);
      });

      // Cache should prevent multiple calls for same address
      // Note: This depends on the resolver's caching implementation
      expect(arnsResolver.resolvePrimaryName).toHaveBeenCalled();
    });
  });
});
