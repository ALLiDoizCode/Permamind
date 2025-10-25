import { useNavigate } from 'react-router-dom';
import { SkillCard } from '@/components/SkillCard';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useSkillList } from '@/hooks/useSkillList';
import { navigateToAllSkills, navigateToSkill } from '@/lib/navigation';

/**
 * Featured Skills Section Component
 *
 * Displays top 6 featured skills from the AO registry
 * Features:
 * - Loading state with 6 skeleton loaders
 * - Error state with retry button
 * - Empty state with helpful message
 * - Grid layout (1/2/3 columns responsive)
 * - "view all →" link to search page
 */
export function FeaturedSkillsSection() {
  const navigate = useNavigate();

  const {
    data: featuredSkillsData,
    loading: featuredLoading,
    error: featuredError,
    refetch: refetchFeatured,
  } = useSkillList({
    limit: 6,
    offset: 0,
  });

  const handleSkillClick = (skillName: string) => {
    navigate(navigateToSkill(skillName));
  };

  const handleViewAll = () => {
    navigate(navigateToAllSkills());
  };

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-mono text-syntax-purple">
          {'// featured_skills'}
        </h2>
        <button
          onClick={handleViewAll}
          className="text-syntax-cyan hover:text-syntax-blue transition-colors font-mono text-sm cursor-pointer"
        >
          view all →
        </button>
      </div>

      {/* Loading State - Show 6 skeletons */}
      {featuredLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="skill-card" />
          ))}
        </div>
      )}

      {/* Error State */}
      {featuredError && !featuredLoading && (
        <ErrorMessage
          message={
            featuredError.message ||
            'Failed to load featured skills from AO registry'
          }
          onRetry={refetchFeatured}
          variant="error"
        />
      )}

      {/* Empty State */}
      {!featuredLoading &&
        !featuredError &&
        (!featuredSkillsData || featuredSkillsData.skills.length === 0) && (
          <div className="text-center py-12 bg-terminal-surface border border-terminal-border rounded-lg">
            <p className="text-terminal-muted font-mono mb-2">
              No featured skills available
            </p>
            <p className="text-sm text-terminal-muted">
              Try using the search bar above to find skills
            </p>
          </div>
        )}

      {/* Success State - Display skills */}
      {!featuredLoading &&
        !featuredError &&
        featuredSkillsData &&
        featuredSkillsData.skills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredSkillsData.skills.map((skill) => (
              <SkillCard
                key={`${skill.name}-${skill.version}`}
                skill={skill}
                onClick={() => handleSkillClick(skill.name)}
              />
            ))}
          </div>
        )}
    </section>
  );
}
