<script lang="ts">
  import Editor from '$lib/components/Editor.svelte';
    import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Document } from '$lib/models/Document';
  import { DatabaseService } from '$lib/services/DatabaseService';

  let dbService: DatabaseService;
  let isBrowser = false;

  onMount(async () => {
    // Only initialize in browser
    isBrowser = true;
    
    try {
      // Dynamically import to ensure browser-only execution
      const { DatabaseService } = await import('$lib/services/DatabaseService');
      dbService = new DatabaseService('squiredb');
      console.log('PouchDB "squiredb" initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  });

  async function handleNewDocument() {
    try {
      if (!isBrowser || !dbService) {
        throw new Error('Database not initialized');
      }
      
      // Create a new document with UUID
      const newDoc = new Document('Untitled Document', '');
      
      // Save to database
      const savedDoc = await dbService.create(newDoc);
      
      console.log('New document created:', savedDoc.id);
      
      // Navigate to the new document page
      await goto(`/docs/${savedDoc.id}`);
    } catch (error) {
      console.error('Failed to create new document:', error);
    }
  }
</script>

<Editor />
