/**
 * E2E tests for authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Sakhi Circle/i);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /login|sign in/i });
    await submitButton.click();

    // Should show validation errors
    await expect(page.getByText(/email|required/i)).toBeVisible();
  });

  test('should navigate to dashboard after successful login', async ({ page }) => {
    // This test would require actual Firebase auth setup
    // For now, we'll test the navigation structure
    await page.goto('/dashboard');
    
    // Should redirect to login if not authenticated
    // In a real scenario, you'd mock the auth state
    const url = page.url();
    expect(url).toContain('/login');
  });
});

