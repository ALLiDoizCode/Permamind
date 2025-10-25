import { useDownloadStats } from '@/hooks/useDownloadStats';
import { getSmartDownloadStats } from '@/lib/smartDownloadStats';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SkillMetadata } from '@/types/ao';

interface SmartStatsDisplayProps {
  skill: SkillMetadata;
}

/**
 * Smart Stats Display Component
 *
 * Displays the best 2 download metrics for a skill based on activity patterns:
 * - Popular skills (>=100 downloads): Total + Last Week
 * - New skills (<30 days, <100 downloads): Best 2 metrics
 * - Active skills (recent downloads): Last Week + other
 * - Default: Total + Last Month
 *
 * Features:
 * - Loading skeletons during fetch
 * - Graceful fallback to simple download count on error
 * - Tooltips for time ranges
 * - Terminal theme badge styling
 */
export function SmartStatsDisplay({ skill }: SmartStatsDisplayProps) {
  const { stats, loading, error } = useDownloadStats({ skillName: skill.name });

  // Loading state - show skeleton badges
  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    );
  }

  // Error or no stats - fallback to simple download count
  if (error || !stats) {
    return (
      <span className="text-terminal-muted text-sm">
        {skill.downloads || 0} downloads
      </span>
    );
  }

  // Get smart stats based on skill activity pattern
  const smartStats = getSmartDownloadStats(skill, stats);

  return (
    <div className="flex flex-wrap gap-2">
      {smartStats.map((stat, index) => (
        <Badge
          key={index}
          variant={index === 0 ? 'green' : 'cyan'}
          className="text-xs font-mono"
          title={stat.tooltip}
        >
          {stat.value.toLocaleString()} {stat.label.toLowerCase()}
        </Badge>
      ))}
    </div>
  );
}
