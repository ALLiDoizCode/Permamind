# Visual Asset Generation Guide

This guide helps you generate high-quality screenshots from the HTML files for use in the X thread campaign.

## 🎨 Quick Start

### Method 1: Browser Screenshots (Recommended)

**For macOS:**
```bash
# Open HTML files in browser
open images/01-hero.html
open images/02-problem.html
# ... etc

# Use built-in screenshot (Cmd+Shift+4, then Space)
# Or use Safari/Chrome dev tools
```

**For Windows:**
```bash
# Open in browser
start images/01-hero.html

# Use Snipping Tool (Win+Shift+S)
# Or browser dev tools
```

**For Linux:**
```bash
# Open in browser
xdg-open images/01-hero.html

# Use GNOME Screenshot or scrot
gnome-screenshot -w
```

### Method 2: Automated with Playwright (Recommended for Batch)

We can use the Playwright MCP server to generate all screenshots automatically!

```bash
# Navigate to each page and take screenshots
# (Examples below using Playwright tools)
```

## 📐 Optimal Dimensions

Twitter/X recommends these dimensions for best display:

| Type | Dimensions | Aspect Ratio | Use Case |
|------|-----------|--------------|----------|
| **Standard Tweet Image** | 1200×675 | 16:9 | Main thread images |
| **Square Image** | 1200×1200 | 1:1 | Detail shots, quotes |
| **Wide Banner** | 1500×500 | 3:1 | Header images |
| **Card Preview** | 800×418 | 1.91:1 | Link previews |

## 🖼️ Image Assignment

| HTML File | Recommended Size | Tweet(s) | Notes |
|-----------|-----------------|----------|-------|
| 01-hero.html | 1200×675 | 1, 6 | Main intro, hook |
| 02-problem.html | 1200×675 | 2, 5 | Problem statement |
| 03-architecture.html | 1200×675 | 3, 4 | Architecture explanation |
| 04-installation.html | 1200×675 | 7 | Installation demo |
| 05-publishing.html | 1200×675 | 8 | Publishing workflow |
| 06-performance.html | 1200×675 | 9 | Performance metrics |
| 07-call-to-action.html | 1200×675 | 12, 13 | CTA and get started |

## 🎬 Generating Screenshots with Playwright

If you have Playwright available, use these commands:

```bash
# Example: Generate hero image
# First navigate to the HTML file
browser_navigate file:///absolute/path/to/01-hero.html

# Take screenshot
browser_take_screenshot filename="01-hero.png" type="png"

# Repeat for each HTML file
```

### Automated Batch Script

Create a script to generate all at once:

```javascript
// generate-screenshots.js
const playwright = require('playwright');
const path = require('path');

const files = [
  '01-hero.html',
  '02-problem.html',
  '03-architecture.html',
  '04-installation.html',
  '05-publishing.html',
  '06-performance.html',
  '07-call-to-action.html'
];

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 675 }
  });

  for (const file of files) {
    const filePath = path.resolve(__dirname, 'images', file);
    await page.goto(`file://${filePath}`);

    // Wait for fonts and animations
    await page.waitForTimeout(1000);

    const outputName = file.replace('.html', '.png');
    await page.screenshot({
      path: path.resolve(__dirname, 'images', outputName),
      type: 'png'
    });

    console.log(`✓ Generated ${outputName}`);
  }

  await browser.close();
})();
```

Run with:
```bash
node generate-screenshots.js
```

## 🎨 Manual Screenshot Best Practices

### Browser Setup
1. **Use Chrome/Chromium** for consistent rendering
2. **Set viewport** to 1200×675 before screenshots
3. **Disable extensions** that might inject content
4. **Use incognito mode** for clean rendering

### Chrome DevTools Method
```
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Set to "Responsive"
4. Enter custom dimensions: 1200×675
5. Click "Capture screenshot" from DevTools menu
   (Ctrl+Shift+P → "screenshot")
```

### Firefox DevTools Method
```
1. Open DevTools (F12)
2. Click "Responsive Design Mode" (Ctrl+Shift+M)
3. Set dimensions: 1200×675
4. Click camera icon or use:
   Take Screenshot → Save Full Page
