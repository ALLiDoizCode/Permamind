import { Badge } from '@/components/ui/badge';
import type { BundledFile } from '@/types/ao';

interface FileCardProps {
  file: BundledFile;
  onClick: () => void;
}

export function FileCard({ file, onClick }: FileCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full border border-terminal-border rounded-lg overflow-hidden hover:border-syntax-blue transition-all cursor-pointer group"
    >
      <div className="flex items-start gap-3 p-4 bg-terminal-bg group-hover:bg-terminal-surface/50 transition-colors">
        <span className="text-2xl flex-shrink-0">{file.icon}</span>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-start justify-between gap-4 mb-2">
            <code className="text-sm font-medium text-terminal-text font-mono">
              {file.name}
            </code>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant={file.level === 'Level 2' ? 'green' : 'purple'}
                className="text-xs"
              >
                {file.level}
              </Badge>
              <Badge variant="cyan" className="text-xs">
                {file.size}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-terminal-muted leading-relaxed mb-2">
            {file.description}
          </p>
          <div className="text-xs text-syntax-blue group-hover:text-syntax-cyan font-mono transition-colors">
            Click to preview →
          </div>
        </div>
      </div>
    </button>
  );
}
