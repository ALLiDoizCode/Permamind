import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-terminal-border bg-terminal-surface px-3 py-2 text-sm font-mono text-terminal-text ring-offset-terminal-bg file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-terminal-text placeholder:text-terminal-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syntax-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
