import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

describe('Tabs Component Family', () => {
  beforeEach(() => {
    // Reset DOM before each test
  });

  it('switches active tab on click', async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    // Tab 1 should be active by default
    const tab1 = screen.getByText('Tab 1');
    const tab2 = screen.getByText('Tab 2');

    expect(tab1).toHaveAttribute('data-state', 'active');
    expect(tab2).toHaveAttribute('data-state', 'inactive');

    // Click Tab 2 with userEvent for better event simulation
    await user.click(tab2);

    // Tab 2 should now be active
    await waitFor(() => {
      expect(tab2).toHaveAttribute('data-state', 'active');
      expect(tab1).toHaveAttribute('data-state', 'inactive');
    });
  });

  it('renders TabsContent only when tab is active', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview Content</TabsContent>
        <TabsContent value="details">Details Content</TabsContent>
      </Tabs>
    );

    // Active tab content should be visible
    expect(screen.getByText('Overview Content')).toBeVisible();

    // Overview trigger should be active, details should be inactive
    expect(screen.getByText('Overview')).toHaveAttribute(
      'data-state',
      'active'
    );
    expect(screen.getByText('Details')).toHaveAttribute(
      'data-state',
      'inactive'
    );
  });

  it('applies correct active/inactive classes with cli variant', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList variant="cli">
          <TabsTrigger value="tab1" variant="cli">
            Tab 1
          </TabsTrigger>
          <TabsTrigger value="tab2" variant="cli">
            Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tab1 = screen.getByText('Tab 1');
    const tab2 = screen.getByText('Tab 2');

    // Tab 1 should have active state (data-state="active")
    expect(tab1).toHaveAttribute('data-state', 'active');

    // Tab 2 should have inactive state
    expect(tab2).toHaveAttribute('data-state', 'inactive');
  });

  it('renders CLI variant with correct styling', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList variant="cli" data-testid="tabs-list">
          <TabsTrigger value="tab1" variant="cli">
            Tab 1
          </TabsTrigger>
          <TabsTrigger value="tab2" variant="cli">
            Tab 2
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    );

    const tabsList = screen.getByTestId('tabs-list');

    // CLI variant should have gap-6 and border-b classes
    expect(tabsList).toHaveClass('gap-6');
    expect(tabsList).toHaveClass('border-b');
    expect(tabsList).toHaveClass('border-terminal-border');
  });

  it('displays icon and count props correctly', () => {
    render(
      <Tabs defaultValue="files">
        <TabsList>
          <TabsTrigger value="files" icon="📁" count={12}>
            Files
          </TabsTrigger>
        </TabsList>
        <TabsContent value="files">File list</TabsContent>
      </Tabs>
    );

    // Icon should be rendered
    expect(screen.getByText('📁')).toBeInTheDocument();

    // Count should be rendered
    expect(screen.getByText('12')).toBeInTheDocument();

    // Tab label should be rendered
    expect(screen.getByText('Files')).toBeInTheDocument();
  });

  it('renders all variant styles correctly', () => {
    const variants = [
      'default',
      'cli',
      'underline',
      'window',
      'pills',
    ] as const;

    variants.forEach((variant) => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList variant={variant} data-testid={`list-${variant}`}>
            <TabsTrigger value="tab1" variant={variant}>
              Tab 1
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      );

      const tabsList = screen.getByTestId(`list-${variant}`);
      expect(tabsList).toBeInTheDocument();
      expect(tabsList).toHaveClass('font-mono');
    });
  });
});
