import { useNavigate } from 'react-router-dom';
import { navigateToSearchByTag } from '@/lib/navigation';

/**
 * Categories Section Component
 *
 * Displays browseable skill categories with count badges
 * Features:
 * - Responsive layout (scrollable on mobile, grid on desktop)
 * - Click to navigate to filtered search results
 * - Hover effects with scale animation
 * - Terminal-themed styling
 */

interface Category {
  name: string;
  count: number;
  variant: 'blue' | 'green' | 'yellow' | 'purple' | 'cyan';
}

const CATEGORIES: Category[] = [
  { name: 'blockchain', count: 42, variant: 'blue' },
  { name: 'documentation', count: 38, variant: 'green' },
  { name: 'arweave', count: 56, variant: 'yellow' },
  { name: 'ao-protocol', count: 31, variant: 'purple' },
  { name: 'cli-tools', count: 27, variant: 'cyan' },
  { name: 'ai-workflows', count: 19, variant: 'blue' },
];

export function CategoriesSection() {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string) => {
    navigate(navigateToSearchByTag(categoryName));
  };

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-mono text-syntax-purple">
          {'// browse_by_category'}
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-3 lg:grid-cols-6 pb-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className="flex-shrink-0 px-4 py-2 rounded-md border transition-all hover:scale-105 font-mono text-sm whitespace-nowrap bg-terminal-surface border-terminal-border hover:border-syntax-cyan"
          >
            <span className="text-terminal-text">{category.name}</span>
            <span className="text-terminal-muted ml-2">({category.count})</span>
          </button>
        ))}
      </div>
    </section>
  );
}
