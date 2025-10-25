import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/CopyButton';
import type { BundledFile } from '@/types/ao';

interface FilePreviewModalProps {
  file: BundledFile | null;
  onClose: () => void;
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  useEffect(() => {
    if (!file) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleBodyScroll = () => {
      document.body.style.overflow = 'hidden';
    };

    handleBodyScroll();
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [file, onClose]);

  if (!file) return null;

  const renderMarkdown = (content: string): string => {
    let html = content;
    html = html.replace(
      /^### (.*$)/gim,
      '<h4 class="text-base font-semibold text-terminal-text font-mono mt-6 mb-3">$1</h4>'
    );
    html = html.replace(
      /^## (.*$)/gim,
      '<h3 class="text-xl font-semibold text-terminal-text font-mono mt-8 mb-4">$1</h3>'
    );
    html = html.replace(
      /^# (.*$)/gim,
      '<h2 class="text-2xl font-bold text-syntax-cyan font-mono mb-6">$1</h2>'
    );
    html = html.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="code-block my-4"><code class="text-sm text-terminal-muted">$2</code></pre>'
    );
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-terminal-bg border border-terminal-border rounded px-2 py-0.5 text-syntax-cyan font-mono text-sm">$1</code>'
    );
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-terminal-text font-semibold">$1</strong>'
    );
    html = html.replace(
      /^- (.*$)/gim,
      '<li class="ml-6 text-terminal-muted">• $1</li>'
    );
    html = html
      .split('\n\n')
      .map((p) =>
        p.trim()
          ? `<p class="text-terminal-muted leading-relaxed mb-4">${p}</p>`
          : ''
      )
      .join('');
    return html;
  };

  const renderPython = (content: string): string => {
    return content
      .split('\n')
      .map((line) => {
        if (line.trim().startsWith('#')) {
          return `<div class="text-syntax-green">${line}</div>`;
        } else if (
          line.includes('def ') ||
          line.includes('import ') ||
          line.includes('from ')
        ) {
          return `<div class="text-syntax-purple">${line}</div>`;
        } else if (line.includes('"') || line.includes("'")) {
          const parts = line.split(/(['"].*?['"])/g);
          return (
            '<div>' +
            parts
              .map((p) =>
                p.match(/^['"].*['"]$/)
                  ? `<span class="text-syntax-yellow">${p}</span>`
                  : `<span class="text-terminal-text">${p}</span>`
              )
              .join('') +
            '</div>'
          );
        }
        return `<div class="text-terminal-text">${line}</div>`;
      })
      .join('');
  };

  const getPreviewContent = () => {
    if (file.type === 'markdown') {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(file.preview) }}
          className="prose prose-invert max-w-none"
        />
      );
    } else if (file.type === 'python') {
      return (
        <pre className="code-block">
          <code
            className="text-sm"
            dangerouslySetInnerHTML={{ __html: renderPython(file.preview) }}
          />
        </pre>
      );
    }
    return (
      <pre className="code-block">
        <code className="text-sm text-terminal-muted">{file.preview}</code>
      </pre>
    );
  };

  const handleDownload = () => {
    const blob = new Blob([file.preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-terminal-bg/95 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-terminal-surface border border-terminal-border rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-terminal-border bg-terminal-bg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">{file.icon}</span>
            <div className="flex-1 min-w-0">
              <code className="text-base font-medium text-terminal-text font-mono block truncate">
                {file.name}
              </code>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={file.level === 'Level 2' ? 'green' : 'purple'}
                  className="text-xs"
                >
                  {file.level}
                </Badge>
                <Badge variant="cyan" className="text-xs">
                  {file.size}
                </Badge>
                <span className="text-xs text-terminal-muted">{file.type}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface rounded transition-colors"
            aria-label="Close preview"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{getPreviewContent()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-terminal-border bg-terminal-bg">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 text-xs font-mono bg-terminal-surface border border-terminal-border rounded text-terminal-muted">
              ESC
            </kbd>
            <span className="text-xs text-terminal-muted">to close</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </Button>
            <CopyButton text={file.preview} />
          </div>
        </div>
      </div>
    </div>
  );
}
