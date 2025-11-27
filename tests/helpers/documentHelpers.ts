import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Test helper class for document creation actions
 * Provides reusable methods for interacting with document creation UI elements
 */
export class DocumentHelpers {
  constructor(private page: Page) {}

  /**
   * Clicks the "Create new document" button and waits for navigation to docs page
   * @returns The UUID of the created document (extracted from URL)
   */
  async createNewDocument(): Promise<string> {
    // Click the create new document button using text content
    await this.page.click('button:has-text("Create new document")');
    
    // Wait for navigation to complete and URL to contain /docs/ with a UUID
    await this.page.waitForURL(/\/docs\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    
    // Extract and return the UUID from the URL
    const url = this.page.url();
    const uuidMatch = url.match(/\/docs\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    
    if (!uuidMatch) {
      throw new Error('Failed to extract document UUID from URL after creation');
    }
    
    return uuidMatch[1];
  }

  /**
   * Finds a div element that has a class name containing the word 'desktop'
   * @returns Promise resolving to the locator for the desktop div
   */
  async findDesktopDiv() {
    const desktopDiv = this.page.locator('div[class*="desktop"]');
    const count = await desktopDiv.count();
    expect(count).toBeGreaterThan(0);
    return desktopDiv;
  }

  /**
   * Finds a div element that has a class name containing 'explorerItem'
   * @returns Promise resolving to the locator for the explorer item div
   */
  async findExplorerItem() {
    const explorerItem = this.page.locator('div[class*="explorerItem"]');
    return explorerItem;
  }

  /**
   * Finds a div element that has a class name containing 'empty-state'
   * @returns Promise resolving to the locator for the empty state div
   */
  async findEmptyStateDiv() {
    const emptyStateDiv = this.page.locator('div[class*="_empty-state_"]');
    await emptyStateDiv.waitFor();
    return emptyStateDiv;
  }

  /**
   * Finds a div element that has a class name containing 'items-list'
   * @returns Promise resolving to the locator for the items list div
   */
  async findItemsListDiv() {
    const itemsListDiv = this.page.locator('div[class*="items-list"]');
    await itemsListDiv.waitFor();
    return itemsListDiv;
  }

  /**
   * Finds a div element that has a class name containing 'recents-title'
   * @returns Promise resolving to the locator for the recents title div
   */
  async findRecentsTitleDiv() {
    const recentsTitleDiv = this.page.locator('div[class*="recents-title"]');
    await recentsTitleDiv.waitFor();
    return recentsTitleDiv;
  }
}
