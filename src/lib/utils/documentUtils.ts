import { goto } from '$app/navigation';
import { Document } from '$lib/models/Document';
import { browser } from '$app/environment';
import { generateTimeBasedTitle } from './timeTitle';

/**
 * Creates a new document and navigates to it
 * Works from any page in the application
 */
export async function createNewDocument(): Promise<void> {
  try {
    // Only execute in browser
    if (!browser) {
      throw new Error('Document creation is only available in the browser');
    }
    
    // Dynamically import DocumentService to ensure browser-only execution
    const { DocumentService } = await import('$lib/services/DocumentService');
    const documentService = new DocumentService();
    
    // Create a new document with time-based title
    const newDoc = new Document();
    
    // Save to database
    const savedDoc = await documentService.create(newDoc);
    
    // Force page reload to ensure clean state
    window.location.href = `/docs/${savedDoc.id}`;
  } catch (error) {
    console.error('Failed to create new document:', error);
    throw error;
  }
}