```

## 🖌️ Post-Processing

After generating screenshots:

### 1. Optimize File Size
```bash
# Using ImageOptim (macOS)
imageoptim images/*.png

# Using pngquant (cross-platform)
pngquant images/*.png --ext .png --force

# Using TinyPNG website
# Upload to https://tinypng.com
```

### 2. Add Drop Shadow (Optional)
Makes images pop on Twitter's white background:

```css
/* Add this to HTML files before screenshot: */
body::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.5);
}
```

### 3. Test on Twitter
Before campaign:
1. Post test tweet (private account or delete after)
2. Verify images display correctly
3. Check mobile view
4. Ensure text is readable

## 📱 Mobile Optimization

Twitter displays images differently on mobile:

### Mobile Preview Checklist
- [ ] Text size is readable at 375px width
- [ ] Important content in center 80% of image
- [ ] Contrast sufficient for outdoor viewing
- [ ] Tap targets (if interactive) minimum 44px

### Testing Mobile Display
```
1. Use Chrome DevTools Device Mode
2. Test on iPhone 12 Pro (390×844)
3. Test on Pixel 5 (393×851)
4. Verify text readability
5. Check that terminal chrome isn't cut off
```

## 🎞️ Creating Animated GIFs

For tweets 4 and 7, consider animated versions:

### Tools
- **LICEcap** (Windows/macOS) - Simple screen recording
- **Gifski** (macOS) - High-quality GIF conversion
- **ScreenToGif** (Windows) - Screen recorder & editor

### Animation Ideas

**Tweet 4: Progressive Loading**
```
1. Show metadata loading (fade in)
2. Show instructions loading (slide in)
3. Show resources loading (pop in)
4. Loop with 2-second pause
```

**Tweet 7: Installation Flow**
```
1. Type "skills search arweave"
2. Show search results
3. Type "skills install ao-basics"
4. Show installation progress
5. Show success message
```

### GIF Optimization
```bash
# Optimize with gifsicle
gifsicle -O3 --lossy=80 input.gif -o output.gif

# Or use online tool
# https://ezgif.com/optimize
```

### GIF Best Practices
- **Keep under 5MB** (Twitter limit: 15MB but 5MB loads faster)
- **Max 10 seconds** duration
- **Loop 2-3 times** then pause
- **30 FPS** for smooth animation
- **Optimize colors** (256 or fewer)

## 🔍 Quality Checklist

Before using in campaign:

### Visual Quality
- [ ] Text is crisp and readable
- [ ] Terminal colors render correctly (green, cyan, yellow)
- [ ] No compression artifacts
- [ ] Borders and shadows visible
- [ ] Consistent font rendering

### Technical Quality
- [ ] File size under 5MB (preferably under 1MB)
- [ ] Dimensions exactly 1200×675 (or intended size)
- [ ] PNG format (for static) or GIF (for animated)
- [ ] Optimized for web (using ImageOptim/TinyPNG)

### Content Quality
- [ ] All text is readable at 50% zoom
- [ ] No typos in terminal output
- [ ] Consistent branding (colors, fonts)
- [ ] Important info not near edges (safe area)

### Platform Testing
- [ ] Tested on Twitter's preview tool
- [ ] Displays correctly on mobile
- [ ] Looks good on light and dark mode
- [ ] Link preview shows correctly

## 🎯 Quick Reference: Screenshot Commands

### macOS
```bash
# Full screen
Cmd + Shift + 3

# Selected area
Cmd + Shift + 4

# Window
Cmd + Shift + 4, then Space

# To clipboard (add Ctrl to above)
```

### Windows
```bash
# Snipping Tool
Win + Shift + S

# Full screen
PrtScn

# Active window
Alt + PrtScn
```

### Linux
```bash
# GNOME Screenshot
gnome-screenshot        # Full screen
gnome-screenshot -w     # Window
gnome-screenshot -a     # Area

# scrot
scrot                   # Full screen
scrot -s                # Select area
```

## 💡 Pro Tips

1. **Consistent Lighting**: Take all screenshots in one session for color consistency
2. **High DPI**: Use 2x or 3x resolution, then scale down for crisp text
3. **Preview First**: Always preview on actual Twitter before campaign
4. **Backup Formats**: Keep high-res originals and optimized versions
5. **Version Control**: Name files with version numbers (e.g., `01-hero-v2.png`)
6. **Accessibility**: Add alt text descriptions for all images
7. **A/B Testing**: Create variations to test which performs better

## 📊 Performance Tracking

Track which images get the most engagement:

```markdown
| Image | Tweet # | Impressions | Engagements | CTR |
|-------|---------|-------------|-------------|-----|
| 01-hero.png | 1 | 5,234 | 234 | 4.5% |
| 02-problem.png | 2 | 3,456 | 178 | 5.2% |
| ... | ... | ... | ... | ... |
```

Use learnings for future campaigns!

---

## 🚀 Ready to Generate?

Run through this checklist:
- [ ] All HTML files opened and reviewed
- [ ] Browser set to correct dimensions (1200×675)
- [ ] DevTools ready for screenshots
- [ ] Output folder prepared
- [ ] Post-processing tools installed
- [ ] Test tweet account ready

**Let's create some amazing visuals! 🎨**

---

*Last updated: 2025-10-27*
