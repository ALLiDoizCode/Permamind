import type { SkillMetadata, DownloadStats } from '@/types/ao';

// Thresholds for smart display logic
const THRESHOLDS = {
  POPULAR_DOWNLOADS: 100, // >= 100 downloads = popular
  NEW_SKILL_DAYS: 30, // < 30 days since published = new
  ACTIVE_RECENT_DAYS: 7, // Downloads in last 7 days = active
};

export interface StatDisplay {
  label: string; // e.g., "Total Downloads", "Last Week"
  value: number; // Download count
  tooltip: string; // e.g., "Past 7 days", "All time"
}

/**
 * Calculate skill age in days from publishedAt timestamp
 */
function getSkillAgeInDays(publishedAt: number): number {
  const now = Date.now();
  const ageInMs = now - publishedAt;
  return ageInMs / (1000 * 60 * 60 * 24);
}

/**
 * Determine the best 2 download metrics to display for a skill based on activity patterns
 *
 * Logic:
 * - Popular skills (>=100 downloads): Show "Total Downloads" + "Last Week"
 * - New skills (<30 days, <100 downloads): Show best 2 metrics based on activity
 * - Active skills (downloads in last 7 days): Prioritize "Last Week" + one other
 * - Default: Show "Total Downloads" + "Last Month"
 *
 * @param skill - Skill metadata with publishedAt timestamp
 * @param stats - Download statistics from Get-Download-Stats handler
 * @returns Array of 2 stat displays to show
 */
export function getSmartDownloadStats(
  skill: SkillMetadata,
  stats: DownloadStats | null
): StatDisplay[] {
  // Handle no stats or missing data - return default display
  if (!stats) {
    return [
      {
        label: 'Total Downloads',
        value: skill.downloads || 0,
        tooltip: 'All time',
      },
      {
        label: 'Last Month',
        value: 0,
        tooltip: 'Past 30 days',
      },
    ];
  }

  const {
    downloads7Days = 0,
    downloads30Days = 0,
    downloadsTotal = skill.downloads || 0,
  } = stats;

  const skillAgeInDays = getSkillAgeInDays(skill.publishedAt);
  const isNewSkill = skillAgeInDays < THRESHOLDS.NEW_SKILL_DAYS;
  const isPopular = downloadsTotal >= THRESHOLDS.POPULAR_DOWNLOADS;
  const isActive = downloads7Days > 0;

  // Popular skills: Show total + last week
  if (isPopular) {
    return [
      {
        label: 'Total Downloads',
        value: downloadsTotal,
        tooltip: 'All time',
      },
      {
        label: 'Last Week',
        value: downloads7Days,
        tooltip: 'Past 7 days',
      },
    ];
  }

  // New skills: Show best 2 metrics based on activity
  if (isNewSkill && !isPopular) {
    // If has recent activity, prioritize recent metrics
    if (downloads7Days > 0) {
      return [
        {
          label: 'Total Downloads',
          value: downloadsTotal,
          tooltip: 'All time',
        },
        {
          label: 'Last Week',
          value: downloads7Days,
          tooltip: 'Past 7 days',
        },
      ];
    }

    // If only monthly activity, show total + last month
    if (downloads30Days > 0) {
      return [
        {
          label: 'Total Downloads',
          value: downloadsTotal,
          tooltip: 'All time',
        },
        {
          label: 'Last Month',
          value: downloads30Days,
          tooltip: 'Past 30 days',
        },
      ];
    }

    // New skill with no downloads yet
    return [
      {
        label: 'Total Downloads',
        value: downloadsTotal,
        tooltip: 'All time',
      },
      {
        label: 'Last Month',
        value: downloads30Days,
        tooltip: 'Past 30 days',
      },
    ];
  }

  // Active skills (not popular, not new, but has recent downloads): Last week + total
  if (isActive) {
    return [
      {
        label: 'Last Week',
        value: downloads7Days,
        tooltip: 'Past 7 days',
      },
      {
        label: 'Total Downloads',
        value: downloadsTotal,
        tooltip: 'All time',
      },
    ];
  }

  // Default (moderate activity): Total + Last month
  return [
    {
      label: 'Total Downloads',
      value: downloadsTotal,
      tooltip: 'All time',
    },
    {
      label: 'Last Month',
      value: downloads30Days,
      tooltip: 'Past 30 days',
    },
  ];
}
