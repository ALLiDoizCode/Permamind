import * as React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Simple XSS prevention - only allow safe HTML tags
function sanitizeHtml(html: string): string {
  // Remove script tags and other dangerous elements
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
}

function renderMarkdown(content: string): string {
  let html = content;

  // Headers (must come before paragraphs)
  html = html.replace(
    /^### (.+)$/gm,
    '<h3 class="text-lg font-semibold text-terminal-text mb-2 mt-4">$1</h3>'
  );
  html = html.replace(
    /^## (.+)$/gm,
    '<h2 class="text-xl font-semibold text-terminal-text mb-3 mt-6">$1</h2>'
  );
  html = html.replace(
    /^# (.+)$/gm,
    '<h1 class="text-2xl font-bold text-terminal-text mb-4 mt-8">$1</h1>'
  );

  // Bold
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-terminal-text">$1</strong>'
  );

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-terminal-bg border border-terminal-border px-1.5 py-0.5 rounded text-syntax-cyan font-mono text-sm">$1</code>'
  );

  // Paragraphs (split by double newline)
  const blocks = html.split('\n\n');
  html = blocks
    .map((block) => {
      // Don't wrap if already has HTML tags
      if (block.trim().startsWith('<')) {
        return block;
      }
      return `<p class="text-terminal-muted leading-relaxed mb-4">${block.trim()}</p>`;
    })
    .join('\n');

  return sanitizeHtml(html);
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const html = React.useMemo(() => renderMarkdown(content), [content]);

  return (
    <div
      className={cn('markdown-content', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
