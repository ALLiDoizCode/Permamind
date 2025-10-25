import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/SearchBar';
import type { SkillMetadata } from '@/types/ao';

// Mock the useSkillSearch hook
vi.mock('@/hooks/useSkillSearch', () => ({
  useSkillSearch: vi.fn(),
}));

import { useSkillSearch } from '@/hooks/useSkillSearch';

const mockUseSkillSearch = useSkillSearch as ReturnType<typeof vi.fn>;

describe('SearchBar', () => {
  const mockSkills: SkillMetadata[] = [
    {
      name: 'blockchain-fundamentals',
      version: '1.2.0',
      description: 'Learn blockchain basics',
      author: 'Alex',
      owner: 'owner1',
      tags: ['blockchain'],
      dependencies: [],
      arweaveTxId: 'txid1',
      publishedAt: 1234567890,
      updatedAt: 1234567890,
    },
    {
      name: 'blockchain-advanced',
      version: '2.0.0',
      description: 'Advanced blockchain topics',
      author: 'Sam',
      owner: 'owner2',
      tags: ['blockchain'],
      dependencies: [],
      arweaveTxId: 'txid2',
      publishedAt: 1234567890,
      updatedAt: 1234567890,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with placeholder', () => {
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    expect(
      screen.getByPlaceholderText('search skills --query blockchain')
    ).toBeInTheDocument();
  });

  it('renders $ prompt prefix', () => {
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    expect(screen.getByText('$')).toBeInTheDocument();
  });

  it('renders keyboard shortcut hint', () => {
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });

  it('updates input value when typing', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox', { name: /search skills/i });

    await user.type(input, 'blockchain');
    expect(input).toHaveValue('blockchain');
  });

  it('does not show dropdown for queries shorter than 2 characters', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'b');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows dropdown with results when query is >= 2 characters', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  it('shows loading state during search', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: true,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  it('shows error message when search fails', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: false,
      error: new Error('Network error'),
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => {
      expect(
        screen.getByText('Search failed. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it.skip('shows "No matches found" when no results', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: false,
      error: null,
    });

    const { rerender } = render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'nonexistent');

    // Force re-render to update dropdown visibility
    rerender(<SearchBar />);

    await waitFor(
      () => {
        expect(screen.queryByRole('listbox')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('displays skill results in dropdown', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => {
      expect(screen.getByText('blockchain-fundamentals')).toBeInTheDocument();
      expect(screen.getByText('blockchain-advanced')).toBeInTheDocument();
    });
  });

  it('limits displayed results to 5', async () => {
    const user = userEvent.setup();
    const manySkills = Array.from({ length: 10 }, (_, i) => ({
      ...mockSkills[0],
      name: `skill-${i}`,
    }));

    mockUseSkillSearch.mockReturnValue({
      skills: manySkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'skill');
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(5);
    });
  });

  it('highlights selected item on arrow down', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => screen.getByRole('listbox'));

    await user.keyboard('{ArrowDown}');
    const firstOption = screen.getAllByRole('option')[0];
    expect(firstOption).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates through results with arrow keys', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => screen.getByRole('listbox'));

    await user.keyboard('{ArrowDown}');
    let options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowUp}');
    options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('selects skill on Enter key', async () => {
    const user = userEvent.setup();
    const onSkillSelect = vi.fn();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar onSkillSelect={onSkillSelect} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => screen.getByRole('listbox'));

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(onSkillSelect).toHaveBeenCalledWith(mockSkills[0]);
  });

  it('selects skill on click', async () => {
    const user = userEvent.setup();
    const onSkillSelect = vi.fn();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar onSkillSelect={onSkillSelect} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => screen.getByRole('listbox'));

    const firstOption = screen.getByText('blockchain-fundamentals');
    await user.click(firstOption);

    expect(onSkillSelect).toHaveBeenCalledWith(mockSkills[0]);
  });

  it('closes dropdown on Escape key', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => screen.getByRole('listbox'));

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('updates input value when skill is selected', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => screen.getByRole('listbox'));

    const firstOption = screen.getByText('blockchain-fundamentals');
    await user.click(firstOption);

    expect(input).toHaveValue('blockchain-fundamentals');
  });

  it('shows navigation hints in dropdown footer', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => {
      expect(
        screen.getByText(/↑↓ navigate • ↵ select • esc close/)
      ).toBeInTheDocument();
    });
  });

  it('shows result count in dropdown footer', async () => {
    const user = userEvent.setup();
    mockUseSkillSearch.mockReturnValue({
      skills: mockSkills,
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'blockchain');
    await waitFor(() => {
      expect(screen.getByText(/2 of 2 results/)).toBeInTheDocument();
    });
  });

  it('applies terminal theme classes', () => {
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveClass('bg-terminal-surface');
    expect(input).toHaveClass('border-terminal-border');
    expect(input).toHaveClass('text-terminal-text');
    expect(input).toHaveClass('font-mono');
  });

  it('has proper ARIA attributes', () => {
    mockUseSkillSearch.mockReturnValue({
      skills: [],
      loading: false,
      error: null,
    });

    render(<SearchBar />);
    const input = screen.getByRole('textbox');

    expect(input).toHaveAttribute('aria-label', 'Search skills');
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
