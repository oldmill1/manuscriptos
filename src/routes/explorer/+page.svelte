<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { Document } from '$lib/models/Document';
  import { DatabaseService } from '$lib/services/DatabaseService';
  import { selectedDocuments } from '$lib/stores/selectedDocuments';
  import { generateTimeBasedTitle } from '$lib/utils/timeTitle';
  import Explorer from '$lib/components/Explorer/Explorer.svelte';
  import Dock, { type DockItem } from '$lib/components/Dock.svelte';
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
      console.log('Raw documents from database:', docs);
      console.log('Number of documents retrieved:', docs.length);
      
      // Sort by updatedAt to get the latest documents and take 100
      recentDocs = docs
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 100);
      
      console.log('Recent docs after sorting and slicing:', recentDocs);
      console.log('Recent doc IDs:', recentDocs.map(d => d.id));
      
      // Initialize selected count
      updateSelectedCount();
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
    updateSelectedCount();
  }

  function toggleSelectionMode() {
    isSelectionMode = !isSelectionMode;
    if (!isSelectionMode) {
      selectedDocuments.clearSelection();
      updateSelectedCount();
    }
  }

  let selectedCount = $state(0);
  
  function updateSelectedCount() {
    selectedCount = selectedDocuments.getSelectedCount();
  }

  async function handleNewDocument() {
    try {
      if (!isBrowser || !dbService) {
        throw new Error('Database not initialized');
      }
      
      const newDoc = new Document();
      const savedDoc = await dbService.create(newDoc);
      
      console.log('New document created:', savedDoc.id);
      console.log('New document title:', savedDoc.title);
      
      // Refresh recent docs before navigating
      await loadRecentDocs();
      
      await goto(`/docs/${savedDoc.id}`);
    } catch (error) {
      console.error('Failed to create new document:', error);
    }
  }

  function handleFavorites() {
    // TODO: Implement favorites functionality
    console.log('Favorites clicked');
  }

  async function handleDeleteSelected(selectedDocs: Document[]) {
    try {
      if (!dbService) {
        throw new Error('Database not initialized');
      }
      
      if (selectedDocs.length === 0) {
        console.log('No documents selected for deletion');
        return;
      }
      
      console.log(`Deleting ${selectedDocs.length} documents:`, selectedDocs.map(d => d.id));
      
      // Delete each selected document with individual error handling
      for (const doc of selectedDocs) {
        try {
          console.log(`Attempting to delete document: ${doc.id}`);
          const deleteResult = await dbService.delete(doc.id);
          console.log(`Delete result for ${doc.id}:`, deleteResult);
        } catch (deleteError) {
          console.error(`Failed to delete document ${doc.id}:`, deleteError);
        }
      }
      
      // Clear selection
      selectedDocuments.clearSelection();
      updateSelectedCount();
      
      // Add a small delay to ensure database operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh the document list
      console.log('Refreshing document list after deletion...');
      await loadRecentDocs();
      
      console.log('Document list refreshed. New count:', recentDocs.length);
      console.log('Successfully deleted selected documents');
    } catch (error) {
      console.error('Failed to delete selected documents:', error);
    }
  }
</script>

<div class="explorer-container">
  <Explorer 
    documents={recentDocs} 
    {hasLoaded} 
    onDocumentClick={handleDocumentClick}
    {isSelectionMode}
    onSelectionChange={updateSelectedCount}
    onDeleteSelected={handleDeleteSelected}
  />
  
  {#if recentDocs.length > 0}
    <Dock 
      items={[
        {
          id: 'selection-mode',
          icon: '/icons/select-all.png',
          title: isSelectionMode ? `Cancel Selection (${selectedCount})` : 'Select Documents',
          onClick: toggleSelectionMode,
          active: isSelectionMode,
          badge: isSelectionMode ? selectedCount : undefined
        },
        {
          id: 'new-document',
          icon: '/icons/new.png',
          title: 'New Document',
          onClick: handleNewDocument
        },
        {
          id: 'favorites',
          icon: '/icons/heart.png',
          title: 'Favorites',
          onClick: handleFavorites
        }
      ]}
    />
  {/if}
</div>
