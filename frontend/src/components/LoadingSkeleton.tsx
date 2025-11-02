import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  /** Skeleton variant to match different layouts */
  variant?: 'skill-card' | 'skill-detail' | 'default';
}

/**
 * Shimmer loading skeleton with terminal theme colors
 * - variant="skill-card": Matches SkillCard dimensions
 * - variant="skill-detail": Matches SkillDetail page layout
 * - variant="default": Simple rectangular shimmer
 */
export function LoadingSkeleton({
  className,
  variant = 'default',
}: LoadingSkeletonProps) {
  const baseClasses =
    'animate-shimmer bg-gradient-to-r from-terminal-surface via-syntax-blue/10 to-terminal-surface bg-[length:200%_100%] rounded-md';

  if (variant === 'skill-detail') {
    return (
      <div className={cn('container mx-auto px-4 py-8 max-w-6xl', className)}>
        {/* Breadcrumbs skeleton */}
        <div className="flex gap-2 mb-6">
          <div className={cn(baseClasses, 'h-5 w-12')} />
          <span className="text-terminal-muted/50">/</span>
          <div className={cn(baseClasses, 'h-5 w-16')} />
          <span className="text-terminal-muted/50">/</span>
          <div className={cn(baseClasses, 'h-5 w-20')} />
        </div>

        {/* Header skeleton */}
        <div className="mb-8 space-y-4">
          {/* Title */}
          <div className={cn(baseClasses, 'h-10 w-2/3')} />

          {/* Badges */}
          <div className="flex gap-2">
            <div className={cn(baseClasses, 'h-6 w-16')} />
            <div className={cn(baseClasses, 'h-6 w-20')} />
            <div className={cn(baseClasses, 'h-6 w-24')} />
          </div>

          {/* Author */}
          <div className={cn(baseClasses, 'h-5 w-32')} />
        </div>

        {/* Tabs skeleton */}
        <div className="space-y-6">
          <div className="flex gap-6 border-b border-terminal-border pb-3">
            <div className={cn(baseClasses, 'h-8 w-24')} />
            <div className={cn(baseClasses, 'h-8 w-32')} />
            <div className={cn(baseClasses, 'h-8 w-24')} />
          </div>

          {/* Content skeleton */}
          <div className="space-y-6">
            {/* Quick Install */}
            <div className={cn(baseClasses, 'h-32 w-full')} />

            {/* Description */}
            <div className="space-y-2">
              <div className={cn(baseClasses, 'h-6 w-32')} />
              <div className={cn(baseClasses, 'h-4 w-full')} />
              <div className={cn(baseClasses, 'h-4 w-full')} />
              <div className={cn(baseClasses, 'h-4 w-3/4')} />
            </div>

            {/* When to Use */}
            <div className="space-y-2">
              <div className={cn(baseClasses, 'h-6 w-48')} />
              <div className={cn(baseClasses, 'h-4 w-full')} />
              <div className={cn(baseClasses, 'h-4 w-5/6')} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'skill-card') {
    return (
      <div
        className={cn(
          'bg-terminal-surface border border-terminal-border rounded-lg p-6 space-y-4',
          className
        )}
      >
        {/* Version + Category badges */}
        <div className="flex gap-2">
          <div className={cn(baseClasses, 'h-5 w-16')} />
          <div className={cn(baseClasses, 'h-5 w-20')} />
        </div>

        {/* Title */}
        <div className={cn(baseClasses, 'h-7 w-3/4')} />

        {/* Description lines */}
        <div className="space-y-2">
          <div className={cn(baseClasses, 'h-4 w-full')} />
          <div className={cn(baseClasses, 'h-4 w-full')} />
          <div className={cn(baseClasses, 'h-4 w-2/3')} />
        </div>

        {/* Author */}
        <div className={cn(baseClasses, 'h-4 w-32')} />

        {/* Download count */}
        <div className={cn(baseClasses, 'h-4 w-24 ml-auto')} />
      </div>
    );
  }

  return <div className={cn(baseClasses, 'h-32 w-full', className)} />;
}
