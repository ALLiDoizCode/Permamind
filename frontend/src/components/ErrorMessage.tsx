import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Optional dismiss callback */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Error severity */
  variant?: 'error' | 'warning';
}

/**
 * Terminal-themed error message component
 * Displays error with icon, message, and optional retry/dismiss buttons
 */
export function ErrorMessage({
  message,
  onRetry,
  onDismiss,
  className,
  variant = 'error',
}: ErrorMessageProps) {
  const colorClasses =
    variant === 'error'
      ? 'border-syntax-red/30 bg-syntax-red/5'
      : 'border-syntax-yellow/30 bg-syntax-yellow/5';

  const iconColor =
    variant === 'error' ? 'text-syntax-red' : 'text-syntax-yellow';

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-4',
        colorClasses,
        className
      )}
      role="alert"
    >
      {/* Error Icon */}
      <AlertCircle className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColor)} />

      {/* Error Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-terminal-text font-mono">{message}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-1 rounded hover:bg-terminal-surface transition-colors"
            aria-label="Retry"
          >
            <RefreshCw className="h-4 w-4 text-syntax-green hover:text-syntax-blue" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-terminal-surface transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-terminal-muted hover:text-terminal-text" />
          </button>
        )}
      </div>
    </div>
  );
}
