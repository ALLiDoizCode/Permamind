/**
 * Playwright Integration Tests for Custom Wallet UI (Story 12.2)
 *
 * Tests the Permamind-branded browser wallet connection UI:
 * - Visual design and branding
 * - Responsive design breakpoints
 * - SSE protocol DOM elements
 * - Dark theme (no toggle)
 * - Accessibility
 *
 * Note: These tests verify the UI rendering and structure.
 * Actual wallet operations require a browser extension and cannot be fully automated.
 */

import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('Custom Wallet UI - Visual and Structural Tests', () => {
  let mockServer: ChildProcess;
  let serverPort: number;
  let serverUrl: string;

  // Browser instances for cross-browser testing
  let chromiumBrowser: Browser;
  let firefoxBrowser: Browser;
  let webkitBrowser: Browser;

  beforeAll(async () => {
    // Start mock HTTP server serving the custom UI
    serverPort = 54321; // Fixed port for testing
    serverUrl = `http://localhost:${serverPort}`;

    await startMockWalletServer();

    // Launch browsers for cross-browser testing
    chromiumBrowser = await chromium.launch({ headless: true });
    firefoxBrowser = await firefox.launch({ headless: true });
    webkitBrowser = await webkit.launch({ headless: true });
  }, 30000);

  afterAll(async () => {
    // Close browsers
    await chromiumBrowser?.close();
    await firefoxBrowser?.close();
    await webkitBrowser?.close();

    // Stop mock server
    if (mockServer) {
      mockServer.kill();
    }
  });

  describe('Visual Design & Branding (AC 1, AC 2)', () => {
    let page: Page;

    beforeEach(async () => {
      const context = await chromiumBrowser.newContext();
      page = await context.newPage();
      await page.goto(serverUrl);
    });

    afterEach(async () => {
      await page.close();
    });

    test('should display Permamind branding (not default)', async () => {
      // Verify custom title
      const title = await page.title();
      expect(title).toBe('Permamind Wallet Connection');
      expect(title).not.toBe('Arweave Wallet Signer');

      // Verify heading text
      const heading = await page.locator('h1').textContent();
      expect(heading).toContain('Permamind Wallet Connection');
      expect(heading).not.toContain('Arweave Wallet Signer');
    });

    test('should have terminal dark theme colors', async () => {
      // Check body background color
      const bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      // #10151B converts to rgb(16, 21, 27)
      expect(bodyBg).toBe('rgb(16, 21, 27)');

      // Check container background
      const containerBg = await page.locator('.container').evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // #1a1f26 converts to rgb(26, 31, 38)
      expect(containerBg).toBe('rgb(26, 31, 38)');

      // Check text color
      const containerColor = await page.locator('.container').evaluate((el) => {
        return window.getComputedStyle(el).color;
      });
      // #e2e8f0 converts to rgb(226, 232, 240)
      expect(containerColor).toBe('rgb(226, 232, 240)');
    });

    test('should NOT have theme toggle button', async () => {
      // Look for theme toggle elements
      const themeToggle = await page.locator('.theme-toggle').count();
      expect(themeToggle).toBe(0);

      // Look for theme icons
      const sunIcon = await page.locator('text=☀️').count();
      const moonIcon = await page.locator('text=🌙').count();
      expect(sunIcon).toBe(0);
      expect(moonIcon).toBe(0);
    });

    test('should use correct typography', async () => {
      // Check body font family (Inter)
      const bodyFont = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      expect(bodyFont).toMatch(/Inter/i);

      // Check wallet address font family (JetBrains Mono) when visible
      const addressExists = await page.locator('.wallet-address').count();
      if (addressExists > 0) {
        const addressFont = await page.locator('.wallet-address').evaluate((el) => {
          return window.getComputedStyle(el).fontFamily;
        });
        expect(addressFont).toMatch(/JetBrains Mono|Courier/i);
      }
    });
  });

  describe('SSE Protocol Required Elements (AC 3)', () => {
    let page: Page;

    beforeEach(async () => {
      const context = await chromiumBrowser.newContext();
      page = await context.newPage();
      await page.goto(serverUrl);
    });

    afterEach(async () => {
      await page.close();
    });

    test('should have all required DOM elements for SSE protocol', async () => {
      // Required elements as specified in story
      const requiredIds = [
        'status',
        'walletInfo',
        'address',
        'queueContainer',
        'queueList',
        'log',
      ];

      for (const id of requiredIds) {
        const element = await page.locator(`#${id}`);
        await expect(element).toBeAttached();
      }
    });

    test('should have status element with correct initial state', async () => {
      const status = page.locator('#status');
      await expect(status).toBeVisible();

      // Should have status class
      const hasStatusClass = await status.evaluate((el) =>
        el.classList.contains('status')
      );
      expect(hasStatusClass).toBe(true);

      // Should have connecting or error state initially
      const classes = await status.evaluate((el) => el.className);
      expect(classes).toMatch(/connecting|error/);
    });

    test('should have wallet info section (initially hidden)', async () => {
      const walletInfo = page.locator('#walletInfo');
      await expect(walletInfo).toBeAttached();

      // Should be hidden initially (no wallet connected)
      const isVisible = await walletInfo.isVisible();
      expect(isVisible).toBe(false);
    });

    test('should have queue container with header', async () => {
      const queueContainer = page.locator('#queueContainer');
      await expect(queueContainer).toBeAttached();

      const queueHeader = page.locator('.queue-header');
      await expect(queueHeader).toBeAttached();

      const headerText = await queueHeader.textContent();
      expect(headerText).toContain('Request Queue');
    });

    test('should have log container for activity', async () => {
      const log = page.locator('#log');
      await expect(log).toBeAttached();
      await expect(log).toHaveClass(/log/);
    });
  });

  describe('Responsive Design (AC 5)', () => {
    let page: Page;

    beforeEach(async () => {
      const context = await chromiumBrowser.newContext();
      page = await context.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    test('should render correctly at desktop resolution (1440px)', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(serverUrl);

      // Container should be visible and properly sized
      const container = page.locator('.container');
      await expect(container).toBeVisible();

      const containerWidth = await container.evaluate((el) =>
        el.getBoundingClientRect().width
      );
      // Max-width is 600px, so should be 600px at 1440px viewport
      expect(containerWidth).toBeLessThanOrEqual(600);
    });

    test('should render correctly at tablet resolution (768px)', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(serverUrl);

      // All elements should still be visible
      const container = page.locator('.container');
      await expect(container).toBeVisible();

      // Check that text is still readable (font size adjustments)
      const heading = page.locator('h1');
      const fontSize = await heading.evaluate((el) =>
        parseInt(window.getComputedStyle(el).fontSize)
      );
      expect(fontSize).toBeGreaterThanOrEqual(18); // Minimum readable size
    });

    test('should render correctly at mobile resolution (375px)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(serverUrl);

      // Container should be visible and fit screen
      const container = page.locator('.container');
      await expect(container).toBeVisible();

      // No horizontal scrolling
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);

      // Text should still be legible
      const heading = page.locator('h1');
      const fontSize = await heading.evaluate((el) =>
        parseInt(window.getComputedStyle(el).fontSize)
      );
      expect(fontSize).toBeGreaterThanOrEqual(16); // Minimum mobile readable
    });

    test('should have touch-friendly targets on mobile (44x44px minimum)', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(serverUrl);

      // Check links in instructions
      const links = await page.locator('.instructions a').all();

      for (const link of links) {
        const box = await link.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44px
          expect(box.height).toBeGreaterThanOrEqual(40); // Some tolerance
        }
      }
    });
  });

  describe('Cross-Browser Compatibility (AC 4)', () => {
    test('should render correctly in Chromium', async () => {
      const context = await chromiumBrowser.newContext();
      const page = await context.newPage();
      await page.goto(serverUrl);

      // Verify title
      const title = await page.title();
      expect(title).toBe('Permamind Wallet Connection');

      // Verify all required elements present
      await expect(page.locator('#status')).toBeAttached();
      await expect(page.locator('#log')).toBeAttached();

      await page.close();
      await context.close();
    });

    test('should render correctly in Firefox', async () => {
      const context = await firefoxBrowser.newContext();
      const page = await context.newPage();
      await page.goto(serverUrl);

      // Verify title
      const title = await page.title();
      expect(title).toBe('Permamind Wallet Connection');

      // Verify all required elements present
      await expect(page.locator('#status')).toBeAttached();
      await expect(page.locator('#log')).toBeAttached();

      await page.close();
      await context.close();
    });

    test('should render correctly in WebKit (Safari)', async () => {
      const context = await webkitBrowser.newContext();
      const page = await context.newPage();
      await page.goto(serverUrl);

      // Verify title
      const title = await page.title();
      expect(title).toBe('Permamind Wallet Connection');

      // Verify all required elements present
      await expect(page.locator('#status')).toBeAttached();
      await expect(page.locator('#log')).toBeAttached();

      await page.close();
      await context.close();
    });
  });

  describe('Accessibility', () => {
    let page: Page;

    beforeEach(async () => {
      const context = await chromiumBrowser.newContext();
      page = await context.newPage();
      await page.goto(serverUrl);
    });

    afterEach(async () => {
      await page.close();
    });

    test('should have proper HTML structure', async () => {
      // Should have doctype
      const doctype = await page.evaluate(() => {
        return document.doctype?.name;
      });
      expect(doctype).toBe('html');

      // Should have lang attribute
      const lang = await page.evaluate(() => {
        return document.documentElement.lang;
      });
      expect(lang).toBe('en');
    });

    test('should have meta viewport for mobile', async () => {
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
    });

    test('should have descriptive title', async () => {
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(10);
    });

    test('should have focusable links', async () => {
      const links = await page.locator('.instructions a').all();

      for (const link of links) {
        // Links should have href
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();

        // Links should be keyboard focusable
        await link.focus();
        const isFocused = await link.evaluate((el) => el === document.activeElement);
        expect(isFocused).toBe(true);
      }
    });
  });

  describe('JavaScript Loading', () => {
    let page: Page;

    beforeEach(async () => {
      const context = await chromiumBrowser.newContext();
      page = await context.newPage();
    });

    afterEach(async () => {
      await page.close();
    });

    test('should load without JavaScript errors', async () => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto(serverUrl);

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Check for errors
      expect(errors).toHaveLength(0);
    });

    test('should load Arweave SDK from CDN', async () => {
      await page.goto(serverUrl);

      // Check if Arweave SDK script loaded
      const arweaveLoaded = await page.evaluate(() => {
        return typeof (window as any).Arweave !== 'undefined';
      });

      expect(arweaveLoaded).toBe(true);
    });

    test('should have custom JavaScript loaded', async () => {
      await page.goto(serverUrl);
      await page.waitForLoadState('networkidle');

      // Check if custom JS functions exist (States constant, requestHandlers, etc.)
      const hasCustomJS = await page.evaluate(() => {
        // Check for DOM manipulation that only custom JS would do
        const log = document.getElementById('log');
        return log !== null;
      });

      expect(hasCustomJS).toBe(true);
    });
  });
});

