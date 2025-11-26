<script lang="ts">
  import { onMount } from 'svelte';
  import { DatabaseService } from '$lib/services/DatabaseService';
  import { ListService } from '$lib/services/ListService';
  import { Document } from '$lib/models/Document';
  import { List } from '$lib/models/List';
  import { DTable } from '$lib/components/data/DTable';
  import { AquaButton } from '$lib/components/Buttons/AquaButton';
  import Modal from '$lib/components/Modal/Modal.svelte';
  import styles from './+page.module.scss';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let dbService: DatabaseService;
  let listService: ListService;
  let items: (Document | List)[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let showBulkAddModal = $state(false);
  let showDeleteModal = $state(false);
  let selectedItems = $state(new Set<string>());

  onMount(async () => {
    try {
      if (data.resource === 'documents') {
        const { DatabaseService } = await import('$lib/services/DatabaseService');
        dbService = new DatabaseService('squiredb');
        
        // Load documents from database
        const allDocs = await dbService.list();
        
        // Sort by createdAt (most recent first) and limit to 10
        items = allDocs
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);
      } else if (data.resource === 'lists') {
        const { ListService } = await import('$lib/services/ListService');
        listService = new ListService('squiredb');
        
        // Load lists from database
        const allLists = await listService.list();
        
        // Sort by createdAt (most recent first) and limit to 10
        items = allLists
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);
      }
      
    } catch (err) {
      console.error('Failed to load items:', err);
      error = `Failed to load ${data.resource} from database`;
    } finally {
      loading = false;
    }
  });
  
  function handleEmptyTable() {
    if (selectedItems.size > 0) {
      showDeleteModal = true;
    }
  }
  
  async function confirmDeleteDocuments() {
    showDeleteModal = false;
    try {
      console.log('Deleting selected documents:', Array.from(selectedItems));
      
      // Initialize DocumentService
      const { DocumentService } = await import('$lib/services/DocumentService');
      const documentService = new DocumentService('squiredb');
      
      // Delete all selected documents
      for (const docId of selectedItems) {
        await documentService.delete(docId);
        console.log(`Deleted document: ${docId}`);
      }
      
      // Clear selection
      selectedItems = new Set();
      
      // Refresh the items list
      if (data.resource === 'documents') {
        const allDocs = await documentService.list();
        items = allDocs
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);
      }
      
      console.log('Successfully deleted selected documents and refreshed table');
    } catch (error) {
      console.error('Failed to delete documents:', error);
      error = 'Failed to delete documents from database';
    }
  }
  
  function cancelDeleteDocuments() {
    showDeleteModal = false;
  }
  
  function handleSelectionChange(selectedIds: Set<string>) {
    selectedItems = selectedIds;
    console.log('Parent component received selection change:', Array.from(selectedIds));
  }
  
  async function handleBulkAddDocuments() {
    showBulkAddModal = true;
  }
  
  function cancelBulkAddDocuments() {
    showBulkAddModal = false;
  }
  
  async function confirmBulkAddDocuments() {
    showBulkAddModal = false;
    try {
      // Generate random documents
      const newDocuments = generateRandomDocuments(10);
      
      // Initialize DocumentService
      const { DocumentService } = await import('$lib/services/DocumentService');
      const documentService = new DocumentService('squiredb');
      
      // Save all documents to database
      for (const doc of newDocuments) {
        await documentService.create(doc);
      }
      
      // Refresh the items list
      const allDocs = await documentService.list();
      items = allDocs
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);
      
      console.log('Successfully added 10 random documents to database');
    } catch (error) {
      console.error('Failed to bulk add documents:', error);
      error = 'Failed to add documents to database';
    }
  }
  
  function generateRandomDocuments(count: number = 10): Document[] {
    const documents: Document[] = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    const titles = [
      'The Answer to Life',
      'Vogon Poetry Analysis',
      'Babel Fish Translation Guide',
      'Pan Galactic Gargle Blaster Recipe',
      'Earth Destruction Notice',
      'Infinite Improbability Drive Manual',
      'Restaurant at the End of Universe Review',
      'So Long and Thanks for All the Fish',
      'Mostly Harmless Planet Survey',
      'Hitchhiker Emergency Protocols',
      'Towel Usage Guidelines',
      'Zaphod Beeblebrox Presidency Notes',
      'Marvin the Paranoid Android Diagnostics',
      'Deep Thought Computing Requirements',
      'Magrathean Construction Plans'
    ];
    
    const contents = [
      'Don\'t panic. The answer is 42, but what is the question?',
      'Oh freddled gruntbuggly, thy micturations are to me as plurdled gabbleblotchits.',
      'The Babel fish is small, yellow, and leechlike, and probably the oddest thing in the universe.',
      'The Pan Galactic Gargle Blaster is like having your brains smashed out with a slice of lemon.',
      'Hyperspace bypass construction notice: Earth scheduled for demolition to make way for.',
      'The Infinite Improbability Drive is a wonderful new method of crossing interstellar space.',
      'The Restaurant at the End of the Universe is one of the most extraordinary ventures.',
      'So long, and thanks for all the fish. The dolphins knew what was coming.',
      'Mostly harmless. A rather optimistic but largely accurate description of Earth.',
      'Always know where your towel is. A towel has immense psychological value.',
      'Time is an illusion. Lunchtime doubly so.',
      'Here I am, brain the size of a planet, and they ask me to take you to the bridge.',
      'I think you ought to know I\'m feeling very depressed.',
      'The ships hung in the sky in much the same way that bricks don\'t.',
      'Forty-two. It was the answer to the ultimate question of life, the universe, and everything.'
    ];
    
    for (let i = 0; i < count; i++) {
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      const randomContent = contents[Math.floor(Math.random() * contents.length)];
      const randomDate = new Date(
        twentyFourHoursAgo.getTime() + Math.random() * (now.getTime() - twentyFourHoursAgo.getTime())
      );
      
      // Create document with title and content
      const doc = new Document(randomTitle, randomContent + ` Additional content for document ${i + 1}.`);
      
      // Override the timestamps with random dates from the past 24 hours
      (doc as any)._createdAt = randomDate;
      (doc as any)._updatedAt = randomDate;
      
      documents.push(doc);
    }
    
    return documents;
  }
