import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkillCard } from '@/components/SkillCard';
import type { SkillMetadata } from '@/types/ao';

describe('SkillCard', () => {
  const mockSkill: SkillMetadata = {
    name: 'test-skill',
    version: '1.0.0',
    description: 'This is a test skill description',
    author: 'Test Author',
    owner: 'test-owner-address',
    tags: ['blockchain', 'web3', 'defi'],
    dependencies: [],
    arweaveTxId: 'test-txid-123',
    license: 'MIT',
    publishedAt: 1234567890,
    updatedAt: 1234567890,
    downloads: 12300,
  };

  it('renders skill name', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(screen.getByText('test-skill')).toBeInTheDocument();
  });

  it('renders skill version badge', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });

  it('renders skill description', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(
      screen.getByText('This is a test skill description')
    ).toBeInTheDocument();
  });

  it('renders author attribution', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(screen.getByText('by')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('renders first tag as badge', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(screen.getByText('blockchain')).toBeInTheDocument();
  });

  it('renders license when provided', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(screen.getByText('License: MIT')).toBeInTheDocument();
  });

  it('formats download count correctly (12.3k)', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(screen.getByText('12.3k downloads')).toBeInTheDocument();
  });

  it('formats large download count correctly (1.2M)', () => {
    const skillWithManyDownloads: SkillMetadata = {
      ...mockSkill,
      downloads: 1234567,
    };
    render(<SkillCard skill={skillWithManyDownloads} />);
    expect(screen.getByText('1.2M downloads')).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalSkill: SkillMetadata = {
      name: 'minimal-skill',
      version: '1.0.0',
      description: 'Minimal description',
      author: 'Author',
      owner: 'owner-address',
      tags: [],
      dependencies: [],
      arweaveTxId: 'txid',
      publishedAt: 1234567890,
      updatedAt: 1234567890,
    };
    render(<SkillCard skill={minimalSkill} />);

    expect(screen.getByText('minimal-skill')).toBeInTheDocument();
    expect(screen.queryByText(/License:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/downloads/)).not.toBeInTheDocument();
  });

  it('handles missing description gracefully', () => {
    const skillWithoutDescription: SkillMetadata = {
      ...mockSkill,
      description: '',
    };
    render(<SkillCard skill={skillWithoutDescription} />);
    expect(screen.getByText('No description available')).toBeInTheDocument();
  });

  it('handles missing author gracefully', () => {
    const skillWithoutAuthor: SkillMetadata = {
      ...mockSkill,
      author: '',
    };
    render(<SkillCard skill={skillWithoutAuthor} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const longDescription = 'a'.repeat(200);
    const skillWithLongDescription: SkillMetadata = {
      ...mockSkill,
      description: longDescription,
    };
    render(<SkillCard skill={skillWithLongDescription} />);

    const descriptionElement = screen.getByText(/aaa/, { exact: false });
    expect(descriptionElement).toBeInTheDocument();
    // Check that line-clamp-3 class is applied
    expect(descriptionElement).toHaveClass('line-clamp-3');
  });

  it('limits tags to 2 visible', () => {
    render(<SkillCard skill={mockSkill} />);

    // Should show first tag
    expect(screen.getByText('blockchain')).toBeInTheDocument();

    // Should not show third tag
    expect(screen.queryByText('defi')).not.toBeInTheDocument();
  });

  it('applies terminal theme classes', () => {
    const { container } = render(<SkillCard skill={mockSkill} />);

    // Check for terminal theme classes
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass('bg-terminal-surface');
    expect(card).toHaveClass('border-terminal-border');
  });

  it('applies hover effect classes', () => {
    const { container } = render(<SkillCard skill={mockSkill} />);

    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveClass('hover:border-syntax-blue');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SkillCard skill={mockSkill} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /Skill: test-skill/ });
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick handler when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SkillCard skill={mockSkill} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /Skill: test-skill/ });
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick handler when Space key is pressed', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<SkillCard skill={mockSkill} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: /Skill: test-skill/ });
    card.focus();
    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is keyboard accessible with tabIndex', () => {
    render(<SkillCard skill={mockSkill} />);

    const card = screen.getByRole('button', { name: /Skill: test-skill/ });
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('has proper ARIA label', () => {
    render(<SkillCard skill={mockSkill} />);

    const card = screen.getByRole('button', { name: 'Skill: test-skill' });
    expect(card).toBeInTheDocument();
  });

  it('displays zero downloads when downloads is 0', () => {
    const skillWithZeroDownloads: SkillMetadata = {
      ...mockSkill,
      downloads: 0,
    };
    render(<SkillCard skill={skillWithZeroDownloads} />);
    expect(screen.getByText('0 downloads')).toBeInTheDocument();
  });

  it('handles undefined tags array', () => {
    const skillWithUndefinedTags: SkillMetadata = {
      ...mockSkill,
      tags: undefined as any,
    };
    render(<SkillCard skill={skillWithUndefinedTags} />);

    // Should not crash and should render other content
    expect(screen.getByText('test-skill')).toBeInTheDocument();
  });
});
