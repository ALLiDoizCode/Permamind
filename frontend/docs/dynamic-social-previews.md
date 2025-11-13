# Dynamic Social Previews for Blog Posts

## Overview

Each blog post now has its own dedicated HTML file with unique Open Graph and Twitter Card meta tags. This ensures that when users share blog posts on social media (Twitter, Facebook, Discord, LinkedIn, etc.), each post displays with its own title, description, and image.

## How It Works

### 1. Build-Time Generation

During the build process (`npm run build`), a script generates individual HTML files for each blog post:

```
dist/
  blog/
    getting-started-with-permamind.html
    using-permamind-mcp-server.html
    understanding-permamind-architecture.html
```

### 2. Script Location

`frontend/scripts/generate-blog-html.ts` - This TypeScript script:
- Reads blog post metadata from `blog-posts.ts`
- Generates HTML files with unique meta tags for each post
- Outputs files to `dist/blog/` during build

### 3. Meta Tags Included

Each generated HTML file includes:

**Primary Meta Tags:**
- `<title>` - Post title + "| Permamind Blog"
- `<meta name="description">` - Post excerpt

**Open Graph (Facebook, Discord):**
- `og:type` - "article"
- `og:title` - Post title
- `og:description` - Post excerpt
- `og:image` - Hero image or default social preview
- `og:url` - Canonical URL
- `article:published_time` - Publication date
- `article:author` - Author name
- `article:tag` - Post tags

**Twitter Cards:**
- `twitter:card` - "summary_large_image"
- `twitter:title` - Post title
- `twitter:description` - Post excerpt
- `twitter:image` - Hero image or default

**SEO:**
- `<link rel="canonical">` - Canonical URL
- `<meta name="keywords">` - Tags + "Permamind, Claude, Agent Skills"
- `<meta name="author">` - Post author

## Adding a New Blog Post

To add a new blog post with social previews:

### 1. Add metadata to `src/data/blog-posts.ts`:

```typescript
{
  slug: 'my-new-post',
  title: 'My New Blog Post',
  date: '2025-11-13',
  author: 'Your Name',
  tags: ['tutorial', 'web3'],
  excerpt: 'A brief description for social media previews',
  readTime: 5,
  featured: false,
  heroImage: 'https://permamind.app/blog-images/my-post.png' // Optional
}
```

### 2. Create markdown file at `public/blog/my-new-post.md`

### 3. Update the script (if needed)

If you modify the blog post structure, update `scripts/generate-blog-html.ts` to include the new metadata in the HTML generation.

### 4. Build

Run `npm run build` - the script automatically generates the HTML file.

## Testing Social Previews

### Social Media Debuggers

Test your social previews using these tools:

1. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Enter: `https://permamind.app/blog/[slug].html`

2. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Enter: `https://permamind.app/blog/[slug].html`

3. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Enter: `https://permamind.app/blog/[slug].html`

4. **Discord**
   - Paste link in any Discord channel
   - Discord will auto-generate preview

### Local Testing

1. **Start preview server:**
   ```bash
   npm run preview
   ```

2. **View generated HTML:**
   ```bash
   open dist/blog/getting-started-with-permamind.html
   ```

3. **Inspect meta tags:**
   ```bash
   curl http://localhost:4173/blog/getting-started-with-permamind.html | grep "og:"
   ```

### Playwright Testing

The integration tests validate that blog posts render correctly:

```bash
npx playwright test tests/blog-pages.spec.ts
```

## Deployment

When deploying to Arweave via `npm run deploy`:

1. Build process generates HTML files
2. All files in `dist/` (including `dist/blog/*.html`) upload to Arweave
3. Social media crawlers fetch the static HTML (no JavaScript execution)
4. Human visitors get the full React app experience

## Custom Hero Images

To add custom social preview images per blog post:

### 1. Create an image:
- **Dimensions:** 1200x630px (Open Graph standard)
- **Format:** PNG or JPG
- **Size:** < 1MB recommended

### 2. Add to public folder:
```
frontend/public/blog-images/my-post-preview.png
```

### 3. Reference in metadata:
```typescript
{
  slug: 'my-post',
  // ... other fields
  heroImage: 'https://permamind.app/blog-images/my-post-preview.png'
}
```

### 4. Rebuild:
```bash
npm run build
```

## Fallback Behavior

- If no `heroImage` is specified, uses default: `https://permamind.app/social-preview.png`
- Crawlers see static HTML with meta tags
- Human visitors see React app with full interactivity

## Technical Details

### Why Static HTML?

Social media crawlers (Facebook, Twitter, Discord, LinkedIn) typically:
- Don't execute JavaScript
- Read meta tags from initial HTML response
- Timeout after a few seconds

React apps (SPA) without SSR/SSG don't provide meta tags to crawlers in time. Generating static HTML files ensures crawlers always see the correct meta tags.

### React Helmet Compatibility

The React app still uses `react-helmet-async` for:
- Client-side SEO updates
- Browser tab titles
- In-app meta tag management

The static HTML provides crawler support, while React Helmet provides runtime updates for users.

## Troubleshooting

### Social preview not updating

Social media platforms cache meta tags aggressively. To refresh:

1. **Twitter:** Use Card Validator to force re-scrape
2. **Facebook:** Use Sharing Debugger and click "Scrape Again"
3. **LinkedIn:** Use Post Inspector and click "Inspect"
4. **Discord:** Add `?v=2` query param to force refresh

### Wrong image showing

- Verify `heroImage` URL is absolute (includes `https://`)
- Check image exists and is accessible
- Image should be 1200x630px for best results
- Use `<8` compression for faster loading

### Meta tags not found

- Verify build ran successfully (`npm run build`)
- Check `dist/blog/[slug].html` exists
- Inspect HTML: `curl https://permamind.app/blog/[slug].html | grep "og:"`

## Additional Resources

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters)
