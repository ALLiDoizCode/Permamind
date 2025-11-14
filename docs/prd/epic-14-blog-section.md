# Epic 14: Blog Section - Brownfield Enhancement

**Epic Goal:**
Add a blog section to the Permamind frontend that enables the team to publish educational content, tutorials, and announcements. The blog will render markdown content with support for media embeds and external links while maintaining the existing terminal dark theme and design system. By the end of this epic, users can browse blog posts, view individual articles with rich markdown rendering, and the team has a streamlined content authoring workflow.

## Existing System Context

- **Current Frontend:** React + TypeScript with React Router v6
- **Technology Stack:** Vite, Tailwind CSS, shadcn-ui components
- **Design System:** Terminal dark theme (`#10151B` background, Inter font)
- **Existing Markdown Rendering:** `MarkdownRenderer` component with basic support (headers, bold, inline code, paragraphs)
- **Routing:** Lazy-loaded routes with code splitting
- **Current Pages:** Home, Search, Skill Detail, Documentation, CLI Guide, MCP Guide, Publish, Not Found

## Enhancement Details

**What's Being Added:**
- Blog section with listing page (`/blog`)
- Individual post pages (`/blog/:slug`)
- Enhanced markdown rendering with media/link support
- Blog content management via markdown files (no database required)

**How It Integrates:**
- New routes added to existing React Router configuration
- Reuses existing `MarkdownRenderer` component (enhanced)
- Follows existing layout patterns (Header, Footer, Breadcrumbs, ScrollToTop)
- Maintains terminal dark theme consistency

**Success Criteria:**
- Blog posts render markdown with images, videos, and external links
- Blog listing page displays posts with metadata (title, date, author, excerpt)
- Individual post pages support full markdown features
- All pages maintain existing terminal dark theme consistency
- Blog content stored as markdown files in version control
- >90% test coverage for new components
- All existing tests continue to pass (no regressions)

## Compatibility Requirements

- ✅ Existing APIs remain unchanged (no backend API changes)
- ✅ Database schema changes are backward compatible (no database - file-based markdown)
- ✅ UI changes follow existing patterns (terminal dark theme, shadcn-ui components)
- ✅ Performance impact is minimal (lazy loading, code splitting maintained)

## Risk Mitigation

**Primary Risk:** Markdown XSS vulnerabilities from malicious blog content

**Mitigation:**
- Extend existing `sanitizeHtml` function to cover new features
- Implement Content Security Policy headers
- Use DOMPurify library for robust HTML sanitization
- Manual review process for all blog posts before publication
- All blog content stored in version control (Git review process)

**Rollback Plan:**
- Remove `/blog` routes from router configuration
- Delete blog page components
- Revert `MarkdownRenderer` changes if issues arise
- No database rollback needed (file-based content)

## Definition of Done

- [ ] All stories completed with acceptance criteria met
- [ ] Existing functionality verified through testing (all regression tests pass)
- [ ] Integration points working correctly (routing, navigation, components)
- [ ] Documentation updated appropriately (README with blog authoring guide)
- [ ] No regression in existing features (100% existing test pass rate)
- [ ] New features have >90% test coverage
- [ ] Blog content authoring guide created for team
- [ ] At least 2 sample blog posts published to demonstrate functionality

---

## Story 14.1: Enhance MarkdownRenderer for Media and Links

**As a** frontend developer,
**I want** to extend the MarkdownRenderer component to support images, videos, and links,
**So that** blog posts can include rich media content and external references.

**Acceptance Criteria:**

### Core Markdown Features
1. **External Links:**
   - Render markdown links: `[text](url)` as `<a>` tags
   - Apply terminal-themed styling: `text-syntax-cyan hover:text-syntax-purple`
   - Add `target="_blank"` and `rel="noopener noreferrer"` for external links
   - Add external link icon (↗) after link text
   - Internal links (starting with `/`) open in same tab

