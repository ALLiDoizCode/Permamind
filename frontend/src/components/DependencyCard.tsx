import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export interface DependencyCardProps {
  dependency: {
    name: string;
    version?: string;
    description?: string;
  };
}

export function DependencyCard({ dependency }: DependencyCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/skills/${dependency.name}`);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full border border-terminal-border rounded-lg overflow-hidden hover:border-syntax-blue transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3 p-4 bg-terminal-bg group-hover:bg-terminal-surface/50 transition-colors">
        <span className="text-2xl flex-shrink-0">📦</span>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-start justify-between gap-4 mb-2">
            <code className="text-sm font-medium text-terminal-text font-mono">
              {dependency.name}
            </code>
            <div className="flex items-center gap-2 flex-shrink-0">
              {dependency.version && (
                <Badge variant="cyan" className="text-xs">
                  {dependency.version}
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-terminal-muted leading-relaxed mb-2">
            {dependency.description || 'Skill dependency'}
          </p>
          <div className="text-xs text-syntax-blue group-hover:text-syntax-cyan font-mono transition-colors">
            View skill →
          </div>
        </div>
      </div>
    </button>
  );
}
