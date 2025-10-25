import { useDownloadStats } from '@/hooks/useDownloadStats';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Stats Section Component
 *
 * Displays aggregate download statistics from the AO registry:
 * - Total Skills count
 * - Downloads · Last Week (past 7 days)
 * - Downloads · Last Month (past 30 days)
 *
 * Features:
 * - Loading skeletons during data fetch
 * - Graceful error handling (hides section on error)
 * - Terminal theme styling
 * - Responsive design (stacks on mobile, horizontal on desktop)
 */
export function StatsSection() {
  const { stats, loading, error } = useDownloadStats({ scope: 'all' });

  // Hide section on error (graceful degradation)
  if (error || (!loading && !stats)) {
    return null;
  }

  return (
    <section className="bg-terminal-bg border-t border-terminal-border py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Stats grid - 3 columns on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Skills */}
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard
                label="Total Skills"
                value={stats?.totalSkills ?? 0}
                icon="📦"
              />
            )}

            {/* Downloads · Last Week */}
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard
                label="Downloads · Last Week"
                value={stats?.downloads7Days ?? 0}
                icon="📈"
                subtitle="Past 7 days"
              />
            )}

            {/* Downloads · Last Month */}
            {loading ? (
              <StatCardSkeleton />
            ) : (
              <StatCard
                label="Downloads · Last Month"
                value={stats?.downloads30Days ?? 0}
                icon="📊"
                subtitle="Past 30 days"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  subtitle?: string;
}

function StatCard({ label, value, icon, subtitle }: StatCardProps) {
  return (
    <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 hover:border-syntax-green transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-label={label}>
          {icon}
        </span>
        <div className="flex-1">
          <div className="text-terminal-muted text-sm font-mono mb-1">
            {label}
          </div>
          <div className="text-2xl font-bold font-mono text-terminal-text">
            {value.toLocaleString()}
          </div>
          {subtitle && (
            <div className="text-terminal-muted text-xs font-mono mt-1">
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for stat card during loading
 */
function StatCardSkeleton() {
  return (
    <div className="bg-terminal-card border border-terminal-border rounded-lg p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}
