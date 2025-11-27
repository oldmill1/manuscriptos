import { test, expect } from '@playwright/test';
import { DocumentHelpers } from './helpers/documentHelpers';

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
  
  // Should have empty state visible since test DB is empty - find by class containing "empty-state"
  const emptyState = page.locator('[class*="empty-state"]');
  await expect(emptyState).toBeVisible();
});

test('create new document navigates to docs page', async ({ page }) => {
  const docHelpers = new DocumentHelpers(page);
  
  await page.goto('/');
  
  // Create a new document using the helper
  const documentId = await docHelpers.createNewDocument();
  
  // Verify the URL pattern matches expected docs route with UUID
  expect(page.url()).toMatch(/\/docs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
});
