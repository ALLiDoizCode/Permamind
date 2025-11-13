import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer - List Tests', () => {
  describe('Unordered Lists', () => {
    it('should render unordered list with hyphen syntax', () => {
      const content = `- Item 1
- Item 2
- Item 3`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      expect(ul).toBeTruthy();

      const items = ul?.querySelectorAll('li');
      expect(items?.length).toBe(3);
      expect(items?.[0]?.textContent).toBe('Item 1');
      expect(items?.[1]?.textContent).toBe('Item 2');
      expect(items?.[2]?.textContent).toBe('Item 3');
    });

    it('should render unordered list with asterisk syntax', () => {
      const content = `* Item A
* Item B
* Item C`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      expect(ul).toBeTruthy();

      const items = ul?.querySelectorAll('li');
      expect(items?.length).toBe(3);
    });

    it('should apply list-disc class for bullet points', () => {
      const content = `- Item 1
- Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      expect(ul?.className).toContain('list-disc');
    });

    it('should apply terminal-muted text color', () => {
      const content = `- Item 1
- Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      expect(ul?.className).toContain('text-terminal-muted');
    });

    it('should apply ml-6 indentation', () => {
      const content = `- Item 1`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      expect(ul?.className).toContain('ml-6');
    });

    it('should apply space-y-2 spacing', () => {
      const content = `- Item 1
- Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      expect(ul?.className).toContain('space-y-2');
    });
  });

  describe('Ordered Lists', () => {
    it('should render ordered list', () => {
      const content = `1. First item
2. Second item
3. Third item`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ol = container.querySelector('ol');
      expect(ol).toBeTruthy();

      const items = ol?.querySelectorAll('li');
      expect(items?.length).toBe(3);
      expect(items?.[0]?.textContent).toBe('First item');
      expect(items?.[1]?.textContent).toBe('Second item');
      expect(items?.[2]?.textContent).toBe('Third item');
    });

    it('should apply list-decimal class for numbering', () => {
      const content = `1. Item 1
2. Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ol = container.querySelector('ol');
      expect(ol?.className).toContain('list-decimal');
    });

    it('should apply terminal-muted text color', () => {
      const content = `1. Item 1`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ol = container.querySelector('ol');
      expect(ol?.className).toContain('text-terminal-muted');
    });

    it('should apply ml-6 indentation', () => {
      const content = `1. Item 1`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ol = container.querySelector('ol');
      expect(ol?.className).toContain('ml-6');
    });

    it('should handle non-sequential numbers', () => {
      const content = `1. First
5. Second
10. Third`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const items = container.querySelectorAll('li');
      expect(items.length).toBe(3);
      expect(items[0]?.textContent).toBe('First');
      expect(items[1]?.textContent).toBe('Second');
      expect(items[2]?.textContent).toBe('Third');
    });
  });

  describe('Mixed Content', () => {
    it('should handle unordered and ordered lists in same content', () => {
      const content = `- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      const ol = container.querySelector('ol');

      expect(ul).toBeTruthy();
      expect(ol).toBeTruthy();
      expect(ul?.querySelectorAll('li').length).toBe(2);
      expect(ol?.querySelectorAll('li').length).toBe(2);
    });

    it('should handle lists with inline formatting', () => {
      const content = `- **Bold** item
- Item with *italics* (if supported)
- Item with \`code\``;
      const { container } = render(<MarkdownRenderer content={content} />);

      const items = container.querySelectorAll('li');
      expect(items[0]?.querySelector('strong')).toBeTruthy();
      expect(items[2]?.querySelector('code')).toBeTruthy();
    });

    it('should handle lists with links', () => {
      const content = `- [Link 1](https://example.com)
- [Link 2](/internal)`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const items = container.querySelectorAll('li');
      const links = container.querySelectorAll('a');

      expect(items.length).toBe(2);
      expect(links.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single-item lists', () => {
      const content = '- Only one item';
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      const items = ul?.querySelectorAll('li');

      expect(ul).toBeTruthy();
      expect(items?.length).toBe(1);
    });

    it('should handle lists with long content', () => {
      const longContent =
        'This is a very long list item that contains multiple words and should still be properly rendered as a single list item';
      const content = `- ${longContent}`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const item = container.querySelector('li');
      expect(item?.textContent).toBe(longContent);
    });

    it('should handle lists with special characters', () => {
      const content = `- Item with "quotes"
- Item with 'apostrophes'
- Item with & ampersand`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const items = container.querySelectorAll('li');
      expect(items.length).toBe(3);
    });

    it('should not treat hyphen in middle of text as list', () => {
      const content = 'This is not - a list';
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      expect(ul).toBeFalsy();
    });

    it('should handle empty lines between list items', () => {
      const content = `- Item 1

- Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      // Should create separate lists
      const lists = container.querySelectorAll('ul');
      expect(lists.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('List Structure', () => {
    it('should wrap list items in li tags', () => {
      const content = `- Item 1
- Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBe(2);
      listItems.forEach((item) => {
        expect(item.tagName).toBe('LI');
      });
    });

    it('should wrap unordered lists in ul tags', () => {
      const content = `- Item 1
- Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ul = container.querySelector('ul');
      expect(ul?.tagName).toBe('UL');
    });

    it('should wrap ordered lists in ol tags', () => {
      const content = `1. Item 1
2. Item 2`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const ol = container.querySelector('ol');
      expect(ol?.tagName).toBe('OL');
    });
  });
});
