import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-terminal-bg/95 backdrop-blur-sm border-b border-terminal-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Terminal Branding - $ permamind_ */}
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-syntax-green font-mono font-bold text-xl">
              $
            </span>
            <span className="font-mono font-bold text-terminal-text">
              permamind
            </span>
            <span className="cursor-blink text-syntax-blue">_</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/docs"
              className="text-sm text-terminal-muted hover:text-terminal-text font-mono transition-colors"
            >
              docs
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-terminal-muted hover:text-terminal-text font-mono transition-colors"
            >
              github
            </a>

            <Button variant="command" size="sm" asChild>
              <Link to="/cli-guide">
                <span className="text-syntax-green">$</span>&nbsp;install cli
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
