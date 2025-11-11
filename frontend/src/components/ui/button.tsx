import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-syntax-blue",
  {
    variants: {
      variant: {
        default:
          'bg-syntax-blue text-terminal-bg hover:bg-[#5299d9] border border-syntax-blue',
        outline:
          'border border-terminal-border text-terminal-text hover:bg-terminal-surface hover:border-syntax-blue',
        ghost:
          'text-terminal-muted hover:text-terminal-text hover:bg-terminal-surface',
        destructive:
          'bg-syntax-red text-terminal-bg hover:bg-[#d65a66] border border-syntax-red',
        secondary:
          'bg-terminal-surface text-terminal-text hover:bg-terminal-border border border-terminal-border',
        command:
          'bg-terminal-surface text-syntax-green hover:bg-[#1e252e] border border-terminal-border font-mono',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
