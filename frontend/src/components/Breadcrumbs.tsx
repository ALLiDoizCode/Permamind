import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  path: Array<string | BreadcrumbItem>;
  className?: string;
}

export function Breadcrumbs({ path, className }: BreadcrumbsProps) {
  // Ensure home is always first
  const items: BreadcrumbItem[] = [
    { label: 'home', href: '/' },
    ...path.map((item) => (typeof item === 'string' ? { label: item } : item)),
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm font-mono', className)}
    >
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              {isLast ? (
                <span className="text-terminal-text" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="text-terminal-muted hover:text-syntax-blue transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-terminal-muted">{item.label}</span>
                  )}
                  <span className="text-terminal-muted/50">/</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