2. **Images:**
   - Render markdown images: `![alt text](url)` as `<img>` tags
   - Implement lazy loading: `loading="lazy"` attribute
   - Add responsive sizing: `max-w-full h-auto` classes
   - Center images with `mx-auto` class
   - Add terminal-themed border: `border border-terminal-border rounded-lg`
   - Show alt text as caption below image in `text-terminal-muted text-sm`
   - Handle broken images gracefully with fallback placeholder

3. **Video Embeds:**
   - Support YouTube embed syntax: `![video](https://youtube.com/watch?v=ID)`
   - Support Vimeo embed syntax: `![video](https://vimeo.com/ID)`
   - Convert to responsive iframe with 16:9 aspect ratio
   - Add `aspect-video` wrapper div
   - Allow raw HTML iframe embeds (sanitized)

4. **Lists:**
   - Render unordered lists: `- item` or `* item`
   - Render ordered lists: `1. item`
   - Apply terminal-themed styling: `text-terminal-muted`
   - Add proper indentation: `ml-6 space-y-2`
   - Support nested lists (2 levels deep)
   - Use custom bullet styles: `list-disc` for unordered, `list-decimal` for ordered

5. **Blockquotes:**
   - Render blockquotes: `> text`
   - Apply terminal-themed styling: `border-l-4 border-syntax-cyan bg-terminal-surface`
   - Add padding: `pl-4 py-2 my-4`
   - Italic text: `italic text-terminal-muted`

6. **Code Blocks:**
   - Render fenced code blocks: ` ```language ... ``` `
   - Apply syntax-highlighted background: `bg-terminal-bg`
   - Add terminal-border: `border border-terminal-border rounded-lg`
   - Include language label badge in top-right corner
   - Add copy button in top-right corner (reuse existing CopyButton component)
   - Support common languages: javascript, typescript, bash, lua, python, json

### Security & Performance
7. **XSS Protection:**
   - Install DOMPurify library: `npm install dompurify @types/dompurify`
   - Replace custom `sanitizeHtml` function with DOMPurify.sanitize()
   - Configure allowed tags: `a, img, h1, h2, h3, p, strong, em, code, pre, ul, ol, li, blockquote, iframe`
   - Configure allowed attributes: `href, src, alt, title, class, target, rel, width, height`
   - Whitelist iframe domains: `youtube.com, vimeo.com`

8. **Performance:**
   - Memoize markdown parsing with `useMemo` hook (already implemented)
   - Lazy load images with `loading="lazy"` attribute
   - Add `will-change: transform` for smooth hover animations

### Testing
9. **Unit Tests:**
   - Test external link rendering with correct attributes
   - Test internal link rendering (no `target="_blank"`)
   - Test image rendering with alt text and lazy loading
   - Test YouTube video embed conversion
   - Test Vimeo video embed conversion
   - Test unordered list rendering
   - Test ordered list rendering
   - Test nested list rendering
   - Test blockquote styling
   - Test code block rendering with syntax highlighting
   - Test XSS attack vectors are sanitized (script tags, event handlers)
   - Test broken image handling

10. **Regression Testing:**
    - Verify existing markdown features still work (headers, bold, paragraphs, inline code)
    - Run full existing test suite to ensure no breaking changes

### Documentation
11. **Component Documentation:**
    - Update MarkdownRenderer component JSDoc comments
    - Add supported markdown syntax examples to component file
    - Document DOMPurify configuration and security considerations

---

## Story 14.2: Create Blog Listing Page

**As a** developer exploring Permamind content,
**I want** to browse a list of blog posts with filtering and search,
**So that** I can discover educational articles and tutorials.

**Acceptance Criteria:**

### Page Structure
1. **Route Configuration:**
   - Add `/blog` route to `src/routes/index.tsx`
   - Implement lazy loading: `const BlogListing = lazy(() => import('@/pages/BlogListing'))`
   - Add route to Routes: `<Route path="/blog" element={<BlogListing />} />`

