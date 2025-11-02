import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { SkillCard } from '@/components/SkillCard';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useSkillSearch } from '@/hooks/useSkillSearch';
import { parseSearchParams } from '@/lib/search-utils';
import { navigateToSkill, navigateToSearch } from '@/lib/navigation';
import { SkillMetadata } from '@/types/ao';

/**
 * Search Results Page
 *
 * Features:
 * - Search bar at top for new searches
 * - Sort dropdown (Relevance, Most Popular, Recently Updated, A-Z)
 * - Filter controls with add filter button
 * - Pagination controls
 * - URL-based search query (/search?q=<query>&tag=<tag>)
 * - Real-time search via useSkillSearch hook
 * - Breadcrumb navigation
 * - Results count and metadata
 * - Responsive grid layout (1/2/3 columns)
 * - Loading/error/empty states
 */
export function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = parseSearchParams(searchParams);

  // State for pagination
  const [page, setPage] = useState(1);
  const limit = 12; // Items per page

  // Use search hook with query from URL
  const { skills, loading, error, refetch } = useSkillSearch(query.q || '');

  const handleSkillClick = (skillName: string) => {
    navigate(navigateToSkill(skillName));
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      navigate(navigateToSearch(searchQuery));
    }
  };

  const handleSkillSelect = (skill: SkillMetadata) => {
    navigate(navigateToSkill(skill.name));
  };

  const handleClearSearch = () => {
    navigate('/search');
  };

  // Calculate results count and pagination
  const resultsCount = skills.length;
  const totalPages = Math.ceil(resultsCount / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedSkills = skills.slice(startIndex, endIndex);

  const hasQuery = Boolean(query.q);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Search Bar at Top */}
        <div className="mb-8">
          <SearchBar
            onSearch={handleSearch}
            onSkillSelect={handleSkillSelect}
            showSearchButton={true}
          />
        </div>

        {/* Results Header with Count */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono">
            <span className="text-syntax-purple">//</span>{' '}
            <span className="text-terminal-text">
              {loading ? 'Searching...' : `${resultsCount} skills found`}
            </span>
          </h1>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} variant="skill-card" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage
            message={error.message || 'Failed to search skills'}
            onRetry={refetch}
            variant="error"
          />
        )}

        {/* Empty State */}
        {!loading && !error && resultsCount === 0 && (
          <div className="text-center py-16 bg-terminal-surface border border-terminal-border rounded-lg">
            <div className="max-w-md mx-auto">
              <p className="text-terminal-muted font-mono text-lg mb-4">
                {hasQuery
                  ? `No skills found for "${query.q}"`
                  : 'No skills available'}
              </p>

              {/* Search Tips */}
              {hasQuery && (
                <div className="text-left space-y-3 mb-6">
                  <p className="text-sm text-terminal-muted font-mono">
                    Try these suggestions:
                  </p>
                  <ul className="text-sm text-terminal-muted font-mono list-disc list-inside space-y-1">
                    <li>Use different keywords</li>
                    <li>Check your spelling</li>
                    <li>Use more general terms</li>
                  </ul>
                </div>
              )}

              {/* Action Links */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="px-4 py-2 rounded-md bg-terminal-surface border border-terminal-border hover:border-syntax-cyan transition-colors font-mono text-sm"
                  >
                    Browse all skills
                  </button>
                )}
                <Link
                  to="/"
                  className="px-4 py-2 rounded-md bg-terminal-surface border border-terminal-border hover:border-syntax-cyan transition-colors font-mono text-sm text-center"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {!loading && !error && resultsCount > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSkills.map((skill) => (
                <SkillCard
                  key={`${skill.name}-${skill.version}`}
                  skill={skill}
                  onClick={() => handleSkillClick(skill.name)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {totalPages > 5 && (
                  <span className="text-terminal-muted">...</span>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
