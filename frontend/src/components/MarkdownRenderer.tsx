/**
 * MarkdownRenderer Component (v2 - Using react-markdown)
 *
 * Professional markdown rendering with:
 * - Syntax highlighting via highlight.js
 * - GitHub Flavored Markdown support
 * - XSS protection via DOMPurify
 * - Terminal dark theme styling
 * - Copy buttons for code blocks
 *
 * @module components/MarkdownRenderer
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css'; // Dark theme for code

interface MarkdownRendererProps {
  /** Markdown content string to render */
  content: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Code block component with copy button and terminal styling
 */
function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const code = String(children).trim();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract language from className (format: language-xxx or hljs language-xxx)
  const extractLanguage = (className?: string): string => {
    if (!className) return 'text';

    // Handle both "language-xxx" and "hljs language-xxx" formats
    const match = className.match(/language-(\w+)/);
    if (match) return match[1];

    // Fallback: remove common prefixes
    return className.replace(/^(hljs|language-)\s*/, '') || 'text';
  };

  const language = extractLanguage(className);

  return (
    <div className="relative group my-6">
      {/* Code block with terminal border and even padding */}
      <pre
        className={cn(
          'relative overflow-x-auto rounded-lg border-2 border-terminal-border bg-terminal-bg px-4 py-3',
          className
        )}
      >
        {/* Language label and copy button - positioned inside with margin */}
        <div className="absolute right-2 top-2 z-10 flex items-center gap-2 mb-2">
          <span className="text-xs text-terminal-muted font-mono bg-terminal-bg/90 backdrop-blur-sm px-2 py-1 rounded border border-terminal-border/50 shadow-sm">
            {language}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-terminal-muted hover:text-syntax-cyan bg-terminal-bg/90 backdrop-blur-sm px-2.5 py-1 rounded border border-terminal-border/50 hover:border-syntax-cyan/50 transition-colors shadow-sm"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-syntax-green" />
                <span className="text-syntax-green">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <code className={cn(className, 'block pt-6')}>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  // Sanitize content before rendering
  const sanitizedContent = React.useMemo(
    () =>
      DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'p',
          'a',
          'img',
          'ul',
          'ol',
          'li',
          'blockquote',
          'code',
          'pre',
          'strong',
          'em',
          'br',
          'hr',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'div',
          'span',
        ],
        ALLOWED_ATTR: [
          'href',
          'src',
          'alt',
          'title',
          'class',
          'id',
          'target',
          'rel',
        ],
      }),
    [content]
  );

  return (
    <div className={cn('markdown-body', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom heading styles with terminal theme and improved spacing
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-terminal-text mb-6 mt-8 first:mt-0 font-mono border-b-2 border-terminal-border pb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold text-terminal-text mb-5 mt-10 first:mt-0 font-mono border-b border-terminal-border pb-2.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold text-terminal-text mb-4 mt-8 first:mt-0 font-mono">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-semibold text-terminal-text mb-3 mt-6 first:mt-0 font-mono">
              {children}
            </h4>
          ),

          // Paragraphs with improved spacing
          p: ({ children }) => (
            <p className="text-terminal-text leading-relaxed mb-5 text-base">
              {children}
            </p>
          ),

          // Links with external icon
          a: ({ href, children }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                className="text-syntax-cyan hover:text-syntax-blue underline decoration-syntax-cyan/30 hover:decoration-syntax-blue transition-colors"
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {children}
                {isExternal && (
                  <span className="inline-block ml-1 text-xs">↗</span>
                )}
              </a>
            );
          },

          // Code blocks with copy button
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const inline = (props as any).inline;
            if (inline) {
              return (
                <code className="bg-terminal-surface text-syntax-cyan px-2 py-0.5 rounded text-[0.9em] font-mono border border-terminal-border/50">
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },

          // Lists with improved spacing
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-6 space-y-2.5 text-terminal-text ml-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-6 space-y-2.5 text-terminal-text ml-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-terminal-text leading-relaxed pl-2">
              {children}
            </li>
          ),

          // Blockquotes with enhanced styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-syntax-purple bg-terminal-surface/50 pl-5 py-3 my-6 italic text-terminal-muted rounded-r">
              {children}
            </blockquote>
          ),

          // Images with caption
          img: ({ src, alt }) => (
            <figure className="my-8">
              <img
                src={src}
                alt={alt || ''}
                className="w-full rounded-lg border-2 border-terminal-border"
                loading="lazy"
              />
              {alt && (
                <figcaption className="text-center text-sm text-terminal-muted mt-3 font-mono">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),

          // Tables with enhanced styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-2 border-terminal-border rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-terminal-surface/70">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-terminal-border px-4 py-3 text-left text-terminal-text font-mono font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-terminal-border px-4 py-3 text-terminal-text">
              {children}
            </td>
          ),

          // Horizontal rule with better spacing
          hr: () => <hr className="border-terminal-border my-10" />,
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
