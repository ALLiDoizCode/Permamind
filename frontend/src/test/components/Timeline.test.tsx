import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timeline, TimelineVersion } from '@/components/Timeline';

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(),
};

Object.assign(navigator, {
  clipboard: mockClipboard,
});

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

describe('Timeline', () => {
  const mockVersions: TimelineVersion[] = [
    {
      version: '1.2.0',
      date: 'Jan 15, 2025',
      txid: 'abc1234567890def1234567890',
      status: 'latest',
      size: '15 KB',
      changelog:
        'Added ArNS undername management guide. Updated transaction signing workflows for latest Arweave SDK. New example scripts for batch uploads',
    },
    {
      version: '1.1.0',
      date: 'Dec 10, 2024',
      txid: 'xyz9876543210ghi9876543210',
      status: '',
      size: '12 KB',
      changelog: 'Fixed bug in wallet connection. Improved error messages',
    },
    {
      version: '1.0.0',
      date: 'Nov 1, 2024',
      txid: 'def4567890123jkl4567890123',
      status: '',
      size: '10 KB',
      changelog: 'Initial release',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correct number of version items', () => {
    render(<Timeline versions={mockVersions} skillName="test-skill" />);

    expect(screen.getByText('1.2.0')).toBeInTheDocument();
    expect(screen.getByText('1.1.0')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });

  it('latest version shows green dot with ring', () => {
    const { container } = render(
      <Timeline versions={mockVersions} skillName="test-skill" />
    );

    const dots = container.querySelectorAll('.rounded-full');
    const latestDot = dots[0];

    expect(latestDot.className).toContain('bg-syntax-green');
    expect(latestDot.className).toContain('ring-4');
    expect(latestDot.className).toContain('ring-syntax-green/20');
  });

  it('other versions show blue dot without ring', () => {
    const { container } = render(
      <Timeline versions={mockVersions} skillName="test-skill" />
    );

    const dots = container.querySelectorAll('.rounded-full');
    const secondDot = dots[1];
    const thirdDot = dots[2];

    expect(secondDot.className).toContain('bg-syntax-blue');
    expect(secondDot.className).not.toContain('ring-4');

    expect(thirdDot.className).toContain('bg-syntax-blue');
    expect(thirdDot.className).not.toContain('ring-4');
  });

  it('displays latest badge for latest version only', () => {
    render(<Timeline versions={mockVersions} skillName="test-skill" />);

    const badges = screen.getAllByText('Latest');
    expect(badges).toHaveLength(1);
  });

  it('renders connecting lines between versions (not on last)', () => {
    const { container } = render(
      <Timeline versions={mockVersions} skillName="test-skill" />
    );

    const connectingLines = container.querySelectorAll(
      '.bg-terminal-border.min-h-\\[80px\\]'
    );
    // Should have 2 connecting lines (3 versions = 2 connections)
    expect(connectingLines).toHaveLength(2);
  });

  it('changelog splits into bullets correctly', () => {
    render(<Timeline versions={mockVersions} skillName="test-skill" />);

    // First version has 3 changelog items
    expect(
      screen.getByText(/Added ArNS undername management guide/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Updated transaction signing workflows for latest Arweave SDK/
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/New example scripts for batch uploads/)
    ).toBeInTheDocument();

    // Second version has 2 changelog items
    expect(
      screen.getByText(/Fixed bug in wallet connection/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Improved error messages/)).toBeInTheDocument();

    // Third version has 1 changelog item
    expect(screen.getByText(/Initial release/)).toBeInTheDocument();
  });

  it('install button copies correct command to clipboard', async () => {
    mockClipboard.writeText.mockResolvedValue(undefined);

    render(<Timeline versions={mockVersions} skillName="test-skill" />);

    const installButtons = screen.getAllByText('$ install');
    await userEvent.click(installButtons[0]);

    // Small delay for async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockClipboard.writeText).toHaveBeenCalledWith(
      'agent-skills install test-skill@1.2.0'
    );
  });

  it('view on Arweave button opens correct URL', async () => {
    const user = userEvent.setup();
    render(<Timeline versions={mockVersions} skillName="test-skill" />);

    const viewButtons = screen.getAllByRole('button', {
      name: /View version.*on Arweave/,
    });
    await user.click(viewButtons[0]);

    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://arweave.net/abc1234567890def1234567890',
      '_blank'
    );
  });

  it('truncates transaction ID to first 7 characters', () => {
    render(<Timeline versions={mockVersions} skillName="test-skill" />);

    expect(screen.getByText('abc1234')).toBeInTheDocument();
    expect(screen.getByText('xyz9876')).toBeInTheDocument();
    expect(screen.getByText('def4567')).toBeInTheDocument();
  });

  it('displays version metadata correctly', () => {
    render(<Timeline versions={mockVersions} skillName="test-skill" />);

    // Check dates
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    expect(screen.getByText('Dec 10, 2024')).toBeInTheDocument();
    expect(screen.getByText('Nov 1, 2024')).toBeInTheDocument();

    // Check sizes
    expect(screen.getByText('15 KB')).toBeInTheDocument();
    expect(screen.getByText('12 KB')).toBeInTheDocument();
    expect(screen.getByText('10 KB')).toBeInTheDocument();
  });

  it('renders empty timeline when no versions provided', () => {
    const { container } = render(
      <Timeline versions={[]} skillName="test-skill" />
    );

    const timeline = container.querySelector('.space-y-0');
    expect(timeline?.children).toHaveLength(0);
  });

  it('handles single version correctly (no connecting line)', () => {
    const singleVersion: TimelineVersion[] = [mockVersions[0]];
    const { container } = render(
      <Timeline versions={singleVersion} skillName="test-skill" />
    );

    const connectingLines = container.querySelectorAll(
      '.bg-terminal-border.min-h-\\[80px\\]'
    );
    expect(connectingLines).toHaveLength(0);
  });

  it('handles missing txid gracefully (no arweave button)', () => {
    const versionWithoutTxid: TimelineVersion[] = [
      {
        version: '2.0.0',
        date: 'Feb 1, 2025',
        status: 'latest',
        size: '20 KB',
        changelog: 'Major release with breaking changes',
        // No txid field
      },
    ];

    render(<Timeline versions={versionWithoutTxid} skillName="test-skill" />);

    // Install button should still be present
    expect(screen.getByText('$ install')).toBeInTheDocument();

    // Arweave button and txid should not be present
    expect(screen.queryByText('view on arweave ↗')).not.toBeInTheDocument();
    expect(screen.queryByText(/^[a-z0-9]{7}$/)).not.toBeInTheDocument();
  });
});
