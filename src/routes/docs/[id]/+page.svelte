<script lang="ts">
  import Editor from '$lib/components/Editor.svelte';
  import StatusBar from '$lib/components/StatusBar.svelte';
  import MenuBar from '$lib/components/MenuBar.svelte';
  import WidgetArea from '$lib/components/widgetsarea/WidgetArea.svelte';
  import { onMount } from 'svelte';
  import type { PageProps } from './$types';
  
  let { data }: PageProps = $props();
  let documentContent = $state<string | undefined>(undefined);
  let documentTitle = $state<string>('');
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
        documentTitle = document.title;
console.log(`
[LOADED] ${document.title}
         └─ ${document.id.substring(0, 8)} • ${document.createdAt.toRelativeTime?.() || 'just now'}
`);
      } else {
        documentContent = '';
        documentTitle = 'Untitled Document';
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      documentContent = '';
      documentTitle = 'Untitled Document';
    } finally {
      isLoading = false;
    }
  }
</script>

<MenuBar {documentTitle} documentId={data.id} {dbService} />
<Editor content={documentContent} documentId={data.id} {dbService} />
<StatusBar />
<WidgetArea title="Widgets" documentId={data.id} />
