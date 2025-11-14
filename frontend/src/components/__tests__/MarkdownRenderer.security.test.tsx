import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer - Security Tests', () => {
  it('should remove <script> tags', () => {
    const maliciousContent = '<script>alert("XSS")</script>Hello World';
    const { container } = render(
      <MarkdownRenderer content={maliciousContent} />
    );

    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).not.toContain('alert');
  });

  it('should remove onclick event handlers', () => {
    const maliciousContent = '<p onclick="alert(\'XSS\')">Click me</p>';
    const { container } = render(
      <MarkdownRenderer content={maliciousContent} />
    );

    expect(container.innerHTML).not.toContain('onclick');
  });

  it('should block javascript: URLs in links', () => {
    // Note: This tests the sanitization of already-rendered HTML links
    // Markdown link syntax will be tested when link rendering is implemented
    const maliciousContent = '<a href="javascript:alert(\'XSS\')">Click me</a>';
    const { container } = render(
      <MarkdownRenderer content={maliciousContent} />
    );

    const link = container.querySelector('a');
    // DOMPurify should remove the href or the entire link
    if (link) {
      expect(link.href).not.toContain('javascript:');
    }
  });

  it('should allow safe HTML tags', () => {
    const safeContent = '<p>Hello</p><strong>Bold</strong><code>code</code>';
    const { container } = render(<MarkdownRenderer content={safeContent} />);

    expect(container.querySelector('p')).toBeTruthy();
    expect(container.querySelector('strong')).toBeTruthy();
    expect(container.querySelector('code')).toBeTruthy();
  });

  it('should allow YouTube iframe embeds', () => {
    const youtubeEmbed =
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" width="560" height="315"></iframe>';
    const { container } = render(<MarkdownRenderer content={youtubeEmbed} />);

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.src).toContain('youtube.com');
  });

  it('should allow Vimeo iframe embeds', () => {
    const vimeoEmbed =
      '<iframe src="https://player.vimeo.com/video/123456789" width="560" height="315"></iframe>';
    const { container } = render(<MarkdownRenderer content={vimeoEmbed} />);

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeTruthy();
    expect(iframe?.src).toContain('vimeo.com');
  });

  it('should block iframes from non-whitelisted domains', () => {
    const maliciousEmbed =
      '<iframe src="https://evil.com/malicious" width="560" height="315"></iframe>';
    const { container } = render(<MarkdownRenderer content={maliciousEmbed} />);

    const iframe = container.querySelector('iframe');
    // DOMPurify should either remove the iframe or sanitize the src
    if (iframe) {
      expect(iframe.src).not.toContain('evil.com');
    }
  });

  it('should remove onerror handlers from images', () => {
    const maliciousImage = '<img src="invalid.jpg" onerror="alert(\'XSS\')" />';
    const { container } = render(<MarkdownRenderer content={maliciousImage} />);

    expect(container.innerHTML).not.toContain('onerror');
  });

  it('should sanitize style attributes with dangerous content', () => {
    const maliciousStyle =
      '<p style="background: url(javascript:alert(\'XSS\'))">Test</p>';
    const { container } = render(<MarkdownRenderer content={maliciousStyle} />);

    expect(container.innerHTML).not.toContain('javascript:');
  });

  it('should remove data attributes', () => {
    const dataAttr = '<p data-evil="malicious">Hello</p>';
    const { container } = render(<MarkdownRenderer content={dataAttr} />);

    expect(container.innerHTML).not.toContain('data-evil');
  });
});
