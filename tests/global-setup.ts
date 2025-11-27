import { config } from 'dotenv';
import { chromium, type FullConfig } from '@playwright/test';

// Load test environment variables
config({ path: '.env.test' });

async function globalSetup(config: FullConfig) {
  // Test environment variables are now loaded from .env.test
  console.log('Test setup with DB name:', process.env.TEST_DB_NAME);
  
  // Clear IndexedDB before tests for clean state
  console.log('Tests will use separate IndexedDB:', process.env.TEST_DB_NAME);
}

export default globalSetup;
