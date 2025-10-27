import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SkillMetadata } from '@/types/ao';
import { useArnsName } from '@/hooks/useArnsName';

interface SkillCardProps {
  skill: SkillMetadata;
  onClick?: () => void;
}

/**
 * Format download count for display (e.g., 12300 -> "12.3k")
 */
function formatDownloads(downloads?: number): string {
  if (!downloads) return '0';
  if (downloads >= 1000000) {
    return `${(downloads / 1000000).toFixed(1)}M`;
  }
  if (downloads >= 1000) {
    return `${(downloads / 1000).toFixed(1)}k`;
  }
  return downloads.toString();
}

export function SkillCard({ skill, onClick }: SkillCardProps) {
  // Resolve ArNS name for owner (wallet address)
  const { arnsName } = useArnsName(skill.owner || '');

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  // Get first 2 tags for display
  const displayTags = skill.tags?.slice(0, 2) || [];
  const firstTag = displayTags[0];

  // Display ArNS name if available, otherwise fallback to address
  const authorDisplay = arnsName || skill.author || 'Unknown';

  return (
    <Card
      className="group relative cursor-pointer transition-all duration-300 hover:border-syntax-blue hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Skill: ${skill.name}`}
    >
      <CardHeader className="relative pb-3">
        {/* Download count in top-right */}
        {skill.downloads !== undefined && (
          <div className="absolute right-6 top-6 text-xs text-terminal-muted font-mono">
            {formatDownloads(skill.downloads)} downloads
          </div>
        )}

        {/* Skill name with gradient */}
        <h3
          className="text-lg font-bold font-mono bg-gradient-to-r from-syntax-blue via-syntax-cyan to-syntax-green bg-clip-text text-transparent"
          style={{ gridColumn: '1 / -1' }}
        >
          {skill.name}
        </h3>

        {/* Version and Category badges */}
        <div
          className="flex gap-2 items-center flex-wrap"
          style={{ gridColumn: '1 / -1' }}
        >
          <Badge variant="green">{skill.version}</Badge>
          {firstTag && <Badge variant="cyan">{firstTag}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description with 3-line clamp */}
        <p className="text-sm text-terminal-muted line-clamp-3 leading-relaxed">
          {skill.description || 'No description available'}
        </p>

        {/* Author attribution */}
        <div className="text-xs font-mono">
          <span className="text-syntax-purple">by</span>{' '}
          <a
            href={`https://www.ao.link/#/entity/${skill.owner}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-syntax-cyan hover:text-syntax-green transition-colors underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
            title={`View ${authorDisplay} on AO Link`}
          >
            {authorDisplay}
          </a>
        </div>

        {/* License if available */}
        {skill.license && (
          <div className="text-xs text-terminal-muted font-mono">
            License: {skill.license}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
