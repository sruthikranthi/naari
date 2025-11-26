/**
 * E2E tests for dashboard functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // In a real scenario, you'd set up authenticated state
    await page.goto('/dashboard');
  });

  test('should display dashboard navigation', async ({ page }) => {
    // Check for main navigation items
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /communities/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /marketplace/i })).toBeVisible();
  });

  test('should navigate to communities page', async ({ page }) => {
    await page.getByRole('link', { name: /communities/i }).click();
    await expect(page).toHaveURL(/.*communities/);
  });

  test('should navigate to marketplace page', async ({ page }) => {
    await page.getByRole('link', { name: /marketplace/i }).click();
    await expect(page).toHaveURL(/.*marketplace/);
  });

  test('should display search functionality', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /search|open search/i });
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    }
  });
});

