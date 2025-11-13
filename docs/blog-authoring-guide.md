# Blog Authoring Guide

This guide explains how to create and publish blog posts for the Permamind website.

## Table of Contents

- [Overview](#overview)
- [Blog Post Metadata](#blog-post-metadata)
- [Supported Markdown Features](#supported-markdown-features)
- [Blog Post Creation Workflow](#blog-post-creation-workflow)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Permamind blog posts consist of two parts:

1. **Metadata**: TypeScript object in `frontend/src/data/blog-posts.ts`
2. **Content**: Markdown file in `frontend/public/blog/{slug}.md`

The metadata is used for the blog listing page (filtering, search, preview cards), while the markdown file contains the full blog post content.

## Blog Post Metadata

### BlogPost Interface

```typescript
export interface BlogPost {
  slug: string;           // URL-friendly identifier (e.g., "getting-started")
  title: string;          // Post title (e.g., "Getting Started with Permamind")
  date: string;           // ISO date string (e.g., "2025-01-15")
  author: string;         // Author name (e.g., "Permamind Team")
  tags: string[];         // Category tags (e.g., ["tutorials", "getting-started"])
  excerpt: string;        // Short description (1-2 sentences, max 200 chars)
  readTime: number;       // Estimated reading time in minutes
  featured: boolean;      // Whether to pin to top of listing
}
```

### Metadata Fields

**slug** (required)
- URL-friendly identifier (lowercase, hyphens only)
- Used in post URL: `/blog/{slug}`
- Must be unique across all posts
- Example: `"getting-started-with-permamind"`

**title** (required)
- Display title for the post
- Keep concise (max 60 characters recommended)
- Used in preview cards and page title
- Example: `"Getting Started with Permamind"`

**date** (required)
- Publication date in ISO format: `YYYY-MM-DD`
- Used for sorting (newest first)
- Example: `"2025-01-15"`

**author** (required)
- Author name or team name
- Displayed in preview card
- Example: `"Permamind Team"` or `"John Doe"`

**tags** (required)
- Array of category tags for filtering
- Available tags: `tutorials`, `announcements`, `ao-protocol`, `arweave`, `cli`, `skills`, `guides`
- First 2 tags displayed in preview card
- Example: `["tutorials", "getting-started", "cli"]`

**excerpt** (required)
- Short description (1-2 sentences)
- Max 200 characters
- Displayed in preview card
- Used for search functionality
- Example: `"Learn how to install and publish your first skill to the Permamind registry using the CLI."`

**readTime** (required)
- Estimated reading time in minutes
- Calculate: ~200 words per minute
- Displayed in preview card
- Example: `5` (for a 1000-word post)

**featured** (required)
- Boolean flag to pin post to top of listing
- Featured posts appear first, then sorted by date
- Use for announcements, major releases
- Example: `true` or `false`

### Example Metadata Entry

```typescript
{
  slug: 'getting-started-with-permamind',
  title: 'Getting Started with Permamind',
  date: '2025-01-15',
  author: 'Permamind Team',
  tags: ['tutorials', 'getting-started', 'cli'],
  excerpt: 'Learn how to install and publish your first skill to the Permamind registry using the CLI.',
  readTime: 5,
  featured: true
}
```

## Supported Markdown Features

Permamind uses an enhanced MarkdownRenderer component (Story 14.1) with comprehensive markdown support and XSS protection via DOMPurify.

### Headers

```markdown
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header
```

### Text Formatting

```markdown
**Bold text**
*Italic text*
~~Strikethrough~~
`Inline code`
```

### Links

```markdown
[Link text](https://example.com)
[Link with title](https://example.com "Title text")
```

### Images

```markdown
![Alt text](https://example.com/image.png)
![Image with title](https://example.com/image.png "Image title")
```

### Lists

**Unordered:**
```markdown
- Item 1
- Item 2
  - Nested item
  - Another nested item
- Item 3
```

**Ordered:**
```markdown
1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
3. Third item
```

### Code Blocks

```markdown
\`\`\`javascript
function greet(name) {
  return `Hello, ${name}!`;
}
\`\`\`

\`\`\`typescript
interface User {
  name: string;
  email: string;
}
\`\`\`

\`\`\`bash
npm install permamind
permamind publish
\`\`\`
```

Supported languages include: javascript, typescript, python, bash, json, yaml, lua, markdown, and more.

### Blockquotes

```markdown
> This is a blockquote
>
> It can span multiple lines
```

### Horizontal Rules

```markdown
---
```

### Tables

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | Data     |
| Row 2    | Data     | Data     |
```

### Videos (YouTube Embeds)

```markdown
![Video title](https://www.youtube.com/watch?v=VIDEO_ID)
```

## Blog Post Creation Workflow

### Step 1: Add Metadata

1. Open `frontend/src/data/blog-posts.ts`
2. Add your blog post entry to the `blogPosts` array:

```typescript
export const blogPosts: BlogPost[] = [
  // ... existing posts ...
  {
    slug: 'your-new-post',
    title: 'Your New Post Title',
    date: '2025-01-20',
    author: 'Your Name',
    tags: ['tutorials', 'cli'],
    excerpt: 'Brief description of your post.',
    readTime: 7,
    featured: false
  }
];
```

### Step 2: Create Markdown File

1. Create a new file: `frontend/public/blog/your-new-post.md`
2. Write your blog post content using markdown
3. Follow the structure below:

```markdown
# Your Post Title

Brief introduction paragraph explaining what the post covers.

## Section 1: Main Topic

Content for first section...

### Subsection 1.1

More detailed content...

\`\`\`typescript
// Code examples
const example = "code";
\`\`\`

## Section 2: Next Topic

More content...

## Conclusion

Summary and next steps...
```

### Step 3: Test Locally

1. Start the development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:5173/blog`

3. Verify:
   - Post appears in listing (check featured/date sorting)
   - Tags filter correctly
   - Search finds your post
   - Preview card displays correctly
   - Markdown renders properly in detail view (Story 14.3)

### Step 4: Commit and Push

1. Add your changes:
   ```bash
   git add frontend/src/data/blog-posts.ts
   git add frontend/public/blog/your-new-post.md
   ```

2. Commit with descriptive message:
   ```bash
   git commit -m "Add blog post: Your New Post Title"
   ```

3. Push to repository:
   ```bash
   git push origin main
   ```

4. Deploy will happen automatically via CI/CD

## Best Practices

### Writing Tips

1. **Start with a strong hook**: First paragraph should grab attention
2. **Use clear section headers**: Help readers scan content
3. **Include code examples**: Show, don't just tell
4. **Add images/diagrams**: Visual aids improve understanding
5. **Keep paragraphs short**: 3-4 sentences max for readability
6. **End with clear next steps**: Guide readers to action

### Metadata Tips

1. **Write compelling excerpts**: This is what users see in search results
2. **Choose relevant tags**: Use existing tags for consistency
3. **Estimate read time accurately**: Count words, divide by 200
4. **Use featured sparingly**: Reserve for major announcements only
5. **Keep slugs consistent**: Use lowercase and hyphens

### Content Structure

1. **Introduction** (1-2 paragraphs): What problem does this solve?
2. **Prerequisites** (if applicable): What users need to know/install
3. **Main Content** (3-5 sections): Step-by-step instructions or explanations
4. **Examples** (throughout): Code snippets, screenshots, diagrams
5. **Conclusion** (1-2 paragraphs): Summary and next steps
6. **Resources** (optional): Links to related docs, tutorials

### Code Examples

1. **Always include syntax highlighting**: Use language identifier in code blocks
2. **Keep examples focused**: Show one concept at a time
3. **Add comments**: Explain what non-obvious code does
4. **Test all code**: Ensure examples actually work
5. **Provide context**: Explain what the code achieves

## Troubleshooting

### Post not appearing in listing

- **Check metadata**: Ensure entry added to `blog-posts.ts`
- **Verify slug**: Must match markdown filename (without `.md`)
- **Check date format**: Must be valid ISO date (`YYYY-MM-DD`)
- **Restart dev server**: Changes to TypeScript files require restart

### Search not finding post

- **Check title/excerpt**: Search only matches these fields
- **Verify case**: Search is case-insensitive but check for typos
- **Wait for debounce**: Search has 300ms delay

### Tags not filtering correctly

- **Use valid tags**: Check `AVAILABLE_TAGS` in `BlogListing.tsx`
- **Verify tag array**: Tags must be array of strings
- **Check spelling**: Tags are case-sensitive

### Markdown not rendering

- **Check file location**: Must be in `public/blog/` directory
- **Verify filename**: Must match slug exactly (lowercase, hyphens)
- **Test markdown syntax**: Use online markdown editor to validate
- **Check for special characters**: Escape special markdown characters

### Images not loading

- **Use absolute URLs**: Relative paths may not work
- **Check image URLs**: Verify URLs are accessible
- **Use HTTPS**: Avoid mixed content warnings
- **Add alt text**: Required for accessibility

### Code blocks not highlighting

- **Specify language**: Use language identifier after opening backticks
- **Check language support**: Verify language is supported by highlighter
- **Escape backticks**: Use backslash if code contains backticks
- **Remove extra spaces**: No spaces between backticks and language

---

For questions or issues, please contact the Permamind team or open an issue on [GitHub](https://github.com/ALLiDoizCode/Permamind).

**Related Documentation:**
- [MarkdownRenderer Component](../frontend/src/components/MarkdownRenderer.tsx) (Story 14.1)
- [Blog Listing Page](../frontend/src/pages/BlogListing.tsx) (Story 14.2)
- [Test Markdown Samples](../frontend/test-markdown-samples.md)