2. **BlogListing Component:**
   - Create `src/pages/BlogListing.tsx` component
   - Implement responsive layout: Header → Hero → Filters → Post Grid → Footer
   - Use existing Header and Footer components
   - Add page title: "// blog_posts" with syntax-purple comment styling
   - Add subtitle: "Tutorials, guides, and announcements from the Permamind team"

3. **Blog Post Data Management:**
   - Create `src/data/blog-posts.ts` with blog post metadata array
   - Blog post interface: `{ slug: string, title: string, date: string, author: string, tags: string[], excerpt: string, readTime: number, featured: boolean }`
   - Create `public/blog/` directory for markdown files
   - Each blog post stored as: `public/blog/{slug}.md`
   - Load blog post content dynamically via fetch API when needed

### Blog Post Cards
4. **BlogPostCard Component:**
   - Create `src/components/BlogPostCard.tsx` reusing SkillCard patterns
   - Card layout: Terminal-themed with gradient border on hover
   - Display: Title (text-lg font-semibold), Date (text-sm text-terminal-muted), Author, Tags (Badge components), Excerpt (text-terminal-muted, 2-line clamp)
   - Add reading time indicator: "5 min read" badge
   - Add hover effect: border gradient animation (reuse from SkillCard)
   - Click card to navigate to `/blog/{slug}`

5. **Post Grid Layout:**
   - Implement responsive grid: 3-column (desktop), 2-column (tablet), 1-column (mobile)
   - Use Tailwind grid classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
   - Sort posts by date (newest first) by default
   - Show featured posts first (pinned to top)

### Filtering & Search
6. **Tag Filtering:**
   - Create filter bar with terminal-themed badge buttons
   - Tags: "tutorials", "announcements", "ao-protocol", "arweave", "cli", "skills", "guides"
   - Active filter badge styled with `bg-syntax-cyan` background
   - Click tag to filter posts (client-side filtering)
   - Show "Clear filters" button when filters active

7. **Search Functionality:**
   - Reuse existing SearchBar component
   - Search placeholder: "search blog posts --query tutorials"
   - Search filters posts by title and excerpt (case-insensitive)
   - Debounce search input: 300ms (use useDebounce hook or setTimeout)
   - Show "No posts found" message when search/filter returns empty

### Loading & Error States
8. **Loading State:**
   - Use LoadingSkeleton component for card placeholders
   - Show 6 skeleton cards while loading blog metadata
   - Maintain consistent layout during loading

9. **Error Handling:**
   - Add ErrorBoundary wrapper around BlogListing component
   - Show error message if blog data fails to load
   - Provide "Retry" button to reload data

### Testing
10. **Unit Tests:**
    - Test BlogPostCard renders all metadata correctly
    - Test tag filtering updates displayed posts
    - Test search functionality filters posts correctly
    - Test "Clear filters" button resets to all posts
    - Test responsive grid layout at breakpoints
    - Test navigation to blog post detail page on card click

11. **Integration Tests:**
    - Test blog listing page loads successfully
    - Test blog post data loads from JSON
    - Test error handling when blog data fails to load

12. **Playwright E2E Tests:**
    - Navigate to `/blog` → verify page loads
    - Click tag filter → verify posts filtered
    - Type in search bar → verify search results update
    - Click blog post card → navigate to detail page
    - Test responsive behavior on mobile/tablet/desktop viewports

### Documentation
13. **Content Authoring Guide:**
    - Create `docs/blog-authoring-guide.md`
    - Document blog post metadata format
    - Document supported markdown features
    - Provide example blog post template
    - Document how to add new blog posts (add to blog-posts.ts, create .md file)

---

## Story 14.3: Create Blog Post Detail Page

**As a** reader,
**I want** to view individual blog posts with full markdown rendering and metadata,
**So that** I can read educational content with rich media and navigation.

**Acceptance Criteria:**

