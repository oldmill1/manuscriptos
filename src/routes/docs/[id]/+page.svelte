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
    try {
      // Initialize database service
      const { DatabaseService } = await import('$lib/services/DatabaseService');
      dbService = new DatabaseService('squiredb');
      
      // Load the document
      const document = await dbService.read(data.id);
      
      if (document) {
        documentContent = document.content;
      } else {
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
