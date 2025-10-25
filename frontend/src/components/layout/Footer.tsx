import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function Footer() {
  return (
    <footer className="bg-terminal-surface border-t border-terminal-border mt-20 py-8">
      <div className="container mx-auto px-4">
        {/* Arweave Badge */}
        <div className="text-center mb-6">
          <Badge variant="blue" className="text-sm px-4 py-2">
            ⛁ Powered by Arweave & AO
          </Badge>
        </div>

        {/* Footer Navigation Links */}
        <div className="flex justify-center gap-8 text-sm font-mono">
          <Link
            to="/docs"
            className="text-terminal-muted hover:text-syntax-blue transition-colors"
          >
            documentation
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terminal-muted hover:text-syntax-blue transition-colors"
          >
            github
          </a>
          <Link
            to="/cli-guide"
            className="text-terminal-muted hover:text-syntax-blue transition-colors"
          >
            cli-guide
          </Link>
          <Link
            to="/publish"
            className="text-terminal-muted hover:text-syntax-blue transition-colors"
          >
            publish-skill
          </Link>
        </div>

        {/* Community Attribution */}
        <div className="text-center mt-6 text-xs text-terminal-muted font-mono">
          <span className="text-syntax-purple">// </span>
          Built with ❤️ by the community
        </div>
      </div>
    </footer>
  );
}
