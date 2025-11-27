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

test('create document and verify explorer item in desktop', async ({ page }) => {
  const docHelpers = new DocumentHelpers(page);
  
  // 1. Navigate to home
  await page.goto('/');
  
  // 2. Click create new document using helpers
  const documentId = await docHelpers.createNewDocument();
  
  // 3. Navigate to explorer
  await page.goto('/explorer');
  
  // 4. Find desktop div using helper
  const desktopDiv = await docHelpers.findDesktopDiv();
  
  // 5. Find explorer item within desktop using helper
  const explorerItem = await docHelpers.findExplorerItem();
  
  // 6. Verify there is exactly 1 explorer item with the specific class pattern
  const specificExplorerItem = desktopDiv.locator('div[class*="_explorerItem_"]');
  await expect(specificExplorerItem).toHaveCount(1);
  
  // 7. Verify the specific explorer item contains the expected class pattern
  const explorerItemElement = specificExplorerItem.first();
  await expect(explorerItemElement).toBeVisible();
});