### Page Structure
1. **Route Configuration:**
   - Add `/blog/:slug` route to `src/routes/index.tsx`
   - Implement lazy loading: `const BlogPost = lazy(() => import('@/pages/BlogPost'))`
   - Add route: `<Route path="/blog/:slug" element={<BlogPost />} />`
   - Route parameter: `slug` matches blog post filename

2. **BlogPost Component:**
   - Create `src/pages/BlogPost.tsx` component
   - Use `useParams()` hook to get slug from URL
   - Fetch blog post metadata from `blog-posts.ts` array
   - Fetch markdown content from `public/blog/{slug}.md`
   - Implement layout: Header → Breadcrumbs → Article Header → Markdown Content → Social Share → Related Posts → Footer

3. **Navigation:**
   - Add Breadcrumbs component: Home > Blog > {Post Title}
   - Reuse existing Breadcrumbs component
   - Add ScrollToTop component (reuse existing)
   - Add "← Back to Blog" link above article

### Article Header
4. **Post Metadata Display:**
   - Display post title: `text-3xl font-bold text-terminal-text mb-4`
   - Display author and date: "By {author} • {date} • {readTime} min read"
   - Display tags as clickable Badge components (link to filtered blog listing)
   - Add terminal-border divider below metadata

5. **Hero Image (Optional):**
   - Support optional hero image in blog post frontmatter: `heroImage: /blog/images/{slug}-hero.jpg`
   - Display hero image below title if present
   - Apply responsive sizing: `w-full max-h-96 object-cover`
   - Add terminal-border: `border border-terminal-border rounded-lg`

### Content Rendering
6. **Markdown Content:**
   - Use enhanced MarkdownRenderer component for full content
   - Apply article prose styling: `prose prose-invert max-w-none`
   - Set readable line width: `max-w-3xl mx-auto`
   - Add proper spacing: `py-8`

7. **Table of Contents (Optional):**
   - Parse markdown headings to generate TOC
   - Display sticky TOC on right side (desktop only)
   - Auto-highlight current section on scroll
   - Smooth scroll to heading on click
   - Hide TOC on mobile/tablet (screen < 1024px)

### Social Sharing
8. **Share Buttons:**
   - Create ShareButtons component
   - Buttons: Twitter, LinkedIn, Copy Link
   - Use shadcn-ui Button component with icon-only variant
   - Twitter share: `https://twitter.com/intent/tweet?url={url}&text={title}`
   - LinkedIn share: `https://www.linkedin.com/sharing/share-offsite/?url={url}`
   - Copy link: Copy current URL to clipboard with success toast
   - Position: Fixed bottom-right on desktop, below article on mobile

### Related Posts
9. **Related Posts Section:**
   - Display 3 related posts at bottom of article
   - Match by tags (most overlapping tags shown first)
   - Use BlogPostCard component (smaller variant)
   - Section heading: "// related_posts" with syntax-purple styling
   - Horizontal scroll on mobile (overflow-x-auto)

### Loading & Error States
10. **Loading State:**
    - Show LoadingSkeleton while fetching blog post data
    - Skeleton matches article layout (title, metadata, content blocks)

11. **Error Handling:**
    - Handle 404 when blog post slug not found
    - Display error message: "Blog post not found"
    - Provide link to return to blog listing
    - ErrorBoundary catches markdown parsing errors

### Performance
12. **Optimization:**
    - Prefetch blog post markdown when hovering over BlogPostCard
    - Cache blog post content in memory (React state or Context)
    - Lazy load related posts (not critical path)
    - Optimize images in blog posts (use WebP format where possible)

### Testing
13. **Unit Tests:**
    - Test BlogPost component renders metadata correctly
    - Test markdown content renders with enhanced MarkdownRenderer
    - Test ShareButtons copy link functionality
    - Test related posts display correctly
    - Test 404 handling for invalid slug

