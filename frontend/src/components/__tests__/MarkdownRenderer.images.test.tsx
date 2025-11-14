import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer - Image Tests', () => {
  describe('Basic Image Rendering', () => {
    it('should render image with correct src and alt', () => {
      const content = '![Test Image](https://example.com/image.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.src).toContain('example.com/image.jpg');
      expect(img?.alt).toBe('Test Image');
    });

    it('should add loading attribute for lazy loading', () => {
      const content = '![Image](https://example.com/image.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const img = container.querySelector('img');
      expect(img?.getAttribute('loading')).toBe('lazy');
    });

    it('should apply responsive classes', () => {
      const content = '![Image](https://example.com/image.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const img = container.querySelector('img');
      expect(img?.className).toContain('max-w-full');
      expect(img?.className).toContain('h-auto');
      expect(img?.className).toContain('mx-auto');
    });

    it('should apply terminal border styling', () => {
      const content = '![Image](https://example.com/image.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const img = container.querySelector('img');
      expect(img?.className).toContain('border');
      expect(img?.className).toContain('border-terminal-border');
      expect(img?.className).toContain('rounded-lg');
    });

    it('should wrap image in figure tag', () => {
      const content = '![Image](https://example.com/image.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const figure = container.querySelector('figure');
      expect(figure).toBeTruthy();
      expect(figure?.querySelector('img')).toBeTruthy();
    });
  });

  describe('Image Captions', () => {
    it('should display alt text as caption', () => {
      const content = '![Beautiful Sunset](https://example.com/sunset.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const figcaption = container.querySelector('figcaption');
      expect(figcaption).toBeTruthy();
      expect(figcaption?.textContent).toBe('Beautiful Sunset');
    });

    it('should apply caption styling classes', () => {
      const content = '![Caption](https://example.com/image.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const figcaption = container.querySelector('figcaption');
      expect(figcaption?.className).toContain('text-terminal-muted');
      expect(figcaption?.className).toContain('text-sm');
      expect(figcaption?.className).toContain('text-center');
      expect(figcaption?.className).toContain('mt-2');
    });

    it('should not render caption if alt text is empty', () => {
      const content = '![](https://example.com/image.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const figcaption = container.querySelector('figcaption');
      expect(figcaption).toBeFalsy();
    });
  });

  describe('Broken Image Handling', () => {
    it('should use browser default broken image behavior', () => {
      // Note: Broken image handling uses browser defaults for security
      // (avoids inline JS event handlers that DOMPurify would strip)
      const content = '![Image](https://example.com/broken.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img?.src).toContain('broken.jpg');
    });
  });

  describe('Multiple Images', () => {
    it('should render multiple images correctly', () => {
      const content =
        '![First](https://example.com/1.jpg) ![Second](https://example.com/2.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const images = container.querySelectorAll('img');
      expect(images.length).toBe(2);
      expect(images[0]?.src).toContain('1.jpg');
      expect(images[1]?.src).toContain('2.jpg');
    });

    it('should each have correct figure wrappers', () => {
      const content =
        '![First](https://example.com/1.jpg) ![Second](https://example.com/2.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const figures = container.querySelectorAll('figure');
      expect(figures.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle images with special characters in alt text', () => {
      const content =
        '![Image with "quotes" and \'apostrophes\'](https://example.com/image.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const img = container.querySelector('img');
      expect(img).toBeTruthy();
    });

    it('should handle images with query parameters in URL', () => {
      const content = '![Image](https://example.com/image.jpg?w=800&h=600)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const img = container.querySelector('img');
      expect(img?.src).toContain('?w=800&h=600');
    });

    it('should handle images with long URLs', () => {
      const longUrl =
        'https://example.com/very/long/path/to/image/file/with/many/segments/image.jpg';
      const content = `![Image](${longUrl})`;
      const { container } = render(<MarkdownRenderer content={content} />);

      const img = container.querySelector('img');
      expect(img?.src).toContain('very/long/path');
    });
  });
});
