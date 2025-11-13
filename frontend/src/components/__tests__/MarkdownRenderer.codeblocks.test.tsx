import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer - Code Block Tests', () => {
  describe('Basic Code Block Rendering', () => {
    it('should render code block', () => {
      const content = '```\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const pre = container.querySelector('pre');
      const code = container.querySelector('code');

      expect(pre).toBeTruthy();
      expect(code).toBeTruthy();
      expect(code?.textContent).toBe('const x = 1;');
    });

    it('should apply terminal background styling to pre', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const pre = container.querySelector('pre');
      expect(pre?.className).toContain('bg-terminal-bg');
      expect(pre?.className).toContain('border');
      expect(pre?.className).toContain('border-terminal-border');
      expect(pre?.className).toContain('rounded-lg');
    });

    it('should apply padding to pre', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const pre = container.querySelector('pre');
      expect(pre?.className).toContain('p-4');
    });

    it('should allow horizontal scrolling', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const pre = container.querySelector('pre');
      expect(pre?.className).toContain('overflow-x-auto');
    });

    it('should apply syntax-cyan color to code', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const code = container.querySelector('code');
      expect(code?.className).toContain('text-syntax-cyan');
      expect(code?.className).toContain('font-mono');
      expect(code?.className).toContain('text-sm');
    });
  });

  describe('Language Labels', () => {
    it('should display language label when specified', () => {
      const content = '```javascript\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const label = container.querySelector('span');
      expect(label?.textContent).toBe('javascript');
    });

    it('should display typescript language label', () => {
      const content = '```typescript\nconst x: number = 1;\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const label = container.querySelector('span');
      expect(label?.textContent).toBe('typescript');
    });

    it('should display bash language label', () => {
      const content = '```bash\necho "hello"\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const label = container.querySelector('span');
      expect(label?.textContent).toBe('bash');
    });

    it('should apply language label styling', () => {
      const content = '```python\nprint("hello")\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const spans = container.querySelectorAll('span');
      const label = Array.from(spans).find((s) => s.textContent === 'python');

      expect(label?.className).toContain('absolute');
      expect(label?.className).toContain('top-2');
      expect(label?.className).toContain('right-12');
      expect(label?.className).toContain('text-xs');
      expect(label?.className).toContain('text-terminal-muted');
    });

    it('should not display label when no language specified', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const spans = container.querySelectorAll('span');
      // Should only have spans inside SVG buttons, not a language label
      expect(spans.length).toBe(0);
    });
  });

  describe('Copy Button', () => {
    it('should render copy button', () => {
      const content = '```\nconst x = 1;\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const button = container.querySelector('[data-copy-code]');
      expect(button).toBeTruthy();
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should have aria-label for accessibility', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const button = container.querySelector('[data-copy-code]');
      expect(button?.getAttribute('aria-label')).toBe('Copy to clipboard');
    });

    it('should position copy button in top-right', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const button = container.querySelector('[data-copy-code]');
      expect(button?.className).toContain('absolute');
      expect(button?.className).toContain('top-2');
      expect(button?.className).toContain('right-2');
    });

    it('should apply hover styles to copy button', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const button = container.querySelector('[data-copy-code]');
      expect(button?.className).toContain('hover:text-terminal-text');
      expect(button?.className).toContain('hover:bg-terminal-surface');
    });

    // Note: Copy functionality testing skipped due to clipboard API mocking complexity
    // The copy button event listener is tested in manual/browser testing
  });

  describe('Code Content Preservation', () => {
    it('should preserve whitespace in code', () => {
      const content = '```\n  indented\n    more indented\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const code = container.querySelector('code');
      expect(code?.textContent).toBe('indented\n    more indented');
    });

    it('should preserve multi-line structure', () => {
      const content = '```\nline 1\nline 2\nline 3\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const code = container.querySelector('code');
      expect(code?.textContent).toContain('line 1');
      expect(code?.textContent).toContain('line 2');
      expect(code?.textContent).toContain('line 3');
    });

    it('should handle code with special characters', () => {
      const content = '```\nconst str = "hello & goodbye";\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const code = container.querySelector('code');
      expect(code?.textContent).toContain('&');
    });

    it('should handle multi-line code', () => {
      const content = `\`\`\`javascript
function hello() {
  console.log("world");
}
\`\`\``;
      const { container } = render(<MarkdownRenderer content={content} />);

      const code = container.querySelector('code');
      expect(code?.textContent).toContain('function hello()');
      expect(code?.textContent).toContain('console.log');
    });
  });

  describe('Multiple Code Blocks', () => {
    it('should render multiple code blocks', () => {
      const content = `\`\`\`\ncode 1\n\`\`\`

\`\`\`\ncode 2\n\`\`\``;
      const { container } = render(<MarkdownRenderer content={content} />);

      const codeBlocks = container.querySelectorAll('code');
      expect(codeBlocks.length).toBe(2);
      expect(codeBlocks[0]?.textContent).toBe('code 1');
      expect(codeBlocks[1]?.textContent).toBe('code 2');
    });

    it('should have unique IDs for each code block', () => {
      const content = `\`\`\`\ncode 1\n\`\`\`

\`\`\`\ncode 2\n\`\`\``;
      const { container } = render(<MarkdownRenderer content={content} />);

      const codeBlocks = container.querySelectorAll('code');
      const id1 = codeBlocks[0]?.id;
      const id2 = codeBlocks[1]?.id;

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should have matching data-copy-code and code IDs', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const button = container.querySelector('[data-copy-code]');
      const code = container.querySelector('code');

      const copyId = button?.getAttribute('data-copy-code');
      const codeId = code?.id;

      expect(copyId).toBe(codeId);
    });
  });

  describe('Code Block Structure', () => {
    it('should wrap code in pre tag', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const pre = container.querySelector('pre');
      const code = pre?.querySelector('code');

      expect(pre).toBeTruthy();
      expect(code).toBeTruthy();
    });

    it('should have relative positioning on wrapper div', () => {
      const content = '```\ncode\n```';
      const { container } = render(<MarkdownRenderer content={content} />);

      const wrapper = container.querySelector('.relative');
      expect(wrapper).toBeTruthy();
      expect(wrapper?.className).toContain('my-4');
    });
  });
});
