import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium font-mono w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'bg-terminal-surface text-terminal-text border-terminal-border',
        blue: 'bg-syntax-blue/10 text-syntax-blue border-syntax-blue/30',
        green: 'bg-syntax-green/10 text-syntax-green border-syntax-green/30',
        yellow:
          'bg-syntax-yellow/10 text-syntax-yellow border-syntax-yellow/30',
        purple:
          'bg-syntax-purple/10 text-syntax-purple border-syntax-purple/30',
        cyan: 'bg-syntax-cyan/10 text-syntax-cyan border-syntax-cyan/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
