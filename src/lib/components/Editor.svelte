<script lang="ts">
  import styles from './Editor.module.scss';
  import { onMount } from 'svelte';
  import { Document } from '$lib/models/Document';
  
  interface Props {
    content?: string | undefined;
    documentId?: string;
    dbService?: any;
    key?: string;
    forceClear?: boolean;
  }
  
  let { content = undefined, documentId, dbService }: Props = $props();
  
  // Reactive state for editor content
  let editorContent = $state(content || '');
  
  // Reference to the editable div
  let editableDiv: HTMLElement;
  
  // Debounce variables
  let debounceTimer: number;
  
  // Track the previous content to detect actual prop changes
  let previousContent = $state(content);
  let previousDocumentId = $state(documentId);
  
  // Set initial content after mount
  onMount(() => {
    console.log('Editor onMount called with content:', JSON.stringify(content));
    const contentToSet: string = content || '';
    if (editableDiv) {
      console.log('Setting editableDiv innerText to:', JSON.stringify(contentToSet));
      editableDiv.innerText = contentToSet;
      editorContent = contentToSet;
      previousContent = contentToSet;
      console.log('Editor content initialized');
    }
  });
  
  // Update content when prop changes from parent
  $effect(() => {
    console.log('Editor effect triggered. Current content prop:', JSON.stringify(content), 'Previous content state:', JSON.stringify(previousContent), 'Current documentId:', documentId, 'Previous documentId:', previousDocumentId);
    const contentToSet: string = content || '';
    
    // Force update if documentId changed OR content changed
    const documentIdChanged = documentId !== previousDocumentId;
    const contentChanged = contentToSet !== previousContent;
    
    if (documentIdChanged || contentChanged) {
      console.log('Updating editor. DocumentId changed:', documentIdChanged, 'Content changed:', contentChanged, 'New content:', JSON.stringify(contentToSet));
      
      if (editableDiv) {
        // Force complete DOM clear using selection API
        const range = document.createRange();
        range.selectNodeContents(editableDiv);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand('delete');
        editableDiv.innerText = contentToSet;
        console.log('DOM cleared using selection API and set to:', JSON.stringify(contentToSet));
      }
      
      editorContent = contentToSet;
      previousContent = contentToSet;
      previousDocumentId = documentId;
      console.log('Editor content updated via effect:', JSON.stringify(contentToSet));
    } else {
      console.log('No update needed. DocumentId and content are the same.');
    }
  });
  
  // Handle input events with debouncing
  async function handleInput(event: Event) {
    const target = event.target as HTMLElement;
    editorContent = target.innerText || '';
    
    // Clear existing timer
    clearTimeout(debounceTimer);
    
    // Set new timer
    debounceTimer = setTimeout(async () => {
      try {
        if (documentId && dbService) {
          // Load existing document
          const existingDoc = await dbService.read(documentId);
          
          if (existingDoc) {
            // Update content
            existingDoc.updateContent(editorContent);
            
            // Save to database
            await dbService.update(existingDoc);
            console.log('Document saved successfully');
          }
        }
      } catch (error) {
        console.error('Failed to save document:', error);
      }
    }, 500); // 500ms delay
  }
</script>

<div class={styles.editorContainer}>
  <div 
    class={styles.contentEditable}
    contenteditable="true"
    oninput={handleInput}
    bind:this={editableDiv}
  >
  </div>
</div>
