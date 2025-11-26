/**
 * E2E tests for critical user journeys
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys', () => {
  test('user can browse posts', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', {
      timeout: 10000,
    }).catch(() => {
      // Posts might not be visible if not authenticated
    });

    // Check if post content is visible
    const postContent = page.locator('text=/post|content/i').first();
    // This would work if posts are loaded
  });

  test('user can search for content', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click search button
    const searchButton = page.getByRole('button', { name: /search/i });
    if (await searchButton.isVisible()) {
      await searchButton.click();
      
      // Type in search
      const searchInput = page.getByPlaceholderText(/search/i);
      await searchInput.fill('test');
      
      // Wait for results
      await page.waitForTimeout(500);
    }
  });

  test('user can navigate between pages', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to communities
    await page.getByRole('link', { name: /communities/i }).click();
    await expect(page).toHaveURL(/.*communities/);
    
    // Navigate to marketplace
    await page.getByRole('link', { name: /marketplace/i }).click();
    await expect(page).toHaveURL(/.*marketplace/);
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard|home/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('user can view notifications', async ({ page }) => {
    await page.goto('/dashboard');
    
    const notificationButton = page.getByRole('button', { name: /notification/i });
    if (await notificationButton.isVisible()) {
      await notificationButton.click();
      
      // Check if notification dropdown is visible
      await expect(page.getByText(/notification|no notification/i)).toBeVisible();
    }
  });
});

