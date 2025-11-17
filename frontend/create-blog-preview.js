import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate static social preview image for blog post
 * Same retro terminal style as skill-gif command
 */
async function createBlogPreview(blogPost) {
    console.log(`\n🎨 Creating social preview for: ${blogPost.title}`);

    // Create HTML template with terminal styling
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blogPost.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            background: #000;
            font-family: 'VT323', 'Share Tech Mono', monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
        }

        .terminal {
            width: 1200px;
            height: 630px;
            background: #0a0e0f;
            border-radius: 16px;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Scanlines effect */
        .terminal::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.15) 0px,
                rgba(0, 0, 0, 0.15) 1px,
                transparent 1px,
                transparent 2px
            );
            pointer-events: none;
            z-index: 10;
        }

        /* CRT glow */
        .terminal::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(51, 255, 0, 0.02);
            pointer-events: none;
            z-index: 9;
        }

        .terminal-body {
            flex: 1;
            padding: 40px;
            color: #33ff00;
            font-size: 20px;
            line-height: 1.5;
            position: relative;
            overflow: hidden;
        }

        .ascii-border {
            border: 3px solid #33ff00;
            padding: 40px;
            margin: 80px auto 80px auto;
            max-width: 1000px;
            text-align: center;
            background: rgba(0, 0, 0, 0.3);
        }

        .ascii-icon {
            margin-bottom: 25px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .ascii-icon img {
            width: 80px;
            height: 80px;
            filter: brightness(0) saturate(100%) invert(76%) sepia(89%) saturate(1514%) hue-rotate(54deg) brightness(103%) contrast(106%);
        }

        .terminal-line {
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 40px;
        }

        .title-line {
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 2px;
            text-shadow: 0 0 15px rgba(51, 255, 0, 0.7);
            color: #33ff00;
            line-height: 1.3;
            max-width: 900px;
            margin: 0 auto 20px;
        }

        .desc-line {
            font-size: 28px;
            color: #88ff88;
            max-width: 900px;
            margin: 20px auto 0;
            line-height: 1.4;
        }

        .tag-line {
            font-size: 24px;
            color: #00ffff;
            margin-top: 25px;
            letter-spacing: 1px;
        }

        .bottom-brand {
            position: absolute;
            bottom: 80px;
            left: 40px;
            font-size: 20px;
            color: #33ff00;
            opacity: 0.9;
        }

        /* Border decoration */
        .corner {
            position: absolute;
            color: #33ff00;
            font-size: 24px;
        }

        .corner.tl { top: 10px; left: 10px; }
        .corner.tr { top: 10px; right: 10px; }
        .corner.bl { bottom: 10px; left: 10px; }
        .corner.br { bottom: 10px; right: 10px; }
    </style>
</head>
<body>
    <div class="terminal">
        <div class="terminal-body">
            <div class="ascii-border">
                <div class="corner tl">╔</div>
                <div class="corner tr">╗</div>
                <div class="corner bl">╚</div>
                <div class="corner br">╝</div>

                <div class="ascii-icon">
                    <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxnPgo8IS0tIE91dGVyIHNxdWFyZSAtLT4KPHBhdGggZD0iTTEwMCA3MEwzMDAgNzBMMzAwIDMzMEwxMDAgMzMwWiIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjEuNSIgZmlsbD0ibm9uZSIvPgoKPCEtLSBJbm5lciBzcXVhcmUgLS0+CjxwYXRoIGQ9Ik03NSAxMDVMMzI1IDEwNUwzMjUgMjk1TDc1IDI5NVoiIHN0cm9rZT0iIzMzMzMzMyIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz4KCjwhLS0gQ2VudGVyIHN0YXIgcG9pbnRzIC0tPgo8cGF0aCBkPSJNMjAwIDcwTDIwMCAzMzBNNzUgMjAwTDMyNSAyMDBNMTAwIDEwNUwzMDAgMjk1TTMwMCAxMDVMMTAwIDI5NU0xNTAgNzBMMjUwIDMzME0zMjUgMTUwTDc1IDI1ME0yNTAgNzBMMTUwIDMzME03NSAxNTBMMzI1IDI1MCIgc3Ryb2tlPSIjMzMzMzMzIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNyIvPgoKPCEtLSBJbm5lciBjcm9zc2VzIC0tPgo8cGF0aCBkPSJNMTUwIDEwNUwyNTAgMjk1TTI1MCAxMDVMMTUwIDI5NU0xMDAgMTUwTDMwMCAyNTBNMzAwIDE1MEwxMDAgMjUwIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC42Ii8+Cgo8IS0tIENlbnRlciBwb2ludHMgLS0+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjIwMCIgcj0iMyIgZmlsbD0iIzMzMzMzMyIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSI3MCIgcj0iMi41IiBmaWxsPSIjMzMzMzMzIi8+CjxjaXJjbGUgY3g9IjIwMCIgY3k9IjMzMCIgcj0iMi41IiBmaWxsPSIjMzMzMzMzIi8+CjxjaXJjbGUgY3g9Ijc1IiBjeT0iMjAwIiByPSIyLjUiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iMzI1IiBjeT0iMjAwIiByPSIyLjUiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTA1IiByPSIyIiBmaWxsPSIjMzMzMzMzIi8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjEwNSIgcj0iMiIgZmlsbD0iIzMzMzMzMyIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSIyOTUiIHI9IjIiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iMzAwIiBjeT0iMjk1IiByPSIyIiBmaWxsPSIjMzMzMzMzIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjE1MCIgcj0iMiIgZmlsbD0iIzMzMzMzMyIvPgo8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxNTAiIHI9IjIiIGZpbGw9IiMzMzMzMzMiLz4KPGNpcmNsZSBjeD0iMTUwIiBjeT0iMjUwIiByPSIyIiBmaWxsPSIjMzMzMzMzIi8+CjxjaXJjbGUgY3g9IjI1MCIgY3k9IjI1MCIgcj0iMiIgZmlsbD0iIzMzMzMzMyIvPgo8L2c+Cjwvc3ZnPg==" alt="Blog Icon"/>
                </div>

                <div class="terminal-line title-line">
                    ${blogPost.title}
                </div>

                <div class="terminal-line desc-line">
                    ${blogPost.excerpt}
                </div>

                <div class="terminal-line tag-line">
                    ${blogPost.tags.map(tag => `#${tag}`).join(' ')}
                </div>
            </div>

            <div class="bottom-brand">
                PERMAMIND // ${blogPost.date} // ${blogPost.readTime} min read
            </div>
        </div>
    </div>
</body>
</html>`;

    // Launch browser
    const browser = await chromium.launch({
        headless: true
    });

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 630 });

    // Load HTML
    await page.setContent(html, { waitUntil: 'networkidle' });

    // Take screenshot
    const outputPath = path.join(__dirname, 'public', 'blog-images', `${blogPost.slug}.png`);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    await page.screenshot({
        path: outputPath,
        type: 'png'
    });

    await browser.close();

    console.log(`✅ Created: ${outputPath}`);
    console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB\n`);

    return outputPath;
}

