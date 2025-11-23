<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { Document } from '$lib/models/Document';
  import { DatabaseService } from '$lib/services/DatabaseService';
  import { selectedDocuments } from '$lib/stores/selectedDocuments';
  import Dock from '$lib/components/Dock.svelte';
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
      recentDocs = docs.slice(0, 6); // Show last 6 documents
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
      
      const newDoc = new Document('Untitled Document', '');
      const savedDoc = await dbService.create(newDoc);
      
      console.log('New document created:', savedDoc.id);
      await goto(`/docs/${savedDoc.id}`);
    } catch (error) {
      console.error('Failed to create new document:', error);
    }
  }

  function handleFavorites() {
    // TODO: Implement favorites functionality
    console.log('Favorites clicked');
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
      
      <div class={styles['documents-list']}>
        {#each recentDocs as doc (doc.id)}
          <button 
            class={`${styles['document-item']} ${isSelectionMode ? styles['selection-mode'] : ''} ${selectedDocuments.isSelected(doc.id) ? styles['selected'] : ''}`} 
            onclick={(e) => handleDocumentClick(doc, e)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDocumentClick(doc, e as any);
              }
            }}
            type="button"
            transition:fade={{ duration: 300 }}
          >
            {#if isSelectionMode}
              <div class={styles['selection-checkbox']}>
                <input 
                  type="checkbox" 
                  checked={selectedDocuments.isSelected(doc.id)}
                  onchange={() => toggleDocumentSelection(doc)}
                  onclick={(e) => e.stopPropagation()}
                />
              </div>
            {/if}
            <div class={styles['document-info']}>
              <h3 class={styles['document-title']}>{doc.title || 'Untitled Document'}</h3>
              <p class={styles['document-preview']}>
                {doc.content.slice(0, 100) || 'Empty document...'}
              </p>
            </div>
            <div class={styles['document-arrow']}>→</div>
          </button>
        {/each}
        
        {#if hasLoaded && recentDocs.length === 0}
          <div class={styles['empty-state']} transition:fade={{ duration: 300 }}>
            <p>No recent documents</p>
            <button class={styles['create-first-btn']} onclick={handleNewDocument}>
              Create your first document
            </button>
          </div>
        {/if}
      </div>
      
      <div class={styles['selection-controls']}>
        <button 
          class={styles['selection-toggle-btn']} 
          onclick={toggleSelectionMode}
          type="button"
        >
          <img src="/icons/select-all.png" alt="Select" class={styles['select-icon']} />
          <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
        </button>
      </div>
    </div>
  </main>

  <!-- Dock -->
  <Dock 
    onNewDocument={handleNewDocument}
    onFavorites={handleFavorites}
  />
</div>
