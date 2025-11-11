import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * 404 Not Found Page
 *
 * Terminal-themed error page with helpful navigation links
 */
export function NotFound() {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleSearchSkills = () => {
    navigate('/search');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-terminal-bg px-4">
      <div className="max-w-2xl w-full text-center">
        {/* ASCII Art Terminal Decoration */}
        <pre className="text-terminal-muted font-mono text-xs mb-8 hidden sm:block">
          {`
┌─────────────────────────────────────┐
│  ERROR: Resource Not Found          │
│  Status Code: 404                   │
│  Location: Unknown                  │
└─────────────────────────────────────┘
          `}
        </pre>

        {/* 404 Heading */}
        <h1 className="text-8xl font-bold font-mono text-syntax-red mb-6">
          404
        </h1>

        {/* Error Message */}
        <h2 className="text-2xl font-mono text-terminal-text mb-4">
          Page not found
        </h2>

        <p className="text-terminal-muted font-mono mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Helpful Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            onClick={handleBackToHome}
            variant="default"
            className="font-mono"
          >
            ← Back to Home
          </Button>

          <Button
            onClick={handleSearchSkills}
            variant="outline"
            className="font-mono"
          >
            Search Skills
          </Button>
        </div>

        {/* Additional Help Link */}
        <div className="text-sm text-terminal-muted font-mono">
          <Link
            to="/"
            className="hover:text-syntax-cyan transition-colors underline"
          >
            Browse Categories
          </Link>
        </div>

        {/* Terminal Command Suggestion */}
        <div className="mt-12 p-4 bg-terminal-surface border border-terminal-border rounded-lg max-w-md mx-auto">
          <p className="text-xs text-terminal-muted font-mono mb-2">
            Terminal Suggestion:
          </p>
          <code className="text-sm text-syntax-green font-mono">
            $ cd / && ls --all-skills
          </code>
        </div>
      </div>
    </div>
  );
}