// Blog posts data
const blogPosts = [
    {
        slug: 'getting-started-with-permamind',
        title: 'Getting Started with Permamind',
        date: '2025-11-12',
        tags: ['tutorials', 'getting-started', 'cli'],
        excerpt: 'Learn how to install and publish your first skill to the Permamind registry using the CLI.',
        readTime: 3,
    },
    {
        slug: 'using-permamind-mcp-server',
        title: 'Using the Permamind MCP Server',
        date: '2025-11-12',
        tags: ['tutorials', 'mcp'],
        excerpt: 'Set up and use the Permamind MCP Server to publish, search, and install skills directly from Claude Desktop.',
        readTime: 5,
    },
    {
        slug: 'understanding-permamind-architecture',
        title: "Understanding Permamind's Architecture",
        date: '2025-11-12',
        tags: ['architecture', 'arweave'],
        excerpt: 'Learn how Permamind uses Arweave and AO networks to create a permanent, decentralized registry for Claude Code skills.',
        readTime: 6,
    },
    {
        slug: 'permaweb-mcp-guide',
        title: 'Permaweb-MCP: Your Gateway to AO and Arweave Development',
        date: '2025-11-16',
        tags: ['mcp', 'arweave', 'ao-protocol', 'tutorials'],
        excerpt: 'Transform how you interact with AO and Arweave through natural language. Deploy apps, manage processes, and register domains with Claude AI.',
        readTime: 8,
    },
];

// Generate all previews
async function generateAll() {
    console.log('🚀 Generating blog post social preview images...\n');

    for (const post of blogPosts) {
        await createBlogPreview(post);
    }

    console.log('✨ All blog preview images generated successfully!\n');
}

generateAll().catch(console.error);
