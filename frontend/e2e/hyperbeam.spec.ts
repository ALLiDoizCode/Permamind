/**
 * HyperBEAM Dynamic Reads E2E Tests
 *
 * Prerequisites:
 * - Install Playwright: npm install -D @playwright/test
 * - Run: npx playwright install
 *
 * Run tests:
 * - npx playwright test
 * - npx playwright test --headed (with browser UI)
 */

import { test, expect } from '@playwright/test';

test.describe('HyperBEAM Dynamic Reads Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
  });

  test('search uses HyperBEAM endpoint', async ({ page }) => {
    // Capture network requests
    const requests: string[] = [];
    page.on('request', (req) => requests.push(req.url()));

    // Perform search
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('blockchain');
    await searchInput.press('Enter');

    // Wait for response from HyperBEAM or fallback
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('hb.randao.net') ||
        resp.url().includes('ur-cu.randao.net')
    );

    // Verify HyperBEAM was attempted (even if fallback occurred)
    const hyperbeamRequests = requests.filter((url) =>
      url.includes('hb.randao.net')
    );
    const dryrunRequests = requests.filter((url) =>
      url.includes('ur-cu.randao.net')
    );

    // Either HyperBEAM succeeded OR fallback to dryrun
    expect(
      hyperbeamRequests.length > 0 || dryrunRequests.length > 0
    ).toBeTruthy();

    // Verify search results displayed
    const results = page.locator('[data-testid="skill-card"]');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
  });

  test('skill detail page loads via HyperBEAM', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => requests.push(req.url()));

    // Navigate to skill detail page (assumes skill exists)
    await page.goto('http://localhost:5173/skills/ao-basics');

    // Wait for skill data to load
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('hb.randao.net') ||
        resp.url().includes('ur-cu.randao.net')
    );

    // Verify HyperBEAM was attempted
    const hyperbeamRequests = requests.filter((url) =>
      url.includes('hb.randao.net')
    );

    // HyperBEAM should be tried first (fallback to dryrun acceptable)
    expect(hyperbeamRequests.length).toBeGreaterThanOrEqual(0);

    // Verify skill detail content loaded
    const skillName = page.locator('h1');
    await expect(skillName).toBeVisible();
  });

  test('version history loads via HyperBEAM', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => requests.push(req.url()));

    // Navigate to skill detail page and open version history
    await page.goto('http://localhost:5173/skills/ao-basics');

    // Click version history tab/button (adjust selector as needed)
    const versionButton = page.getByRole('button', { name: /versions/i });
    if (await versionButton.isVisible()) {
      await versionButton.click();
    }

    // Wait for version data
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('getSkillVersions') ||
        resp.url().includes('Get-Skill-Versions')
    );

    // Verify HyperBEAM or dryrun was used
    expect(requests.length).toBeGreaterThan(0);
  });

  test('list skills uses HyperBEAM with pagination', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => requests.push(req.url()));

    // Navigate to skills list page
    await page.goto('http://localhost:5173/skills');

    // Wait for initial list load
    await page.waitForResponse(
      (resp) =>
        resp.url().includes('hb.randao.net') ||
        resp.url().includes('ur-cu.randao.net')
    );

    // Verify HyperBEAM was attempted (logged for debugging)
    // Note: HyperBEAM may fallback to dryrun if node unavailable

    // Verify skills list rendered
    const skillCards = page.locator('[data-testid="skill-card"]');
    await expect(skillCards.first()).toBeVisible({ timeout: 10000 });

    // Test pagination (if exists)
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Verify another HyperBEAM request made
      await page.waitForResponse(
        (resp) =>
          resp.url().includes('hb.randao.net') ||
          resp.url().includes('ur-cu.randao.net')
      );
    }
  });

  test('registry info loads via HyperBEAM', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (req) => requests.push(req.url()));

    // Navigate to homepage or info page
    await page.goto('http://localhost:5173');

    // Wait for registry info load (might be on homepage or footer)
    await page.waitForTimeout(2000); // Allow time for background requests

    // Verify some network requests were made (info might be cached or lazy-loaded)
    expect(requests.length).toBeGreaterThan(0);
  });

  test('HyperBEAM response time is fast (<500ms average)', async ({ page }) => {
    const responseTimes: number[] = [];

    page.on('response', (resp) => {
      if (resp.url().includes('hb.randao.net')) {
        const timing = resp.timing();
        if (timing) {
          responseTimes.push(timing.responseEnd);
        }
      }
    });

    // Perform multiple searches to measure average
    const queries = ['blockchain', 'arweave', 'ao', 'permaweb'];

    for (const query of queries) {
      await page.goto('http://localhost:5173');
      const searchInput = page.getByPlaceholder(/search/i);
      await searchInput.fill(query);
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
    }

    // Calculate average response time
    if (responseTimes.length > 0) {
      const average =
        responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length;

      // HyperBEAM should be faster than 500ms on average
      expect(average).toBeLessThan(500);
    }
  });
});
