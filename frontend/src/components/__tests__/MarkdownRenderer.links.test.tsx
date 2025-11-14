import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer - Link Tests', () => {
  describe('External Links', () => {
    it('should render external link with target="_blank"', () => {
      const content = '[Google](https://google.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(link?.href).toBe('https://google.com/');
      expect(link?.target).toBe('_blank');
    });

    it('should add rel="noopener noreferrer" to external links', () => {
      const content = '[External](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.rel).toBe('noopener noreferrer');
    });

    it('should apply cyan text color class to links', () => {
      const content = '[Link](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.className).toContain('text-syntax-cyan');
    });

    it('should apply hover purple color class to links', () => {
      const content = '[Link](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.className).toContain('hover:text-syntax-purple');
    });

    it('should add transition-colors class for smooth hover', () => {
      const content = '[Link](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.className).toContain('transition-colors');
    });

    it('should add underline class to links', () => {
      const content = '[Link](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.className).toContain('underline');
    });

    it('should display external link icon for external links', () => {
      const content = '[External](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.innerHTML).toContain('<svg');
    });

    it('should preserve link text correctly', () => {
      const content = '[Click Here](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.textContent).toContain('Click Here');
    });
  });

  describe('Internal Links', () => {
    it('should render internal link without target attribute (starts with /)', () => {
      const content = '[About](/about)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(link?.href).toContain('/about');
      expect(link?.hasAttribute('target')).toBe(false);
    });

    it('should render anchor link without target attribute (starts with #)', () => {
      const content = '[Section](#section)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(link?.hasAttribute('target')).toBe(false);
    });

    it('should not display external icon for internal links', () => {
      const content = '[Internal](/page)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.innerHTML).not.toContain('<svg');
    });

    it('should apply same styling classes to internal links', () => {
      const content = '[Internal](/page)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.className).toContain('text-syntax-cyan');
      expect(link?.className).toContain('hover:text-syntax-purple');
    });
  });

  describe('Multiple Links', () => {
    it('should render multiple links correctly', () => {
      const content = '[First](https://first.com) and [Second](/second)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const links = container.querySelectorAll('a');
      expect(links.length).toBe(2);
      expect(links[0]?.href).toContain('first.com');
      expect(links[1]?.href).toContain('/second');
    });

    it('should handle mix of external and internal links', () => {
      const content =
        '[External](https://example.com) [Internal](/page) [Anchor](#section)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const links = container.querySelectorAll('a');
      expect(links.length).toBe(3);
      expect(links[0]?.target).toBe('_blank');
      expect(links[1]?.hasAttribute('target')).toBe(false);
      expect(links[2]?.hasAttribute('target')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle links with special characters in text', () => {
      const content = '[Email: test@example.com](mailto:test@example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.textContent).toContain('Email: test@example.com');
    });

    it('should handle links with query parameters', () => {
      const content = '[Search](https://example.com?q=test&lang=en)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link?.href).toContain('?q=test&lang=en');
    });

    it('should handle links in the middle of text', () => {
      const content = 'Visit [our website](https://example.com) for more info.';
      const { container } = render(<MarkdownRenderer content={content} />);

      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(container.textContent).toContain('Visit');
      expect(container.textContent).toContain('for more info');
    });
  });
});
