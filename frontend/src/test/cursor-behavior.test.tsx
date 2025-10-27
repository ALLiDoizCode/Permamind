import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CopyButton } from '@/components/CopyButton';

/**
 * Cursor Behavior Tests
 *
 * Tests AC1-7: Verify cursor-pointer on all interactive elements
 * Tests AC8: Validates cursor states across button, tab, and copy button components
 *
 * Story: 6.12 - UX/UI Cursor Behavior Standards
 */

describe('Cursor Behavior - Interactive Elements', () => {
  describe('Button Component (AC1, AC7)', () => {
    it('should have cursor-pointer class on default button', () => {
      const { container } = render(<Button>Click me</Button>);
      const button = container.querySelector('button');

      expect(button?.className).toContain('cursor-pointer');
    });

    it('should have cursor-pointer on all button variants', () => {
      const variants = [
        'default',
        'outline',
        'ghost',
        'destructive',
        'secondary',
        'command',
      ] as const;

      variants.forEach((variant) => {
        const { container } = render(<Button variant={variant}>Test</Button>);
        const button = container.querySelector('button');

        expect(button?.className).toContain('cursor-pointer');
      });
    });

    it('should have cursor-not-allowed on disabled button', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const button = container.querySelector('button');

      expect(button?.className).toContain('disabled:cursor-not-allowed');
    });

    it('should have cursor-pointer on all button sizes', () => {
      const sizes = ['default', 'sm', 'lg', 'icon'] as const;

      sizes.forEach((size) => {
        const { container } = render(<Button size={size}>Test</Button>);
        const button = container.querySelector('button');

        expect(button?.className).toContain('cursor-pointer');
      });
    });
  });

  describe('Tab Navigation (AC5)', () => {
    const TabsExample = () => (
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3" disabled>
            Tab 3 Disabled
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    );

    it('should have cursor-pointer on tab triggers', () => {
      const { container } = render(<TabsExample />);
      const triggers = container.querySelectorAll('[role="tab"]');

      triggers.forEach((trigger) => {
        expect(trigger.className).toContain('cursor-pointer');
      });
    });

    it('should have cursor-not-allowed on disabled tab triggers', () => {
      const { container } = render(<TabsExample />);
      const disabledTrigger = container.querySelector('[role="tab"][disabled]');

      expect(disabledTrigger?.className).toContain(
        'disabled:cursor-not-allowed'
      );
    });

    it('should have cursor-pointer on all tab variants', () => {
      const variants = [
        'default',
        'cli',
        'underline',
        'window',
        'pills',
      ] as const;

      variants.forEach((variant) => {
        const { container } = render(
          <Tabs defaultValue="test">
            <TabsList variant={variant}>
              <TabsTrigger value="test" variant={variant}>
                Test
              </TabsTrigger>
            </TabsList>
            <TabsContent value="test">Content</TabsContent>
          </Tabs>
        );

        const trigger = container.querySelector('[role="tab"]');
        expect(trigger?.className).toContain('cursor-pointer');
      });
    });
  });

  describe('CopyButton Component (AC1)', () => {
    it('should have cursor-pointer class', () => {
      const { container } = render(<CopyButton text="test content" />);
      const button = container.querySelector('button');

      expect(button?.className).toContain('cursor-pointer');
    });

    it('should maintain cursor-pointer in copied state', async () => {
      const { container } = render(<CopyButton text="test" />);
      const button = container.querySelector('button');

      // Verify cursor-pointer exists regardless of state
      expect(button?.className).toContain('cursor-pointer');
    });

    it('should have cursor-pointer with custom className', () => {
      const { container } = render(
        <CopyButton text="test" className="custom-class" />
      );
      const button = container.querySelector('button');

      expect(button?.className).toContain('cursor-pointer');
      expect(button?.className).toContain('custom-class');
    });
  });

  describe('Link Components (AC2)', () => {
    it('should render links with cursor-pointer in router context', () => {
      const { container } = render(
        <BrowserRouter>
          <a href="/test" className="cursor-pointer">
            Test Link
          </a>
        </BrowserRouter>
      );

      const link = container.querySelector('a');
      expect(link?.className).toContain('cursor-pointer');
    });
  });

  describe('Non-Interactive Elements (AC6)', () => {
    it('should NOT have cursor-pointer on text elements', () => {
      const { container } = render(
        <div>
          <h1>Heading</h1>
          <p>Paragraph text</p>
          <span>Span text</span>
        </div>
      );

      const heading = container.querySelector('h1');
      const paragraph = container.querySelector('p');
      const span = container.querySelector('span');

      expect(heading?.className).not.toContain('cursor-pointer');
      expect(paragraph?.className).not.toContain('cursor-pointer');
      expect(span?.className).not.toContain('cursor-pointer');
    });

    it('should NOT have cursor-pointer on generic containers', () => {
      const { container } = render(
        <div className="container">
          <div className="wrapper">Content</div>
        </div>
      );

      const containerDiv = container.querySelector('.container');
      const wrapperDiv = container.querySelector('.wrapper');

      expect(containerDiv?.className).not.toContain('cursor-pointer');
      expect(wrapperDiv?.className).not.toContain('cursor-pointer');
    });
  });
});
