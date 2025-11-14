/**
 * MarkdownRenderer Component
 *
 * Renders markdown content with rich media support and XSS protection.
 * Supports headers, paragraphs, bold, inline code, links, images, videos,
 * lists, blockquotes, and fenced code blocks with syntax highlighting.
 *
 * @module components/MarkdownRenderer
 *
 * @example Basic Usage
 * ```tsx
 * import { MarkdownRenderer } from '@/components/MarkdownRenderer';
 *
 * function MyComponent() {
 *   const content = '# Hello World\n\nThis is **markdown** with `code`.';
 *   return <MarkdownRenderer content={content} />;
 * }
 * ```
 *
 * @example Links
 * ```markdown
 * [External Link](https://example.com) - Opens in new tab with icon
 * [Internal Link](/about) - Opens in same tab
 * ```
 *
 * @example Images
 * ```markdown
 * ![Alt text](https://example.com/image.jpg)
 * ```
 * - Renders with lazy loading
 * - Displays caption with alt text
 * - Responsive sizing with terminal-themed border
 *
 * @example Videos
 * ```markdown
 * ![Video](https://youtube.com/watch?v=VIDEO_ID)
 * ![Video](https://vimeo.com/VIDEO_ID)
 * ```
 * - YouTube and Vimeo URLs convert to responsive iframe embeds
 * - 16:9 aspect ratio maintained
 * - Other video platforms not supported
 *
 * @example Lists
 * ```markdown
 * Unordered:
 * - Item one
 * - Item two
 * - Item three
 *
 * Ordered:
 * 1. First item
 * 2. Second item
 * 3. Third item
 * ```
 * - Lists support inline formatting (bold, code, links)
 *
 * @example Blockquotes
 * ```markdown
 * > This is a blockquote
 * > with multiple lines
 * ```
 * - Styled with terminal-themed left border and background
 * - Supports inline formatting
 *
 * @example Code Blocks
 * ```markdown
 * \`\`\`javascript
 * const hello = "world";
 * console.log(hello);
 * \`\`\`
 * ```
 * - Fenced code blocks with optional language identifier
 * - Copy button in top-right corner
 * - Language label displayed
 * - Supports: javascript, typescript, bash, lua, python, json, and more
 *
 * @security XSS Protection
 * - All HTML is sanitized with DOMPurify before rendering
 * - Allowed tags: a, img, h1-h3, p, strong, em, code, pre, ul, ol, li, blockquote, iframe, div, span, figure, figcaption, svg
 * - Iframe embeds restricted to YouTube and Vimeo domains only
 * - JavaScript URLs (javascript:) are blocked
 * - Event handlers (onclick, etc.) are stripped
 * - Script tags are removed
 *
 * @performance
 * - Markdown parsing memoized with React.useMemo
 * - Images lazy-loaded with loading="lazy" attribute
 * - Color transitions optimized with transition-colors
 * - Code block placeholders prevent inner markdown processing
 */
import * as React from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

/**
 * Props for the MarkdownRenderer component
 */
interface MarkdownRendererProps {
  /** Markdown content string to render */
  content: string;
  /** Optional additional CSS classes to apply to the container */
  className?: string;
}

// DOMPurify configuration for XSS protection
const ALLOWED_TAGS = [
  'a',
  'img',
  'h1',
  'h2',
  'h3',
  'p',
  'strong',
  'em',
  'code',
  'pre',
  'ul',
  'ol',
  'li',
  'blockquote',
  'iframe',
  'div',
  'span',
  'figure',
  'figcaption',
  'svg',
  'path',
  'button',
  'polyline',
  'rect',
];

const ALLOWED_ATTR = [
  'href',
  'src',
  'alt',
  'title',
  'class',
  'target',
  'rel',
  'width',
  'height',
  'loading',
  'style',
  'frameborder',
  'allow',
  'allowfullscreen',
  'viewBox',
  'xmlns',
  'fill',
  'stroke',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-width',
  'd',
  'data-copy-code',
  'aria-label',
  'id',
  'points',
  'x',
  'y',
  'rx',
  'ry',
];

// Allow YouTube and Vimeo iframe embeds
const ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

const ALLOWED_IFRAME_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'player.vimeo.com',
  'vimeo.com',
];

function sanitizeHtml(html: string): string {
  // Add hook to filter iframe sources
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Filter iframe sources to only allow whitelisted domains
    if (node.tagName === 'IFRAME') {
      const src = node.getAttribute('src');
      if (src) {
        const isAllowed = ALLOWED_IFRAME_DOMAINS.some((domain) =>
          src.includes(domain)
        );
        if (!isAllowed) {
          node.removeAttribute('src');
        }
      }
    }

    // Remove javascript: from style attributes
    if (node.hasAttribute('style')) {
      const style = node.getAttribute('style') || '';
      if (style.toLowerCase().includes('javascript:')) {
        node.removeAttribute('style');
      }
    }
  });

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
  });

  // Remove hook to prevent accumulation
  DOMPurify.removeHook('afterSanitizeAttributes');

  return sanitized;
}

