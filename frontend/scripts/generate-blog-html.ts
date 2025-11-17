/**
 * Generate Static HTML Files for Blog Posts
 *
 * Creates individual HTML files for each blog post with proper meta tags
 * for social media sharing (Open Graph, Twitter Cards, etc.)
 *
 * This script runs during the build process to ensure social media crawlers
 * can read the proper meta tags without executing JavaScript.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import blog posts metadata
interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  tags: string[];
  excerpt: string;
  readTime: number;
  featured?: boolean;
  heroImage?: string;
}

// Manually define blog posts here (or import from compiled JS)
const blogPosts: BlogPost[] = [
  {
    slug: 'getting-started-with-permamind',
    title: 'Getting Started with Permamind',
    date: '2025-11-12',
    author: 'Permamind Team',
    tags: ['tutorials', 'getting-started', 'cli'],
    excerpt: 'Learn how to install and publish your first skill to the Permamind registry using the CLI.',
    readTime: 3,
    featured: true,
    heroImage: '/blog-images/getting-started-with-permamind.png',
  },
  {
    slug: 'using-permamind-mcp-server',
    title: 'Using the Permamind MCP Server',
    date: '2025-11-12',
    author: 'Permamind Team',
    tags: ['tutorials', 'mcp'],
    excerpt: 'Set up and use the Permamind MCP Server to publish, search, and install skills directly from Claude Desktop.',
    readTime: 5,
    featured: true,
    heroImage: '/blog-images/using-permamind-mcp-server.png',
  },
  {
    slug: 'understanding-permamind-architecture',
    title: "Understanding Permamind's Architecture",
    date: '2025-11-12',
    author: 'Permamind Team',
    tags: ['architecture', 'arweave'],
    excerpt: 'Learn how Permamind uses Arweave and AO networks to create a permanent, decentralized registry for Claude Code skills.',
    readTime: 6,
    featured: false,
    heroImage: '/blog-images/understanding-permamind-architecture.png',
  },
  {
    slug: 'permaweb-mcp-guide',
    title: 'Permaweb-MCP: Your Gateway to AO and Arweave Development',
    date: '2025-11-16',
    author: 'Permamind Team',
    tags: ['mcp', 'arweave', 'ao'],
    excerpt: 'Transform how you interact with AO and Arweave through natural language. Deploy apps, manage processes, and register domains with Claude AI.',
    readTime: 8,
    featured: true,
    heroImage: '/blog-images/permaweb-mcp-guide.png',
  },
];

// Use environment variable for base URL, fallback to production (ar.io gateway)
const baseUrl = process.env.VITE_BASE_URL || process.env.BASE_URL || 'https://permamind.ar.io';
const defaultImage = `${baseUrl}/social-preview.png`;

console.log(`📍 Using base URL: ${baseUrl}`);

/**
 * Generate HTML template for a blog post
 */
function generateBlogPostHTML(post: BlogPost, mainScriptSrc: string, mainCssLink: string): string {
  const ogImage = post.heroImage ? `${baseUrl}${post.heroImage}` : defaultImage;
  const canonicalUrl = `${baseUrl}/blog/${post.slug}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/twitter-profile.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Main CSS -->
    ${mainCssLink}

    <!-- Primary Meta Tags -->
    <title>${post.title} | Permamind Blog</title>
    <meta name="title" content="${post.title} | Permamind Blog" />
    <meta name="description" content="${post.excerpt}" />

    <!-- Canonical URL -->
    <link rel="canonical" href="${canonicalUrl}" />

    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:title" content="${post.title}" />
    <meta property="og:description" content="${post.excerpt}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:site_name" content="Permamind" />
    <meta property="article:published_time" content="${post.date}T00:00:00Z" />
    <meta property="article:author" content="${post.author}" />
    <meta property="article:tag" content="${post.tags.join(', ')}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@permamind" />
    <meta name="twitter:creator" content="@permamind" />
    <meta name="twitter:title" content="${post.title}" />
    <meta name="twitter:description" content="${post.excerpt}" />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:image:alt" content="${post.title} - ${post.excerpt}" />

    <!-- Additional Meta -->
    <meta name="keywords" content="Permamind, Claude, Agent Skills, ${post.tags.join(', ')}" />
    <meta name="author" content="${post.author}" />
    <meta name="theme-color" content="#6ee7b7" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

    <!-- Client-side routing hint and URL cleanup -->
    <script>
      // For human visitors, the React app will take over routing
      // Social media crawlers will see the meta tags above
      window.__BLOG_POST_SLUG__ = '${post.slug}';

      // Redirect to clean URL for better user experience
      // Only if .html is in the URL (not for crawlers using og:url)
      if (window.location.pathname.endsWith('.html') && !navigator.userAgent.match(/bot|crawler|spider|crawling|facebookexternalhit|twitterbot/i)) {
        const cleanPath = window.location.pathname.replace(/\.html$/, '');
        window.history.replaceState({}, '', cleanPath + window.location.search + window.location.hash);
      }
    </script>
  </head>
  <body>
    <div id="root">
      <!-- Fallback content for crawlers -->
      <article>
        <header>
          <h1>${post.title}</h1>
          <p>By ${post.author} • ${post.date} • ${post.readTime} min read</p>
        </header>
        <section>
          <p>${post.excerpt}</p>
          <p><a href="${canonicalUrl}">Read full article →</a></p>
        </section>
      </article>
    </div>
    ${mainScriptSrc}
  </body>
</html>`;
}

/**
 * Main function to generate all blog post HTML files
 */
function generateBlogHTMLFiles() {
  const distDir = path.resolve(__dirname, '../dist');
  const blogDir = path.join(distDir, 'blog');

  // Read main index.html to extract the script and CSS tags
  const indexPath = path.join(distDir, 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf-8');

  const scriptMatch = indexHtml.match(/<script[^>]*src="[^"]+\.js"[^>]*><\/script>/);
  if (!scriptMatch) {
    throw new Error('Could not find script tag in index.html');
  }

  const cssMatch = indexHtml.match(/<link rel="stylesheet"[^>]*href="\/assets\/[^"]+\.css"[^>]*>/);
  if (!cssMatch) {
    throw new Error('Could not find CSS link tag in index.html');
  }

  const mainScriptSrc = scriptMatch[0];
  const mainCssLink = cssMatch[0];

  console.log(`📦 Found main script: ${mainScriptSrc}`);
  console.log(`🎨 Found main CSS: ${mainCssLink}\n`);

  // Ensure blog directory exists
  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  console.log(`🚀 Generating static HTML files for ${blogPosts.length} blog posts...\n`);

  blogPosts.forEach((post) => {
    const html = generateBlogPostHTML(post, mainScriptSrc, mainCssLink);
    const htmlPath = path.join(blogDir, `${post.slug}.html`);

    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`✅ Generated: /blog/${post.slug}.html`);
  });

  console.log(`\n✨ Successfully generated ${blogPosts.length} blog post HTML files!\n`);
}

// Run the script
generateBlogHTMLFiles();