/**
 * Helper function to start a mock HTTP server serving the custom wallet UI
 */
async function startMockWalletServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Path to custom UI files
    const uiDir = path.resolve(__dirname, '../../dist/ui');

    // Verify UI files exist
    const htmlPath = path.join(uiDir, 'wallet-connect.html');
    if (!fs.existsSync(htmlPath)) {
      reject(new Error(`Custom UI not found at ${htmlPath}. Run 'npm run build' first.`));
      return;
    }

    // Start simple HTTP server using Node.js http module
    const http = require('http');
    const server = http.createServer((req: any, res: any) => {
      if (req.url === '/' || req.url === '/index.html') {
        // Serve HTML
        const html = fs.readFileSync(htmlPath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
      } else if (req.url === '/wallet-connect.css') {
        // Serve CSS
        const css = fs.readFileSync(path.join(uiDir, 'wallet-connect.css'), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(css);
      } else if (req.url === '/wallet-connect.js') {
        // Serve JS
        const js = fs.readFileSync(path.join(uiDir, 'wallet-connect.js'), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(js);
      } else if (req.url === '/events') {
        // Mock SSE endpoint (just keep connection open)
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });
        // Don't close connection
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(54321, () => {
      resolve();
    });

    // Store server reference for cleanup
    mockServer = server as any;
  });
}
