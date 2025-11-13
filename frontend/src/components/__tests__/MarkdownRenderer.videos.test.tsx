import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer - Video Tests', () => {
  describe('YouTube Embeds', () => {
    it('should convert YouTube watch URL to iframe embed', () => {
      const content = '![video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe).toBeTruthy();
      expect(iframe?.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should convert youtu.be short URL to iframe embed', () => {
      const content = '![video](https://youtu.be/dQw4w9WgXcQ)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe).toBeTruthy();
      expect(iframe?.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should add aspect-video wrapper for 16:9 ratio', () => {
      const content = '![video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const wrapper = container.querySelector('.aspect-video');
      expect(wrapper).toBeTruthy();
      expect(wrapper?.querySelector('iframe')).toBeTruthy();
    });

    it('should set iframe width and height to 100%', () => {
      const content = '![video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.width).toBe('100%');
      expect(iframe?.height).toBe('100%');
    });

    it('should add correct allow attributes', () => {
      const content = '![video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      const allowAttr = iframe?.getAttribute('allow');
      expect(allowAttr).toContain('accelerometer');
      expect(allowAttr).toContain('autoplay');
      expect(allowAttr).toContain('encrypted-media');
      expect(allowAttr).toContain('gyroscope');
      expect(allowAttr).toContain('picture-in-picture');
    });

    it('should have allowfullscreen attribute', () => {
      const content = '![video](https://www.youtube.com/watch?v=dQw4w9WgXcQ)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
    });

    it('should handle video IDs with hyphens and underscores', () => {
      const content = '![video](https://www.youtube.com/watch?v=Ab-C_123-XY)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.src).toContain('Ab-C_123-XY');
    });
  });

  describe('Vimeo Embeds', () => {
    it('should convert Vimeo URL to player iframe', () => {
      const content = '![video](https://vimeo.com/123456789)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe).toBeTruthy();
      expect(iframe?.src).toBe('https://player.vimeo.com/video/123456789');
    });

    it('should add aspect-video wrapper for 16:9 ratio', () => {
      const content = '![video](https://vimeo.com/123456789)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const wrapper = container.querySelector('.aspect-video');
      expect(wrapper).toBeTruthy();
      expect(wrapper?.querySelector('iframe')).toBeTruthy();
    });

    it('should set iframe width and height to 100%', () => {
      const content = '![video](https://vimeo.com/123456789)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.width).toBe('100%');
      expect(iframe?.height).toBe('100%');
    });

    it('should add correct allow attributes', () => {
      const content = '![video](https://vimeo.com/123456789)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      const allowAttr = iframe?.getAttribute('allow');
      expect(allowAttr).toContain('autoplay');
      expect(allowAttr).toContain('fullscreen');
      expect(allowAttr).toContain('picture-in-picture');
    });

    it('should have allowfullscreen attribute', () => {
      const content = '![video](https://vimeo.com/123456789)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.hasAttribute('allowfullscreen')).toBe(true);
    });
  });

  describe('Mixed Content', () => {
    it('should handle YouTube video alongside regular image', () => {
      const content =
        '![video](https://www.youtube.com/watch?v=abc123) ![image](https://example.com/photo.jpg)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      const img = container.querySelector('img');

      expect(iframe).toBeTruthy();
      expect(img).toBeTruthy();
    });

    it('should handle Vimeo video alongside YouTube video', () => {
      const content =
        '![video](https://vimeo.com/123) ![video](https://youtube.com/watch?v=abc)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframes = container.querySelectorAll('iframe');
      expect(iframes.length).toBe(2);
      expect(iframes[0]?.src).toContain('vimeo.com');
      expect(iframes[1]?.src).toContain('youtube.com');
    });

    it('should not convert non-video URLs to iframes', () => {
      const content = '![not a video](https://example.com/page)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      const img = container.querySelector('img');

      expect(iframe).toBeFalsy();
      expect(img).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle YouTube URLs with additional query parameters', () => {
      const content = '![video](https://www.youtube.com/watch?v=abc123&t=30s)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.src).toContain('abc123');
    });

    it('should handle URLs with www and without', () => {
      const content1 = '![video](https://www.youtube.com/watch?v=abc)';
      const content2 = '![video](https://youtube.com/watch?v=def)';

      const { container: container1 } = render(
        <MarkdownRenderer content={content1} />
      );
      const { container: container2 } = render(
        <MarkdownRenderer content={content2} />
      );

      expect(container1.querySelector('iframe')).toBeTruthy();
      expect(container2.querySelector('iframe')).toBeTruthy();
    });

    it('should apply rounded-lg class to iframe', () => {
      const content = '![video](https://youtube.com/watch?v=abc)';
      const { container } = render(<MarkdownRenderer content={content} />);

      const iframe = container.querySelector('iframe');
      expect(iframe?.className).toContain('rounded-lg');
    });
  });
});
