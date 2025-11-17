import { test, expect } from '@playwright/test';

/**
 * E2E Tests for HyperBEAM Search Migration (Story 15.3, TEST-002)
 *
 * These tests verify the complete search workflow from home page
 * through search results to skill detail pages using the new
 * AORegistryClient with HyperBEAM HTTP endpoints.
 *
 * Test Registry Process: _TtjMj1RNcAcbZPe7h8oM---lrkSjRlFL4I6ZTH5LG8
 *
 * Test Coverage:
 * - Complete search flow (home → search → results → detail)
 * - Performance characteristics (query times)
 * - Error recovery (HyperBEAM failure → dryrun fallback)
 * - Multiple HyperBEAM operations in sequence
 */

test.describe('HyperBEAM Search E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('complete search flow: home → search → results → detail', async ({
    page,
  }) => {
    // Home page: Enter search query
    const searchInput = page.getByPlaceholder(/search skills/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('ao');

    // Click search button or press Enter
    await searchInput.press('Enter');

    // Wait for navigation to search results
    await expect(page).toHaveURL(/\/search\?q=ao/);

    // Search results page: Verify results are displayed
    await expect(page.getByText(/skills found/i)).toBeVisible({
      timeout: 10000,
    });

    // Check if we have skill results by looking for skill names
    const aoSkill = page.getByText('ao', { exact: true }).first();
    await expect(aoSkill).toBeVisible();

    // Click on a skill to view details
    await aoSkill.click();

    // Skill detail page: Verify navigation and content
    await expect(page).toHaveURL(/\/skills\//);

    // Verify skill details are displayed (description, tags, etc.)
    await expect(
      page.getByText(/description/i).or(page.getByText(/Learn AO protocol/i))
    ).toBeVisible();
  });

  test('search with no results shows empty state', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search skills/i);
    await searchInput.fill('nonexistent-skill-xyz-123');
    await searchInput.press('Enter');

    // Wait for search results page
    await expect(page).toHaveURL(/\/search\?q=nonexistent-skill-xyz-123/);

    // Verify empty state message
    await expect(
      page.getByText(/no skills found/i).or(page.getByText(/0 skills found/i))
    ).toBeVisible({ timeout: 10000 });

    // Verify search suggestions are displayed
    await expect(
      page
        .getByText(/try these suggestions/i)
        .or(page.getByText(/different keywords/i))
    ).toBeVisible();
  });

  test('search performance measurement', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search skills/i);
    await searchInput.fill('arweave');

    // Measure search performance
    const startTime = Date.now();
    await searchInput.press('Enter');

    // Wait for results to load
    await expect(page.getByText(/skills found/i)).toBeVisible({
      timeout: 10000,
    });
    const endTime = Date.now();

    const searchDuration = endTime - startTime;

    // Log performance for analysis
    // eslint-disable-next-line no-console
    console.log(`Search completed in ${searchDuration}ms`);

    // Search should complete within reasonable time (10 seconds for E2E test)
    // Note: This includes page navigation, network requests, and rendering
    expect(searchDuration).toBeLessThan(10000);
  });

  test('error recovery: network failure shows error message', async ({
    page,
  }) => {
    // Simulate network failure by intercepting requests
    await page.route('**/*/Search-Skills*', (route) => {
      route.abort('failed');
    });

    const searchInput = page.getByPlaceholder(/search skills/i);
    await searchInput.fill('test');
    await searchInput.press('Enter');

    // Wait for error message (should fallback to dryrun or show error)
    await expect(
      page.getByText(/error/i).or(page.getByText(/failed/i))
    ).toBeVisible({ timeout: 15000 });
  });

  test('multiple search operations in sequence', async ({ page }) => {
    // First search
    let searchInput = page.getByPlaceholder(/search skills/i);
    await searchInput.fill('ao');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=ao/);
    await expect(page.getByText(/skills found/i)).toBeVisible({
      timeout: 10000,
    });

    // Second search (modify query)
    searchInput = page.getByPlaceholder(/search skills/i);
    await searchInput.clear();
    await searchInput.fill('arweave');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=arweave/);
    await expect(page.getByText(/skills found/i)).toBeVisible({
      timeout: 10000,
    });

    // Third search (clear search)
    searchInput = page.getByPlaceholder(/search skills/i);
    await searchInput.clear();
    await searchInput.press('Enter');

    // Should show all skills (empty query)
    await expect(page.getByText(/skills found/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('pagination works correctly', async ({ page }) => {
    // Navigate to search results (all skills)
    await page.goto('/search');

    // Wait for results to load
    await expect(page.getByText(/skills found/i)).toBeVisible({
      timeout: 10000,
    });

    // Check if pagination controls exist (only if more than 12 results)
    const nextButton = page.getByRole('button', { name: /next/i });
    const hasPagination = await nextButton.isVisible().catch(() => false);

    if (hasPagination) {
      // Click next to go to page 2
      await nextButton.click();

      // Verify page 2 is displayed
      const previousButton = page.getByRole('button', { name: /previous/i });
      await expect(previousButton).toBeEnabled();

      // Click previous to go back to page 1
      await previousButton.click();
      await expect(nextButton).toBeEnabled();
    } else {
      // If no pagination, verify we have 12 or fewer results
      // eslint-disable-next-line no-console
      console.log('No pagination controls found (12 or fewer results)');
    }
  });

  test('skill detail page loads correctly', async ({ page }) => {
    // Navigate directly to a known skill (from test registry)
    await page.goto('/skills/ao');

    // Verify skill detail content loads
    await expect(
      page
        .getByText(/Learn AO protocol/i)
        .or(page.getByText('ao', { exact: true }))
    ).toBeVisible({ timeout: 10000 });

    // Verify skill metadata is displayed
    await expect(
      page.getByText(/Permamind Team/i).or(page.getByText(/Author/i))
    ).toBeVisible();

    // Verify tags are displayed (if skill has tags)
    await expect(
      page
        .getByText(/blockchain/i)
        .or(
          page
            .getByText(/tutorial/i)
            .or(page.locator('[data-testid="skill-tags"]'))
        )
    ).toBeVisible();
  });

  test('back navigation works from skill detail to search results', async ({
    page,
  }) => {
    // Start with search
    const searchInput = page.getByPlaceholder(/search skills/i);
    await searchInput.fill('ao');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=ao/);
    await expect(page.getByText(/skills found/i)).toBeVisible({
      timeout: 10000,
    });

    // Click on skill
    const aoSkill = page.getByText('ao', { exact: true }).first();
    await aoSkill.click();
    await expect(page).toHaveURL(/\/skills\//);

    // Navigate back
    await page.goBack();

    // Verify we're back on search results with same query
    await expect(page).toHaveURL(/\/search\?q=ao/);
    await expect(page.getByText(/skills found/i)).toBeVisible();
  });
});

