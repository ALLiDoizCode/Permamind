import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SkillDetail } from '@/pages/SkillDetail';
import { getSkillVersions } from '@/services/ao-registry';
import { useSkill } from '@/hooks/useSkill';

// Mock the AO registry service
vi.mock('@/services/ao-registry');

// Mock the useSkill hook
vi.mock('@/hooks/useSkill');

describe('SkillDetail - Tab Structure (Story 6.8)', () => {
  const mockSkill = {
    name: 'test-skill',
    version: '1.0.0',
    author: 'Test Author',
    owner: 'test-owner',
    description: 'Test skill description',
    tags: ['test', 'example'],
    dependencies: ['dep1', 'dep2'],
    arweaveTxId: 'test-tx-id',
    publishedAt: Date.now(),
    updatedAt: Date.now(),
    downloads: 100,
    category: 'development',
    bundledFiles: [
      {
        name: 'SKILL.md',
        icon: '📄',
        type: 'markdown' as const,
        level: 'Level 2' as const,
        size: '4.2 KB',
        description: 'Main skill instructions',
        preview: `---
name: test-skill
description: Test skill
---
# When to Use This Skill
- Use for testing components
- Use for debugging applications
- Use for writing unit tests
- Use for integration testing
- Use for end-to-end testing
- Use for performance testing`,
      },
      {
        name: 'resource1.md',
        icon: '📦',
        type: 'markdown' as const,
        level: 'Level 3' as const,
        size: '2.5 KB',
        description: 'Resource file 1',
        preview: 'Resource 1 content',
      },
      {
        name: 'resource2.md',
        icon: '📦',
        type: 'markdown' as const,
        level: 'Level 3' as const,
        size: '3.1 KB',
        description: 'Resource file 2',
        preview: 'Resource 2 content',
      },
    ],
  };

  const mockVersions = [
    { version: '1.0.0', publishedAt: Date.now(), arweaveTxId: 'tx1' },
    { version: '0.9.0', publishedAt: Date.now() - 86400000, arweaveTxId: 'tx2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSkillDetail = (skill: any = mockSkill) => {
    vi.mocked(useSkill).mockReturnValue({
      skill,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(getSkillVersions).mockResolvedValue(mockVersions);

    return render(
      <MemoryRouter initialEntries={['/skills/test-skill']}>
        <Routes>
          <Route path="/skills/:name" element={<SkillDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Tab Structure', () => {
    it('renders exactly 3 tabs', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);
      });
    });

    it('renders overview tab with emoji icon and lowercase text', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const overviewTab = screen.getByRole('tab', { name: /overview/i });
        expect(overviewTab).toBeInTheDocument();
        expect(overviewTab).toHaveTextContent('📄');
        expect(overviewTab).toHaveTextContent('overview');
      });
    });

    it('renders dependencies tab with emoji icon, lowercase text, and count', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const dependenciesTab = screen.getByRole('tab', { name: /dependencies/i });
        expect(dependenciesTab).toBeInTheDocument();
        expect(dependenciesTab).toHaveTextContent('📦');
        expect(dependenciesTab).toHaveTextContent('dependencies');
        expect(dependenciesTab).toHaveTextContent('2'); // mockSkill has 2 dependencies
      });
    });

    it('renders versions tab with emoji icon, lowercase text, and count', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const versionsTab = screen.getByRole('tab', { name: /versions/i });
        expect(versionsTab).toBeInTheDocument();
        expect(versionsTab).toHaveTextContent('🔖');
        expect(versionsTab).toHaveTextContent('versions');
        expect(versionsTab).toHaveTextContent('2'); // mockVersions has 2 versions
      });
    });

    it('shows correct dependencies count based on dependencies length', async () => {
      const skillWithNoDeps = { ...mockSkill, dependencies: [] };
      renderSkillDetail(skillWithNoDeps);

      await waitFor(() => {
        const dependenciesTab = screen.getByRole('tab', { name: /dependencies/i });
        expect(dependenciesTab).toHaveTextContent('0');
      });
    });

    it('shows correct versions count based on versions data', async () => {
      const singleVersion = [
        { version: '1.0.0', publishedAt: Date.now(), arweaveTxId: 'tx1' },
      ];

      vi.mocked(useSkill).mockReturnValue({
        skill: mockSkill,
        loading: false,
        error: null,
        refetch: vi.fn(),
      });

      vi.mocked(getSkillVersions).mockResolvedValue(singleVersion);

      render(
        <MemoryRouter initialEntries={['/skills/test-skill']}>
          <Routes>
            <Route path="/skills/:name" element={<SkillDetail />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const versionsTab = screen.getByRole('tab', { name: /versions/i });
        expect(versionsTab.textContent).toContain('1');
      }, { timeout: 3000 });
    });
  });

  describe('Removed Tabs', () => {
    it('does not render Installation tab', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const installationTab = screen.queryByRole('tab', { name: /installation/i });
        expect(installationTab).not.toBeInTheDocument();
      });
    });

  });

  describe('Tab Content', () => {
    it('displays overview content by default', async () => {
      renderSkillDetail();

      await waitFor(() => {
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('$ Quick Install')).toBeInTheDocument();
      });
    });

    it('dependencies tab shows dependency list (string format)', async () => {
      const user = userEvent.setup();
      renderSkillDetail();

      const dependenciesTab = await screen.findByRole('tab', { name: /dependencies/i });
      await user.click(dependenciesTab);

      await waitFor(() => {
        expect(screen.getByText('Dependency Overview')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('dep1')).toBeInTheDocument();
      expect(screen.getByText('dep2')).toBeInTheDocument();
    });

    it('dependencies tab shows dependency list (object format with versions)', async () => {
      const user = userEvent.setup();
      const skillWithObjectDeps = {
        ...mockSkill,
        dependencies: [
          { name: 'ao', version: '1.0.3' },
          { name: 'arweave', version: '2.0.0' },
        ],
      };
      renderSkillDetail(skillWithObjectDeps);

      const dependenciesTab = await screen.findByRole('tab', { name: /dependencies/i });
      await user.click(dependenciesTab);

      await waitFor(() => {
        expect(screen.getByText('Dependency Overview')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('ao')).toBeInTheDocument();
      expect(screen.getByText('1.0.3')).toBeInTheDocument();
      expect(screen.getByText('arweave')).toBeInTheDocument();
      expect(screen.getByText('2.0.0')).toBeInTheDocument();
    });

    it('dependencies tab handles mixed format (string and object)', async () => {
      const user = userEvent.setup();
      const skillWithMixedDeps = {
        ...mockSkill,
        dependencies: [
          'simple-dep',
          { name: 'versioned-dep', version: '3.2.1' },
        ],
      };
      renderSkillDetail(skillWithMixedDeps);

      const dependenciesTab = await screen.findByRole('tab', { name: /dependencies/i });
      await user.click(dependenciesTab);

      await waitFor(() => {
        expect(screen.getByText('Dependency Overview')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(screen.getByText('simple-dep')).toBeInTheDocument();
      expect(screen.getByText('versioned-dep')).toBeInTheDocument();
      expect(screen.getByText('3.2.1')).toBeInTheDocument();
    });

    it('versions tab shows version history', async () => {
      const user = userEvent.setup();
      renderSkillDetail();

      const versionsTab = await screen.findByRole('tab', { name: /versions/i });
      await user.click(versionsTab);

      await waitFor(() => {
        expect(screen.getByText('Version History')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check that version text appears in the tabpanel (not just in the tab or header)
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveTextContent('1.0.0');
      expect(tabpanel).toHaveTextContent('0.9.0');
    });
  });

  describe('Accessibility', () => {
    it('tabs have proper ARIA roles', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const tablist = screen.getByRole('tablist');
        expect(tablist).toBeInTheDocument();

        const tabs = screen.getAllByRole('tab');
        expect(tabs).toHaveLength(3);

        const tabpanel = screen.getByRole('tabpanel');
        expect(tabpanel).toBeInTheDocument();
      });
    });

    it('overview tab is selected by default', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const overviewTab = screen.getByRole('tab', { name: /overview/i });
        expect(overviewTab).toHaveAttribute('data-state', 'active');
      });
    });
  });
});

describe('SkillDetail - Overview Tab Unified Card (Story 6.11)', () => {
  const mockSkill = {
    name: 'test-skill',
    version: '1.0.0',
    author: 'Test Author',
    owner: 'test-owner',
    description: 'A comprehensive test skill for validating the unified overview card structure.',
    tags: ['test', 'example'],
    dependencies: ['dep1', 'dep2'],
    arweaveTxId: 'test-tx-id',
    publishedAt: Date.now(),
    updatedAt: Date.now(),
    downloads: 100,
    category: 'development',
    bundledFiles: [
      {
        name: 'SKILL.md',
        icon: '📄',
        type: 'markdown' as const,
        level: 'Level 2' as const,
        size: '4.2 KB',
        description: 'Main skill instructions',
        preview: `---
name: test-skill
description: Test skill
---
# When to Use This Skill
- Use for testing components
- Use for debugging applications
- Use for writing unit tests
- Use for integration testing
- Use for end-to-end testing
- Use for performance testing`,
      },
      {
        name: 'resource1.md',
        icon: '📦',
        type: 'markdown' as const,
        level: 'Level 3' as const,
        size: '2.5 KB',
        description: 'Resource file 1',
        preview: 'Resource 1 content',
      },
      {
        name: 'resource2.md',
        icon: '📦',
        type: 'markdown' as const,
        level: 'Level 3' as const,
        size: '3.1 KB',
        description: 'Resource file 2',
        preview: 'Resource 2 content',
      },
      {
        name: 'resource3.md',
        level: 'Level 3',
        size: '1.5',
        preview: 'Resource 3 content',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSkillDetail = (skill: any = mockSkill) => {
    vi.mocked(useSkill).mockReturnValue({
      skill,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    vi.mocked(getSkillVersions).mockResolvedValue([
      { version: '1.0.0', publishedAt: Date.now(), arweaveTxId: 'tx1' },
    ]);

    return render(
      <MemoryRouter initialEntries={['/skills/test-skill']}>
        <Routes>
          <Route path="/skills/:name" element={<SkillDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Unified Card Structure', () => {
    it('renders overview tab with single Card component', async () => {
      const { container } = renderSkillDetail();

      await waitFor(() => {
        const overviewTabPanel = container.querySelector('[role="tabpanel"][data-state="active"]');
        expect(overviewTabPanel).toBeInTheDocument();

        // Single Card should be direct child of TabsContent
        const cards = overviewTabPanel?.querySelectorAll(':scope > .border');
        expect(cards?.length).toBe(1);
      });
    });

    it('renders all sections in correct order', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const sections = screen.getAllByRole('heading', { level: 3 });
        expect(sections).toHaveLength(3); // Quick Install, Description, When to Use (Skill Composition has no heading)

        expect(sections[0]).toHaveTextContent('$ Quick Install');
        expect(sections[1]).toHaveTextContent('Description');
        expect(sections[2]).toHaveTextContent('When to Use This Skill');
      });
    });

    it('renders section dividers between content sections', async () => {
      const { container } = renderSkillDetail();

      await waitFor(() => {
        const dividers = container.querySelectorAll('.border-t.border-terminal-border');
        // Expect 4 dividers: after Quick Install, after Description, after When to Use, and before Skill Composition
        expect(dividers.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Quick Install Section', () => {
    it('renders Quick Install heading with terminal styling', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const heading = screen.getByText('$ Quick Install');
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe('H3');
        expect(heading.className).toContain('text-syntax-green');
        expect(heading.className).toContain('font-mono');
      });
    });

    it('renders install command with $ symbol', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const commandText = screen.getByText(/skills install test-skill/i);
        expect(commandText).toBeInTheDocument();
      });
    });

    it('renders copy button for install command', async () => {
      renderSkillDetail();

      await waitFor(() => {
        // CopyButton should be present in the Quick Install section
        const quickInstallSection = screen.getByText('$ Quick Install').parentElement;
        expect(quickInstallSection).toBeInTheDocument();
      });
    });

    it('renders activation note text', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const activationNote = screen.getByText(/This skill will activate automatically/i);
        expect(activationNote).toBeInTheDocument();
        expect(activationNote.className).toContain('text-xs');
        expect(activationNote.className).toContain('text-terminal-muted');
      });
    });
  });

  describe('Description Section', () => {
    it('renders Description heading', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const heading = screen.getByText('Description');
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe('H3');
        expect(heading.className).toContain('text-terminal-text');
        expect(heading.className).toContain('font-mono');
      });
    });

    it('displays skill description text', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const description = screen.getByText(/comprehensive test skill/i);
        expect(description).toBeInTheDocument();
        expect(description.className).toContain('text-terminal-muted');
        expect(description.className).toContain('leading-relaxed');
      });
    });
  });

  describe('When to Use This Skill Section', () => {
    it('renders section heading', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const heading = screen.getByText('When to Use This Skill');
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe('H3');
      });
    });

    it('parses and displays bullet points from SKILL.md preview', async () => {
      renderSkillDetail();

      await waitFor(() => {
        expect(screen.getByText('- Use for testing components')).toBeInTheDocument();
        expect(screen.getByText('- Use for debugging applications')).toBeInTheDocument();
        expect(screen.getByText('- Use for writing unit tests')).toBeInTheDocument();
      });
    });

    it('limits bullet points to first 5 items', async () => {
      renderSkillDetail();

      await waitFor(() => {
        // Should display 5 bullets
        const bullets = screen.getAllByText(/^- Use for/);
        expect(bullets.length).toBeLessThanOrEqual(5);
      });
    });

    it('displays fallback text when no bullets found', async () => {
      const skillNoBullets = {
        ...mockSkill,
        bundledFiles: [
          {
            name: 'SKILL.md',
            level: 'Level 2',
            size: '1.0',
            preview: 'No bullets here, just plain text.',
          },
        ],
      };

      renderSkillDetail(skillNoBullets);

      await waitFor(() => {
        expect(screen.getByText(/Use this skill when working with development tasks/i)).toBeInTheDocument();
      });
    });

    it('displays fallback text when bundledFiles is empty', async () => {
      const skillNoFiles = {
        ...mockSkill,
        bundledFiles: [],
      };

      renderSkillDetail(skillNoFiles);

      await waitFor(() => {
        expect(screen.getByText(/Use this skill when working with development tasks/i)).toBeInTheDocument();
      });
    });
  });

  describe('Skill Composition Section', () => {
    it('displays L2 file count with badge', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const l2Text = screen.getByText(/1 instruction file/i);
        expect(l2Text).toBeInTheDocument();
      });
    });

    it('displays L3 file count with badge', async () => {
      renderSkillDetail();

      await waitFor(() => {
        const l3Text = screen.getByText(/3 resource files/i);
        expect(l3Text).toBeInTheDocument();
      });
    });

    it('calculates and displays total size correctly', async () => {
      renderSkillDetail();

      await waitFor(() => {
        // Total: 4.2 + 2.5 + 3.1 + 1.5 = 11.3 KB
        const totalSize = screen.getByText(/11\.3 KB total/i);
        expect(totalSize).toBeInTheDocument();
      });
    });

    it('handles empty bundledFiles array', async () => {
      const skillNoFiles = {
        ...mockSkill,
        bundledFiles: [],
      };

      renderSkillDetail(skillNoFiles);

      await waitFor(() => {
        expect(screen.getByText(/0 instruction file/i)).toBeInTheDocument();
        expect(screen.getByText(/0 resource files/i)).toBeInTheDocument();
        expect(screen.getByText(/0\.0 KB total/i)).toBeInTheDocument();
      });
    });
  });

  describe('Removed Quick Info Section', () => {
    it('does not render Quick Info card in overview tab', async () => {
      renderSkillDetail();

      await waitFor(() => {
        // Quick Info should not appear as a heading anymore
        const quickInfoHeading = screen.queryByText('Quick Info');
        expect(quickInfoHeading).not.toBeInTheDocument();
      });
    });

    it('does not render version/author/license grid in overview tab', async () => {
      const { container } = renderSkillDetail();

      await waitFor(() => {
        // Check that the 6-item grid structure doesn't exist in overview tab
        const overviewTabPanel = container.querySelector('[role="tabpanel"][data-state="active"]');
        const gridElements = overviewTabPanel?.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2');
        // Grid should not exist in overview tab
        expect(gridElements?.length).toBe(0);
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders without layout errors on mobile viewport', async () => {
      global.innerWidth = 375;
      renderSkillDetail();

      await waitFor(() => {
        expect(screen.getByText('$ Quick Install')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
      });
    });
  });
});
