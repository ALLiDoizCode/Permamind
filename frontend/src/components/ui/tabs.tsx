import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center font-mono', {
  variants: {
    variant: {
      default:
        'rounded-md bg-terminal-surface p-1 border border-terminal-border',
      cli: 'gap-6 border-b border-terminal-border pb-3',
      underline: 'gap-6 border-b border-terminal-border',
      window: 'gap-2 border-b-2 border-syntax-blue/20',
      pills: 'gap-2 rounded-lg bg-terminal-surface p-1',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium font-mono ring-offset-terminal-bg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syntax-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'rounded-sm data-[state=active]:bg-terminal-bg data-[state=active]:text-terminal-text data-[state=active]:shadow-sm data-[state=inactive]:text-terminal-muted data-[state=inactive]:hover:text-terminal-text',
        cli: 'data-[state=active]:text-syntax-green data-[state=active]:border-b-2 data-[state=active]:border-syntax-green data-[state=inactive]:text-terminal-muted data-[state=inactive]:hover:text-terminal-text data-[state=inactive]:hover:border-b-2 data-[state=inactive]:hover:border-terminal-border pb-2',
        underline:
          'data-[state=active]:text-terminal-text data-[state=active]:border-b-2 data-[state=active]:border-gradient-start data-[state=inactive]:text-terminal-muted data-[state=inactive]:hover:text-terminal-text',
        window:
          'rounded-t-md data-[state=active]:bg-terminal-surface data-[state=active]:text-terminal-text data-[state=active]:border-t-2 data-[state=active]:border-syntax-blue data-[state=inactive]:text-terminal-muted data-[state=inactive]:hover:bg-terminal-surface/50',
        pills:
          'rounded-md data-[state=active]:bg-syntax-blue/20 data-[state=active]:text-syntax-blue data-[state=inactive]:text-terminal-muted data-[state=inactive]:hover:bg-terminal-bg/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  icon?: React.ReactNode;
  count?: number;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, icon, count, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {children}
    {count !== undefined && (
      <span className="ml-2 rounded-md bg-terminal-surface px-1.5 py-0.5 text-xs text-terminal-muted">
        {count}
      </span>
    )}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 ring-offset-terminal-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-syntax-blue focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
