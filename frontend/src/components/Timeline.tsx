import { Badge } from '@/components/ui/badge';

export interface TimelineVersion {
  version: string;
  date: string; // Formatted date string (e.g., "Jan 15, 2025")
  txid?: string; // Arweave transaction ID (optional - may not be available from registry)
  status: 'latest' | ''; // Empty string for non-latest versions
  size: string; // Display size (e.g., "12 KB")
  changelog: string; // Changelog text or placeholder
}

export interface TimelineProps {
  versions: TimelineVersion[];
  skillName: string;
}

export function Timeline({ versions, skillName }: TimelineProps) {
  const handleInstall = async (version: string) => {
    try {
      await navigator.clipboard.writeText(
        `agent-skills install ${skillName}@${version}`
      );
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleViewArweave = (txid: string) => {
    window.open(`https://arweave.net/${txid}`, '_blank');
  };

  return (
    <div className="space-y-0">
      {versions.map((ver, index) => (
        <div key={ver.version} className="flex gap-4">
          {/* Timeline Dot Column */}
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                ver.status === 'latest'
                  ? 'bg-syntax-green ring-4 ring-syntax-green/20'
                  : 'bg-syntax-blue'
              }`}
            />
            {index < versions.length - 1 && (
              <div className="w-0.5 flex-1 bg-terminal-border min-h-[80px]" />
            )}
          </div>

          {/* Version Content Column */}
          <div
            className={`flex-1 ${index < versions.length - 1 ? 'pb-6' : ''}`}
          >
            {/* Version Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <code className="text-lg font-bold text-syntax-cyan font-mono">
                {ver.version}
              </code>
              {ver.status === 'latest' && (
                <Badge variant="green" className="text-xs">
                  Latest
                </Badge>
              )}
              <span className="text-xs text-terminal-muted">{ver.date}</span>
              <Badge variant="cyan" className="text-xs">
                {ver.size}
              </Badge>
            </div>

            {/* Changelog Bullets */}
            <div className="text-sm text-terminal-muted space-y-1 mb-3">
              {ver.changelog
                .split('. ')
                .filter((c) => c.trim())
                .map((change, i) => {
                  const trimmed = change.trim();
                  const formatted = trimmed.endsWith('.')
                    ? trimmed
                    : `${trimmed}.`;
                  return (
                    <div key={`${ver.version}-changelog-${i}`}>
                      • {formatted}
                    </div>
                  );
                })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <button
                onClick={() => handleInstall(ver.version)}
                className="text-syntax-blue hover:text-syntax-cyan font-mono transition-colors"
                aria-label={`Install version ${ver.version}`}
              >
                $ install
              </button>
              {ver.txid && (
                <>
                  <span className="text-terminal-muted/40">|</span>
                  <button
                    onClick={() => handleViewArweave(ver.txid || '')}
                    className="text-terminal-muted hover:text-terminal-text font-mono transition-colors"
                    aria-label={`View version ${ver.version} on Arweave`}
                  >
                    view on arweave ↗
                  </button>
                  <span className="text-terminal-muted/40">|</span>
                  <code className="text-terminal-muted/60 font-mono">
                    {ver.txid.substring(0, 7)}
                  </code>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