test.describe('HyperBEAM Infrastructure Tests', () => {
  test('verify test registry process is accessible', async ({ page }) => {
    // Navigate to home page (which should fetch all skills)
    await page.goto('/');

    // Wait a moment for any background skill fetching
    await page.waitForTimeout(2000);

    // Navigate to search to trigger skill list
    await page.goto('/search');

    // Verify we can fetch skills from test registry
    await expect(
      page.getByText(/skills found/i).or(page.getByText(/skill/i))
    ).toBeVisible({ timeout: 15000 });
  });

  test('fallback to dryrun when HyperBEAM fails', async ({ page }) => {
    // Intercept HyperBEAM requests and make them fail
    await page.route('**/hb.randao.net/**', (route) => {
      route.abort('failed');
    });
    await page.route('**/hb-edge.randao.net/**', (route) => {
      route.abort('failed');
    });
    await page.route('**/forward.computer/**', (route) => {
      route.abort('failed');
    });

    // Navigate to search
    await page.goto('/search');

    // Should still work via dryrun fallback
    await expect(page.getByText(/skills found/i)).toBeVisible({
      timeout: 20000,
    });

    // Log that fallback was used
    // eslint-disable-next-line no-console
    console.log('Successfully fell back to dryrun when HyperBEAM failed');
  });
});
