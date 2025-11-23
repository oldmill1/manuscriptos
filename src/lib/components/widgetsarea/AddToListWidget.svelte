<script lang="ts">
  import styles from './WidgetArea.module.scss';
  import { List, type ListType } from '$lib/models/List';
  import { ListService } from '$lib/services/ListService';
  
  interface Props {
    documentId: string;
  }
  
  let { documentId }: Props = $props();
  
  let listService: ListService | null = null;
  let lists = $state<List[]>([]);
  let newListName = $state('');
  let isLoading = $state(false);
  let documentListsCount = $state(0);
  let documentLists = $state<List[]>([]);
  
  // Initialize list service and load data
  $effect(() => {
    if (typeof window !== 'undefined' && documentId) {
      const initializeAndLoad = async () => {
        try {
          listService = new ListService();
          await loadLists();
        } catch (error) {
          console.error('Failed to initialize list service:', error);
        }
      };
      initializeAndLoad();
    }
  });
  
  async function loadLists() {
    if (!listService) return;
    
    try {
      lists = await listService.list();
      // Get the actual lists that contain this document
      documentLists = lists.filter(list => list.hasItem(documentId));
      // Count how many lists contain this document
      documentListsCount = documentLists.length;
    } catch (error) {
      console.error('Failed to load lists:', error);
    }
  }
  
  async function removeFromList(list: List) {
    if (!listService) return;
    
    try {
      list.removeItem(documentId);
      await listService.update(list);
      await loadLists(); // Reload to update the UI
    } catch (error) {
      console.error('Failed to remove from list:', error);
    }
  }
  
  async function toggleListAssociation(list: List, isChecked: boolean) {
    if (!listService) return;
    
    if (isChecked) {
      // Add document to list
      if (!list.hasItem(documentId)) {
        list.addItem(documentId);
        await listService.update(list);
      }
    } else {
      // Remove document from list
      await removeFromList(list);
    }
    
    // Reload to update the UI
    await loadLists();
  }
  
  async function addToList(listName: string) {
    if (!listService || !listName.trim()) return;
    
    isLoading = true;
    try {
      // Check if a list with this name already exists
      let existingList = lists.find(list => 
        list.type === 'custom' && list.name.toLowerCase() === listName.trim().toLowerCase()
      );
      
      if (existingList) {
        // Add document to existing list if not already there
        if (!existingList.hasItem(documentId)) {
          existingList.addItem(documentId);
          await listService.update(existingList);
        }
      } else {
        // Create new list and add document
        const newList = new List('custom', listName.trim());
        newList.addItem(documentId);
        await listService.create(newList);
      }
      
      // Clear input and reload lists
      newListName = '';
      await loadLists();
    } catch (error) {
      console.error('Failed to add to list:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addToList(newListName);
    }
  }
</script>

<div class={styles.widget}>
  <div class={styles.widgetHeader}>
    <div class={styles.widgetTitle}>
      <img src="/icons/cabinet.png" alt="Lists" class={styles.widgetIcon} />
      Add to Folder
    </div>
    {#if documentListsCount > 0}
      <div class={styles.listCount}>
        <img src="/icons/cabinet.png" alt="In lists" class={styles.checkmarkIcon} />
        {documentListsCount}
      </div>
    {/if}
  </div>
  
  <div class={styles.widgetContent}>
    <input
      type="text"
      bind:value={newListName}
      placeholder="Type folder name..."
      class={styles.listInput}
      onkeydown={handleInputKeydown}
      disabled={isLoading}
    />
    {#if isLoading}
      <div class={styles.loading}>Adding...</div>
    {/if}
    
    {#if documentLists.length > 0}
      <div class={styles.listsContainer}>
        {#each documentLists as list}
          <label class={styles.listCheckbox}>
            <input
              type="checkbox"
              checked={true}
              onchange={(e) => {
                const target = e.target as HTMLInputElement;
                if (target) {
                  toggleListAssociation(list, target.checked);
                }
              }}
            />
            <span class={styles.checkboxText}>{list.name}</span>
          </label>
        {/each}
      </div>
    {/if}
  </div>
</div>