14. **Integration Tests:**
    - Test blog post loads markdown content from public directory
    - Test navigation from blog listing to detail page
    - Test breadcrumbs navigation works correctly
    - Test ScrollToTop activates on page load

15. **Playwright E2E Tests:**
    - Navigate to blog post detail page via listing
    - Verify all metadata displays correctly
    - Verify markdown content renders with media (images, videos, links)
    - Click share button → verify copy to clipboard
    - Click related post → navigate to that post
    - Test responsive behavior (mobile/tablet/desktop)
    - Test 404 error page for invalid slug

### SEO & Metadata
16. **Meta Tags:**
    - Add dynamic `<title>` tag: `{Post Title} | Permamind Blog`
    - Add meta description from post excerpt
    - Add Open Graph tags for social media previews
    - Add Twitter Card tags
    - Add canonical URL

### Documentation
17. **Developer Documentation:**
    - Update README.md with blog section overview
    - Document how to create new blog posts
    - Document markdown features supported
    - Provide troubleshooting guide for common issues

---

## Story Manager Handoff

**Please develop detailed implementation plans for these user stories. Key considerations:**

- This is an enhancement to an existing React + TypeScript frontend running **Vite, React Router v6, Tailwind CSS, and shadcn-ui components**
- **Integration points:**
  - React Router: Add `/blog` and `/blog/:slug` routes to `src/routes/index.tsx`
  - MarkdownRenderer component: Enhance existing `src/components/MarkdownRenderer.tsx`
  - Layout components: Reuse Header, Footer, Breadcrumbs, ScrollToTop
  - Design system: Terminal dark theme (`#10151B` background, `#1a1f26` surface, `#e2e8f0` text)
- **Existing patterns to follow:**
  - Lazy-loaded routes with code splitting (see existing route pattern in `src/routes/index.tsx`)
  - shadcn-ui components (button, card, badge, tabs, input)
  - LoadingSkeleton for loading states
  - ErrorBoundary for error handling
  - Test organization: `__tests__/` directories with Jest + React Testing Library
  - Playwright E2E tests in `frontend/src/__tests__/` directories
- **Critical compatibility requirements:**
  - XSS protection: Use DOMPurify for HTML sanitization
  - No database: Blog content stored as markdown files in `public/blog/` directory
  - Maintain existing test coverage standards (>90%)
  - Each story must include regression testing to verify existing functionality remains intact

The epic should maintain system integrity while delivering a blog section that enables educational content, tutorials, and announcements with full markdown media/link support.

---

## Sample Blog Post Template

Create this as `docs/blog-post-template.md`:

```markdown
---
slug: sample-blog-post
title: Sample Blog Post Title
date: 2025-11-12
author: Your Name
tags: [tutorials, ao-protocol, skills]
excerpt: A brief 1-2 sentence description of the blog post that appears in the listing page.
readTime: 5
featured: false
heroImage: /blog/images/sample-hero.jpg
---

# Sample Blog Post Title

Your introduction paragraph goes here. This should hook the reader and explain what they'll learn.

## Section 1: Getting Started

Your content here with **bold text** and *italic text*.

### Subsection

- Bullet point one
- Bullet point two
- Bullet point three

## Section 2: Code Examples

Here's how to do something:

```typescript
import { example } from '@permamind/skills';

const result = example.doSomething();
console.log(result);
```

## Section 3: Images and Media

![Alt text for the image](https://example.com/image.jpg)

You can also embed videos:

![video](https://youtube.com/watch?v=VIDEO_ID)

## Conclusion

Wrap up your post with key takeaways and next steps.

[Learn more about Permamind →](/docs)
```

---

## Next Steps for Development

1. **Story 14.1** - Start with MarkdownRenderer enhancements and DOMPurify integration
2. **Story 14.2** - Build blog listing page after MarkdownRenderer is enhanced
3. **Story 14.3** - Implement blog post detail page last (depends on 14.1 and 14.2)

Each story should be developed in a feature branch and merged via pull request with full test coverage before moving to the next story.
