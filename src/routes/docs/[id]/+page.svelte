<script lang="ts">
  import Editor from '$lib/components/Editor.svelte';
  import { onMount } from 'svelte';
  import type { PageProps } from './$types';
  
  let { data }: PageProps = $props();
  let documentContent = $state<string | undefined>(undefined);
  let dbService = $state<any>();
  let isLoading = $state(true);

  onMount(async () => {
    await loadDocument();
  });

  async function loadDocument() {
    console.log('Loading document with ID:', data.id);
    try {
      // Initialize database service
      const { DatabaseService } = await import('$lib/services/DatabaseService');
      dbService = new DatabaseService('squiredb');
      console.log('Database service initialized');
      
      // Load the document
      const document = await dbService.read(data.id);
      console.log('Document loaded:', document);
      console.log('Document content type:', typeof document?.content);
      console.log('Document content value:', JSON.stringify(document?.content));
      
      if (document) {
        documentContent = document.content;
        console.log('documentContent state set to:', JSON.stringify(documentContent));
      } else {
        console.log('No document found with ID:', data.id);
        documentContent = '';
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      documentContent = '';
    } finally {
      isLoading = false;
    }
  }
</script>

<Editor content={documentContent} documentId={data.id} {dbService} />