</script>

<svelte:head>
  <title>{data.resource} - Data - Squire</title>
  <meta name="description" content="Data management page" />
</svelte:head>

{#if data.resource === 'documents'}
<div class={styles['button-row']}>
  <AquaButton 
    text="Delete" 
    onClick={handleEmptyTable} 
    primary={false}
    dark={true}
    disabled={selectedItems.size === 0}
    type="button"
  />
  <button 
    class={styles['pastel-blue-button']}
    onclick={handleBulkAddDocuments}
  >
    Bulk Add Documents
  </button>
</div>
{/if}

<DTable 
  {items}
  resourceType={data.resource as 'documents' | 'lists'}
  {loading}
  {error}
  empty={items.length === 0 && !loading}
  onSelectionChange={handleSelectionChange}
/>

<Modal
  isOpen={showBulkAddModal}
  dark={true}
  content={() => `
    <h2 style="color: #e0e0e0; margin-bottom: 1rem;">Confirm Bulk Add</h2>
    <p style="color: #b0b0b0; margin-bottom: 0.5rem;">Are you sure you want to add 10 random Hitchhiker's Guide themed documents?</p>
    <p style="color: #b0b0b0; font-size: 0.9rem;">These documents will be saved to the database and appear in your documents list.</p>
  `}
  buttons={[
    { text: 'Cancel', callback: () => { showBulkAddModal = false; }, primary: false },
    { text: 'Add Documents', callback: confirmBulkAddDocuments, primary: true }
  ]}
/>

<Modal
  isOpen={showDeleteModal}
  dark={true}
  content={() => `
    <h2 style="color: #e0e0e0; margin-bottom: 1rem;">Confirm Delete</h2>
    <p style="color: #b0b0b0; margin-bottom: 0.5rem;">Are you sure you want to delete ${selectedItems.size} selected document${selectedItems.size !== 1 ? 's' : ''}?</p>
    <p style="color: #ff6b6b; font-size: 0.9rem;">This action cannot be undone. The documents will be permanently removed from the database.</p>
  `}
  buttons={[
    { text: 'Cancel', callback: cancelDeleteDocuments, primary: false },
    { text: 'Delete Documents', callback: confirmDeleteDocuments, primary: true }
  ]}
/>
