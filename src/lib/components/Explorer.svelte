<script lang="ts">
  import styles from './Explorer.module.scss';
  import IconItem from './IconItem.svelte';
  import type { Snippet } from 'svelte';
  import { Document } from '$lib/models/Document';
  import { selectedDocuments } from '$lib/stores/selectedDocuments';
  
  interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file';
    icon?: string;
  }
  
  interface Props {
    children?: Snippet;
    files?: FileItem[];
    documents?: Document[];
    hasLoaded?: boolean;
    onDocumentClick?: (doc: Document, event: MouseEvent) => void;
    isSelectionMode?: boolean;
  }
  
  let { 
    children, 
    files = [], 
    documents = [], 
    hasLoaded = true, 
    onDocumentClick,
    isSelectionMode = false
  }: Props = $props();
  
  // Convert documents to file items for display
  const documentFiles = $derived(documents.map(doc => ({
    id: doc.id,
    name: doc.title || 'Untitled Document',
    type: 'file' as const,
    icon: '/icons/new.png'
  })));
  
  // Use documents if available, otherwise fall back to files or default
  const displayFiles = $derived(
    documents.length > 0 ? documentFiles : 
    files.length > 0 ? files : [
      { id: '1', name: 'Documents', type: 'folder', icon: '/icons/folder.png' },
      { id: '2', name: 'Pictures', type: 'folder', icon: '/icons/folder.png' },
      { id: '3', name: 'Downloads', type: 'folder', icon: '/icons/folder.png' }
    ]
  );

  function handleFileClick(fileId: string, event: MouseEvent) {
    if (onDocumentClick && documents.length > 0) {
      const doc = documents.find(d => d.id === fileId);
      if (doc) {
        onDocumentClick(doc, event);
      }
    }
  }

  function handleCheckboxClick(doc: Document, event: MouseEvent) {
    event.stopPropagation();
    selectedDocuments.toggleDocument(doc);
  }
</script>

<div class={styles.container}>
  {#if children}
    {@render children()}
  {:else}
    <div class={styles.center}>
      <div class={styles.desktop}>
        {#if hasLoaded}
          {#each displayFiles as file (file.id)}
            {@const doc = documents.find(d => d.id === file.id)}
            {@const isSelected = doc ? selectedDocuments.isSelected(doc.id) : false}
            <button 
              type="button"
              class={`${styles.documentButton} ${isSelectionMode ? styles.selectionMode : ''} ${isSelected ? styles.selected : ''}`}
              onclick={(e) => handleFileClick(file.id, e)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleFileClick(file.id, e as any);
                }
              }}
            >
              {#if isSelectionMode && doc}
                <div class={styles.selectionCheckbox}>
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onchange={() => handleCheckboxClick(doc, event as any)}
                    onclick={(e) => e.stopPropagation()}
                  />
                </div>
              {/if}
              <IconItem 
                name={file.name}
                icon={file.icon || '/icons/folder.png'}
              />
            </button>
          {/each}
        {:else}
          <div class={styles.loading}>
            <p>Loading documents...</p>
          </div>
        {/if}
      </div>
      
      {#if hasLoaded && documents.length === 0 && files.length === 0}
        <div class={styles.empty}>
          <p>No documents found</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
