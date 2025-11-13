import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer - Blockquote Tests', () => {
  describe('Basic Blockquotes', () => {
    it('should render blockquote', () => {
      const content = '> This is a quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeTruthy();
      expect(blockquote?.textContent).toBe('This is a quote');
    });

    it('should apply left border styling', () => {
      const content = '> Quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote?.className).toContain('border-l-4');
      expect(blockquote?.className).toContain('border-syntax-cyan');
    });

    it('should apply terminal surface background', () => {
      const content = '> Quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote?.className).toContain('bg-terminal-surface');
    });

    it('should apply padding classes', () => {
      const content = '> Quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote?.className).toContain('pl-4');
      expect(blockquote?.className).toContain('py-2');
    });

    it('should apply margin classes', () => {
      const content = '> Quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote?.className).toContain('my-4');
    });

    it('should apply italic text style', () => {
      const content = '> Quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote?.className).toContain('italic');
    });

    it('should apply terminal-muted text color', () => {
      const content = '> Quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote?.className).toContain('text-terminal-muted');
    });
  });

  describe('Multi-line Blockquotes', () => {
    it('should handle multi-line blockquotes', () => {
      const content = `> This is line one
> This is line two
> This is line three`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeTruthy();
      expect(blockquote?.textContent).toContain('This is line one');
      expect(blockquote?.textContent).toContain('This is line two');
      expect(blockquote?.textContent).toContain('This is line three');
    });

    it('should join multi-line quotes with spaces', () => {
      const content = `> First line
> Second line`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      // Lines should be joined with space
      expect(blockquote?.textContent).toBe('First line Second line');
    });
  });

  describe('Blockquotes with Inline Formatting', () => {
    it('should preserve bold formatting in blockquotes', () => {
      const content = '> This is **bold** text';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      const strong = blockquote?.querySelector('strong');

      expect(strong).toBeTruthy();
      expect(strong?.textContent).toBe('bold');
    });

    it('should preserve inline code in blockquotes', () => {
      const content = '> This has `code` in it';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      const code = blockquote?.querySelector('code');

      expect(code).toBeTruthy();
      expect(code?.textContent).toBe('code');
    });

    it('should preserve links in blockquotes', () => {
      const content = '> Check [this link](https://example.com)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      const link = blockquote?.querySelector('a');

      expect(link).toBeTruthy();
      expect(link?.href).toContain('example.com');
    });
  });

  describe('Multiple Blockquotes', () => {
    it('should handle multiple separate blockquotes', () => {
      const content = `> First quote

> Second quote`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquotes = container.querySelectorAll('blockquote');
      expect(blockquotes.length).toBe(2);
      expect(blockquotes[0]?.textContent).toBe('First quote');
      expect(blockquotes[1]?.textContent).toBe('Second quote');
    });

    it('should handle blockquotes mixed with other content', () => {
      const content = `Some text

> A quote

More text`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeTruthy();
      expect(container.textContent).toContain('Some text');
      expect(container.textContent).toContain('A quote');
      expect(container.textContent).toContain('More text');
    });
  });

  describe('Edge Cases', () => {
    it('should handle blockquotes with special characters', () => {
      const content = '> Quote with "quotes" and \'apostrophes\'';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeTruthy();
    });

    it('should handle empty blockquote lines gracefully', () => {
      const content = `> Line 1
>
> Line 3`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeTruthy();
    });

    it('should handle long blockquote content', () => {
      const longQuote =
        'This is a very long quote that contains many words and spans multiple lines when rendered but is written as a single blockquote in markdown format';
      const content = `> ${longQuote}`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote?.textContent).toBe(longQuote);
    });

    it('should not treat > in middle of text as blockquote', () => {
      const content = 'This is not > a blockquote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote).toBeFalsy();
    });
  });

  describe('Blockquote Structure', () => {
    it('should wrap content in blockquote tag', () => {
      const content = '> Quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquote = container.querySelector('blockquote');
      expect(blockquote?.tagName).toBe('BLOCKQUOTE');
    });

    it('should not nest blockquotes unnecessarily', () => {
      const content = '> Quote';
      const { container } = render(<MarkdownRenderer content={content} />);

      const blockquotes = container.querySelectorAll('blockquote');
      expect(blockquotes.length).toBe(1);
    });
  });
});
