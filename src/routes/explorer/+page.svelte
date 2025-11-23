<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { Document } from '$lib/models/Document';
  import { DatabaseService } from '$lib/services/DatabaseService';
  import { selectedDocuments } from '$lib/stores/selectedDocuments';
  import Explorer from '$lib/components/Explorer.svelte';
  import ExplorerDock from '$lib/components/ExplorerDock.svelte';
  import type { PageProps } from './$types';
  
  let { data }: PageProps = $props();
  
  let dbService: DatabaseService;
  let isBrowser = false;
  let recentDocs = $state<Document[]>([]);
  let hasLoaded = $state(false);
  let isSelectionMode = $state(false);

  onMount(async () => {
    isBrowser = true;
    
    try {
      const { DatabaseService } = await import('$lib/services/DatabaseService');
      dbService = new DatabaseService('squiredb');
      console.log('PouchDB "squiredb" initialized successfully in Explorer');
      
      // Load recent documents
      await loadRecentDocs();
    } catch (error) {
      console.error('Failed to initialize database in Explorer:', error);
    }
  });

  async function loadRecentDocs() {
    try {
      if (!dbService) return;
      
      const docs = await dbService.list();
      // Sort by updatedAt to get the latest documents and take 10
      recentDocs = docs
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 10);
    } catch (error) {
      console.error('Failed to load recent documents in Explorer:', error);
    } finally {
      hasLoaded = true;
    }
  }

  async function openDocument(docId: string) {
    await goto(`/docs/${docId}`);
  }

  function handleDocumentClick(doc: Document, event: MouseEvent) {
    if (isSelectionMode) {
      event.preventDefault();
      toggleDocumentSelection(doc);
    } else {
      openDocument(doc.id);
    }
  }

  function toggleDocumentSelection(doc: Document) {
    selectedDocuments.toggleDocument(doc);
  }

  function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    if (!isSelectionMode) {
      selectedDocuments.clearSelection();
    }
  }

  const selectedCount = $derived(selectedDocuments.getSelectedCount());
</script>

<div class="explorer-container">
  <Explorer 
    documents={recentDocs} 
    {hasLoaded} 
    onDocumentClick={handleDocumentClick}
    {isSelectionMode}
  />
  
  {#if recentDocs.length > 0}
    <ExplorerDock 
      onToggleSelectionMode={toggleSelectionMode}
      {isSelectionMode}
      {selectedCount}
    />
  {/if}
</div>
