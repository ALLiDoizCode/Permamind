import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer - Regression Tests (Existing Features)', () => {
  describe('Headers', () => {
    it('should render H1 headers', () => {
      const content = '# Heading 1';
      const { container } = render(<MarkdownRenderer content={content} />);

      const h1 = container.querySelector('h1');
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toBe('Heading 1');
      expect(h1?.className).toContain('text-2xl');
      expect(h1?.className).toContain('font-bold');
      expect(h1?.className).toContain('text-terminal-text');
    });

    it('should render H2 headers', () => {
      const content = '## Heading 2';
      const { container } = render(<MarkdownRenderer content={content} />);

      const h2 = container.querySelector('h2');
      expect(h2).toBeTruthy();
      expect(h2?.textContent).toBe('Heading 2');
      expect(h2?.className).toContain('text-xl');
      expect(h2?.className).toContain('font-semibold');
      expect(h2?.className).toContain('text-terminal-text');
    });

    it('should render H3 headers', () => {
      const content = '### Heading 3';
      const { container } = render(<MarkdownRenderer content={content} />);

      const h3 = container.querySelector('h3');
      expect(h3).toBeTruthy();
      expect(h3?.textContent).toBe('Heading 3');
      expect(h3?.className).toContain('text-lg');
      expect(h3?.className).toContain('font-semibold');
      expect(h3?.className).toContain('text-terminal-text');
    });

    it('should render multiple headers at different levels', () => {
      const content = `# Title
## Subtitle
### Section`;
      const { container } = render(<MarkdownRenderer content={content} />);

      expect(container.querySelector('h1')).toBeTruthy();
      expect(container.querySelector('h2')).toBeTruthy();
      expect(container.querySelector('h3')).toBeTruthy();
    });
  });

  describe('Bold Text', () => {
    it('should render bold text with ** syntax', () => {
      const content = 'This is **bold** text';
      const { container } = render(<MarkdownRenderer content={content} />);

      const strong = container.querySelector('strong');
      expect(strong).toBeTruthy();
      expect(strong?.textContent).toBe('bold');
      expect(strong?.className).toContain('font-semibold');
      expect(strong?.className).toContain('text-terminal-text');
    });

    it('should render multiple bold sections', () => {
      const content = '**First** and **second** bold';
      const { container } = render(<MarkdownRenderer content={content} />);

      const strongs = container.querySelectorAll('strong');
      expect(strongs.length).toBe(2);
      expect(strongs[0]?.textContent).toBe('First');
      expect(strongs[1]?.textContent).toBe('second');
    });

    it('should handle bold text at start of line', () => {
      const content = '**Bold start** regular text';
      const { container } = render(<MarkdownRenderer content={content} />);

      const strong = container.querySelector('strong');
      expect(strong).toBeTruthy();
      expect(strong?.textContent).toBe('Bold start');
    });

    it('should handle bold text at end of line', () => {
      const content = 'Regular text **bold end**';
      const { container } = render(<MarkdownRenderer content={content} />);

      const strong = container.querySelector('strong');
      expect(strong).toBeTruthy();
      expect(strong?.textContent).toBe('bold end');
    });
  });

  describe('Inline Code', () => {
    it('should render inline code with backticks', () => {
      const content = 'This is `inline code` example';
      const { container } = render(<MarkdownRenderer content={content} />);

      const code = container.querySelector('code');
      expect(code).toBeTruthy();
      expect(code?.textContent).toBe('inline code');
      expect(code?.className).toContain('bg-terminal-bg');
      expect(code?.className).toContain('border');
      expect(code?.className).toContain('text-syntax-cyan');
      expect(code?.className).toContain('font-mono');
    });

    it('should render multiple inline code sections', () => {
      const content = 'Use `const` or `let` for variables';
      const { container } = render(<MarkdownRenderer content={content} />);

      const codes = container.querySelectorAll('code');
      expect(codes.length).toBe(2);
      expect(codes[0]?.textContent).toBe('const');
      expect(codes[1]?.textContent).toBe('let');
    });

    it('should handle inline code with special characters', () => {
      const content = 'Example: `const x = 5 & y`';
      const { container } = render(<MarkdownRenderer content={content} />);

      const code = container.querySelector('code');
      expect(code).toBeTruthy();
      expect(code?.textContent).toContain('&');
      expect(code?.textContent).toContain('const');
    });
  });

  describe('Paragraphs', () => {
    it('should render single paragraph', () => {
      const content = 'This is a paragraph.';
      const { container } = render(<MarkdownRenderer content={content} />);

      const p = container.querySelector('p');
      expect(p).toBeTruthy();
      expect(p?.textContent).toBe('This is a paragraph.');
      expect(p?.className).toContain('text-terminal-muted');
      expect(p?.className).toContain('leading-relaxed');
    });

    it('should render multiple paragraphs with double newline', () => {
      const content = `First paragraph.

Second paragraph.`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0]?.textContent).toBe('First paragraph.');
      expect(paragraphs[1]?.textContent).toBe('Second paragraph.');
    });

    it('should handle paragraphs with inline formatting', () => {
      const content = 'Paragraph with **bold** and `code`.';
      const { container } = render(<MarkdownRenderer content={content} />);

      const p = container.querySelector('p');
      const strong = p?.querySelector('strong');
      const code = p?.querySelector('code');

      expect(p).toBeTruthy();
      expect(strong).toBeTruthy();
      expect(code).toBeTruthy();
    });
  });

  describe('Combined Features (Regression)', () => {
    it('should render complex markdown with all existing features', () => {
      const content = `# Main Title

This is a paragraph with **bold text** and \`inline code\`.

## Section Header

Another paragraph here.

### Subsection

Final paragraph with multiple **bold** and \`code\` sections.`;

      const { container } = render(<MarkdownRenderer content={content} />);

      // Verify all element types present
      expect(container.querySelector('h1')).toBeTruthy();
      expect(container.querySelector('h2')).toBeTruthy();
      expect(container.querySelector('h3')).toBeTruthy();
      expect(container.querySelectorAll('p').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('strong').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('code').length).toBeGreaterThan(0);
    });

    it('should not break existing features when combined with new features', () => {
      const content = `# Header

**Bold paragraph** with \`code\`.

- List item with **bold**
- List item with \`code\`

> Blockquote with **bold** and \`code\``;

      const { container } = render(<MarkdownRenderer content={content} />);

      // Existing features still work
      expect(container.querySelector('h1')).toBeTruthy();
      expect(container.querySelectorAll('strong').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('code').length).toBeGreaterThan(0);

      // New features also work
      expect(container.querySelector('ul')).toBeTruthy();
      expect(container.querySelector('blockquote')).toBeTruthy();
    });

    it('should maintain text styling across all features', () => {
      const content = `# Title
**Bold**
\`code\``;

      const { container } = render(<MarkdownRenderer content={content} />);

      const h1 = container.querySelector('h1');
      const strong = container.querySelector('strong');
      const code = container.querySelector('code');

      // All should have terminal theme classes
      expect(h1?.className).toContain('text-terminal-text');
      expect(strong?.className).toContain('text-terminal-text');
      expect(code?.className).toContain('text-syntax-cyan');
    });
  });

  describe('Edge Cases (Regression)', () => {
    it('should handle empty content', () => {
      const content = '';
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.querySelector('.markdown-content')).toBeTruthy();
    });

    it('should handle content with only whitespace', () => {
      const content = '   \n\n   ';
      const { container } = render(<MarkdownRenderer content={content} />);
      expect(container.querySelector('.markdown-content')).toBeTruthy();
    });

    it('should handle single newline (not double) as same paragraph', () => {
      const content = 'Line one\nLine two';
      const { container } = render(<MarkdownRenderer content={content} />);

      // Should be wrapped in a paragraph but with the newline
      const p = container.querySelector('p');
      expect(p).toBeTruthy();
    });
  });
});
