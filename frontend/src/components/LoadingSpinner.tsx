import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Spinner size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Optional text label */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Center spinner in container */
  centered?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * Terminal-themed loading spinner with rotating animation
 * Uses blue syntax color matching terminal theme
 */
export function LoadingSpinner({
  size = 'md',
  label,
  className,
  centered = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <Loader2
        className={cn(sizeClasses[size], 'animate-spin text-syntax-blue')}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm font-mono text-terminal-muted">{label}</span>
      )}
    </div>
  );

  if (centered) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        {spinner}
      </div>
    );
  }

  return spinner;
}
