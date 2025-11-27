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
}
