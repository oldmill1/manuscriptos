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

test('test database should be empty on first load', async ({ page }) => {
  await page.goto('/');
  
  // Should NOT have items-list since test DB is empty
  const itemsList = page.locator('.items-list');
  await expect(itemsList).not.toBeVisible();
});

test('create new document navigates to docs page', async ({ page }) => {
  await page.goto('/');
  
  // Click the create new document button using text content
  await page.click('button:has-text("Create new document")');
  
  // Wait for navigation to complete and URL to contain /docs/ with a UUID
  await page.waitForURL(/\/docs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  
  // Verify the URL pattern matches expected docs route with UUID
  expect(page.url()).toMatch(/\/docs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
});
