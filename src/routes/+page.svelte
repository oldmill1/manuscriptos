<script lang="ts">
  import { goto } from '$app/navigation';
  import Dock from '$lib/components/Dock.svelte';
  import Button from '$lib/components/global/Button.svelte';
  import VList from '$lib/components/VList/VList.svelte';
  import { Document } from '$lib/models/Document';
  import { DatabaseService } from '$lib/services/DatabaseService';
  import { selectedDocuments } from '$lib/stores/selectedDocuments';
  import { onMount } from 'svelte';
  import styles from './+page.module.scss';

  let dbService: DatabaseService;
  let isBrowser = false;
  let recentDocs: Document[] = [];
  let selectedCategory = 'Recents';
  let hasLoaded = false;
  let isSelectionMode = false;

  onMount(async () => {
    isBrowser = true;
    
    try {
      const { DatabaseService } = await import('$lib/services/DatabaseService');
      dbService = new DatabaseService('squiredb');
      console.log('PouchDB "squiredb" initialized successfully');
      
      // Load recent documents
      await loadRecentDocs();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  });

  async function loadRecentDocs() {
    try {
      if (!dbService) return;
      
      const docs = await dbService.list();
      console.log('Documents loaded:', docs);
      
      // Sort by updatedAt to get the latest documents and take 6
      recentDocs = docs
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 6);
    } catch (error) {
      console.error('Failed to load recent documents:', error);
    } finally {
      hasLoaded = true;
    }
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

  function handleExplorer() {
    goto('/explorer');
  }

  async function openDocument(docId: string) {
    await goto(`/docs/${docId}`);
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

  function handleDocumentClick(doc: Document, event: MouseEvent) {
    if (isSelectionMode) {
      event.preventDefault();
      toggleDocumentSelection(doc);
    } else {
      openDocument(doc.id);
    }
  }

  $: selectedCount = selectedDocuments.getSelectedCount();
</script>

<svelte:head>
  <title>Squire</title>
  <meta name="description" content="Welcome to Squire - Your personal writing companion" />
</svelte:head>

<div class={styles['app-container']}>
  <!-- Main Content -->
  <main>
    <div class={styles['content-wrapper']}>
      <div class={styles['content-header']}>
        <h1 class={styles['recents-title']}>Recents</h1>
      </div>
      
      <VList 
      items={recentDocs}
      {hasLoaded}
      {isSelectionMode}
      emptyMessage="No recent documents"
      emptyButtonText="Create your first document"
      onEmptyButtonClick={handleNewDocument}
      onItemClick={handleDocumentClick}
      onToggleSelection={toggleDocumentSelection}
    />
      
      <div class={styles['selection-controls']}>
        <Button 
          onclick={toggleSelectionMode}
          text={isSelectionMode ? 'Cancel' : 'Select'}
          icon="/icons/select-all.png"
          alt="Select"
        />
      </div>
    </div>
  </main>

  <!-- Dock -->
  <Dock 
    items={[
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
      },
      {
        id: 'explorer',
        icon: '/icons/folder.png',
        title: 'Explorer',
        onClick: handleExplorer
      }
    ]}
  />
</div>