function renderMarkdown(content: string): string {
  let html = content;

  // Step 1: Parse code blocks FIRST and store in placeholders (prevent inner markdown processing)
  const codeBlockPlaceholders = new Map<string, string>();
  let placeholderCounter = 0;

  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, language, code) => {
    const escapedCode = code.trim();
    const langLabel = language || 'text';
    const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
    const placeholder = `__CODE_BLOCK_${placeholderCounter++}__`;

    const codeBlockHtml = `<div class="relative my-4">
      <pre class="bg-terminal-bg border border-terminal-border rounded-lg p-4 overflow-x-auto">
        ${language ? `<span class="absolute top-2 right-12 text-xs text-terminal-muted bg-terminal-surface px-2 py-1 rounded">${langLabel}</span>` : ''}
        <button
          data-copy-code="${codeId}"
          class="absolute top-2 right-2 rounded-md p-2 text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface transition-colors cursor-pointer"
          aria-label="Copy to clipboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
        <code id="${codeId}" class="text-syntax-cyan font-mono text-sm">${escapedCode}</code>
      </pre>
    </div>`;

    codeBlockPlaceholders.set(placeholder, codeBlockHtml);
    return placeholder;
  });

  // Step 2: Parse images/videos (before links to handle ![video](url))
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) => {
    // Check for YouTube video
    const youtubeMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return `<div class="aspect-video my-4">
        <iframe
          src="https://www.youtube.com/embed/${videoId}"
          width="100%"
          height="100%"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="rounded-lg"
        ></iframe>
      </div>`;
    }

    // Check for Vimeo video
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      const videoId = vimeoMatch[1];
      return `<div class="aspect-video my-4">
        <iframe
          src="https://player.vimeo.com/video/${videoId}"
          width="100%"
          height="100%"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          class="rounded-lg"
        ></iframe>
      </div>`;
    }

    // Regular image
    return `<figure class="my-4">
      <img
        src="${url}"
        alt="${alt}"
        loading="lazy"
        class="max-w-full h-auto mx-auto border border-terminal-border rounded-lg"
      />
      ${alt ? `<figcaption class="text-terminal-muted text-sm text-center mt-2">${alt}</figcaption>` : ''}
    </figure>`;
  });

  // Step 3: Parse blockquotes (before lists and paragraphs)
  html = html.replace(
    /(?:^|\n)((?:>\s+.+(?:\n|$))+)/gm,
    (_match, quoteBlock) => {
      const quoteContent = quoteBlock
        .trim()
        .split('\n')
        .map((line: string) => {
          const quoteMatch = line.match(/^>\s+(.+)$/);
          return quoteMatch ? quoteMatch[1] : '';
        })
        .filter(Boolean)
        .join(' ');
      return `<blockquote class="border-l-4 border-syntax-cyan bg-terminal-surface pl-4 py-2 my-4 italic text-terminal-muted">${quoteContent}</blockquote>`;
    }
  );

  // Step 4: Parse lists (before paragraphs to prevent wrapping)
  // Process unordered lists
  html = html.replace(
    /(?:^|\n)((?:[-*]\s+.+(?:\n|$))+)/gm,
    (_match, listBlock) => {
      const items = listBlock
        .trim()
        .split('\n')
        .map((line: string) => {
          const itemMatch = line.match(/^[-*]\s+(.+)$/);
          if (itemMatch) {
            return `<li>${itemMatch[1]}</li>`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
      return `<ul class="ml-6 space-y-2 text-terminal-muted list-disc my-4">\n${items}\n</ul>`;
    }
  );

  // Process ordered lists
  html = html.replace(
    /(?:^|\n)((?:\d+\.\s+.+(?:\n|$))+)/gm,
    (_match, listBlock) => {
      const items = listBlock
        .trim()
        .split('\n')
        .map((line: string) => {
          const itemMatch = line.match(/^\d+\.\s+(.+)$/);
          if (itemMatch) {
            return `<li>${itemMatch[1]}</li>`;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
      return `<ol class="ml-6 space-y-2 text-terminal-muted list-decimal my-4">\n${items}\n</ol>`;
    }
  );

  // Step 5: Parse headers (before inline elements)
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

  // Step 6: Parse inline elements (bold, inline code, links)
  // Bold
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong class="font-semibold text-terminal-text">$1</strong>'
  );

  // Inline code (must come before links to avoid conflicts)
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-terminal-bg border border-terminal-border px-1.5 py-0.5 rounded text-syntax-cyan font-mono text-sm">$1</code>'
  );

  // Links (after images, after inline code)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    const isInternal = url.startsWith('/') || url.startsWith('#');
    const externalAttrs = isInternal
      ? ''
      : ' target="_blank" rel="noopener noreferrer"';
    const externalIcon = isInternal
      ? ''
      : '<svg class="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>';

    return `<a href="${url}" class="text-syntax-cyan hover:text-syntax-purple transition-colors underline"${externalAttrs}>${text}${externalIcon}</a>`;
  });

  // Step 7: Parse paragraphs (for remaining text)
  const blocks = html.split('\n\n');
  html = blocks
    .map((block) => {
      // Don't wrap if already has HTML tags or is a placeholder
      if (
        block.trim().startsWith('<') ||
        block.trim().startsWith('__CODE_BLOCK_')
      ) {
        return block;
      }
      return `<p class="text-terminal-muted leading-relaxed mb-4">${block.trim()}</p>`;
    })
    .join('\n');

  // Step 8: Restore code block placeholders
  codeBlockPlaceholders.forEach((codeBlockHtml, placeholder) => {
    html = html.replace(placeholder, codeBlockHtml);
  });

  // Step 9: Sanitize with DOMPurify
  return sanitizeHtml(html);
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  const html = React.useMemo(() => renderMarkdown(content), [content]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const handleCopyClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('[data-copy-code]') as HTMLButtonElement;

      if (!button) return;

      const codeId = button.getAttribute('data-copy-code');
      const codeElement = document.getElementById(codeId || '');

      if (!codeElement) return;

      try {
        await navigator.clipboard.writeText(codeElement.textContent || '');

        // Show checkmark icon
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-syntax-green">
          <polyline points="20 6 9 17 4 12" />
        </svg>`;

        // Reset after 2 seconds
        setTimeout(() => {
          button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2 2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>`;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
      }
    };

    const container = containerRef.current;
    container.addEventListener('click', handleCopyClick);

    return () => {
      container.removeEventListener('click', handleCopyClick);
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={cn('markdown-content', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
