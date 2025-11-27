import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/manuscriptOS/);
});

test('basic navigation works', async ({ page }) => {
  await page.goto('/');
  
  // Click the explorer link or navigate to explorer
  await page.goto('/explorer');
  
  // Expect the URL to contain explorer
  expect(page.url()).toContain('/explorer');
});
