<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { List } from '$lib/models/List';
  import { ListService } from '$lib/services/ListService';
  import Dock, { type DockItem } from '$lib/components/Dock.svelte';
  import Button from '$lib/components/global/Button.svelte';
  import Modal from '$lib/components/Modal/Modal.svelte';
  import VList from '$lib/components/VList/VList.svelte';
  import styles from './+page.module.scss';

  let listService: ListService;
  let isBrowser = false;
  let lists: List[] = [];
  let hasLoaded = false;
  let showNewListModal = false;
  let newListName = '';

  onMount(async () => {
    isBrowser = true;
    
    try {
      const { ListService } = await import('$lib/services/ListService');
      listService = new ListService();
      console.log('ListService initialized successfully');
      
      // Load lists
      await loadLists();
    } catch (error) {
      console.error('Failed to initialize list service:', error);
    }
  });

  async function loadLists() {
    try {
      if (!listService) return;
      
      const allLists = await listService.list();
      console.log('Lists loaded:', allLists);
      
      // Sort by updatedAt to get the most recently updated lists
      lists = allLists.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      hasLoaded = true;
    }
  }

  function handleNewList() {
    newListName = '';
    showNewListModal = true;
  }

  async function createNewList() {
    if (!newListName.trim()) return;
    
    try {
      if (!isBrowser || !listService) {
        throw new Error('List service not initialized');
      }
      
      const newList = new List('custom', newListName.trim());
      const savedList = await listService.create(newList);
      
      console.log('New list created:', savedList.id);
      console.log('New list name:', savedList.name);
      
      // Close modal
      showNewListModal = false;
      newListName = '';
      
      // Refresh lists
      await loadLists();
    } catch (error) {
      console.error('Failed to create new list:', error);
    }
  }

  function handleNewListKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      createNewList();
    } else if (event.key === 'Escape') {
      showNewListModal = false;
    }
  }

  function handleHome() {
    goto('/');
  }

  function handleExplorer() {
    goto('/explorer');
  }

  async function openList(listId: string) {
    // TODO: Navigate to list detail page when implemented
    console.log('Open list:', listId);
  }

  function handleListClick(list: List, event: MouseEvent) {
    openList(list.id);
  }
</script>

<svelte:head>
  <title>Lists - Squire</title>
  <meta name="description" content="Manage your document lists in Squire" />
</svelte:head>

<div class={styles['app-container']}>
  <!-- Main Content -->
  <main>
    <div class={styles['content-wrapper']}>
      <div class={styles['content-header']}>
        <h1 class={styles['lists-title']}>Lists</h1>
      </div>
      
      {#snippet listContentSnippet(list: List)}
        <div class={styles['list-info']}>
          <h3 class={styles['list-name']}>{list.name || 'Untitled List'}</h3>
          <p class={styles['list-type']}>
            {list.type === 'favorites' ? 'Favorites' : 'Custom List'}
            {list.itemIds.length > 0 ? ` • ${list.itemIds.length} items` : ''}
          </p>
        </div>
      {/snippet}

      <div class={styles['lists-list']}>
        <VList 
          items={lists}
          {hasLoaded}
          emptyMessage="No lists found"
          emptyButtonText="Create your first list"
          onEmptyButtonClick={handleNewList}
          onItemClick={handleListClick}
          getItemId={(list) => list.id}
          isItemSelected={() => false}
          renderItemContent={listContentSnippet}
        />
      </div>
      
      <div class={styles['list-controls']}>
        <Button 
          onclick={handleNewList}
          text="New List"
          icon="/icons/new.png"
          alt="New List"
        />
      </div>
    </div>
  </main>

  <!-- Dock -->
  <Dock 
    items={[
      {
        id: 'home',
        icon: '/icons/home.png',
        title: 'Home',
        onClick: handleHome
      },
      {
        id: 'new-list',
        icon: '/icons/new.png',
        title: 'New List',
        onClick: handleNewList
      },
      {
        id: 'explorer',
        icon: '/icons/folder.png',
        title: 'Explorer',
        onClick: handleExplorer
      }
    ]}
  />

  <!-- New List Modal -->
  <Modal 
    bind:isOpen={showNewListModal}
    content={modalContent}
  />

{#snippet modalContent()}
  <div style="padding: 2rem; min-width: 400px;">
    <h2 style="margin: 0 0 1.5rem 0; font-size: 1.5rem; font-weight: 600; color: #333;">
      Create New List
    </h2>
    
    <div style="margin-bottom: 1.5rem;">
      <label 
        for="list-name" 
        style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555;"
      >
        List Name
      </label>
      <input
        id="list-name"
        type="text"
        bind:value={newListName}
        onkeydown={handleNewListKeydown}
        placeholder="Enter list name..."
        style="
          width: 100%; 
          padding: 0.75rem; 
          border: 2px solid #e1e5e9; 
          border-radius: 8px; 
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
        "
        onfocus={(e) => {
          const target = e.target as HTMLInputElement;
          if (target) {
            target.style.borderColor = '#007acc';
          }
        }}
        onblur={(e) => {
          const target = e.target as HTMLInputElement;
          if (target) {
            target.style.borderColor = '#e1e5e9';
          }
        }}
      />
    </div>
    
    <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
      <button
        onclick={() => showNewListModal = false}
        style="
          padding: 0.75rem 1.5rem;
          border: 2px solid #e1e5e9;
          background: white;
          color: #666;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        "
        onmouseover={(e) => {
          const target = e.target as HTMLButtonElement;
          if (target) {
            target.style.background = '#f8f9fa';
            target.style.borderColor = '#d1d5d9';
          }
        }}
        onfocus={(e) => {
          const target = e.target as HTMLButtonElement;
          if (target) {
            target.style.background = '#f8f9fa';
            target.style.borderColor = '#d1d5d9';
          }
        }}
        onmouseout={(e) => {
          const target = e.target as HTMLButtonElement;
          if (target) {
            target.style.background = 'white';
            target.style.borderColor = '#e1e5e9';
          }
        }}
        onblur={(e) => {
          const target = e.target as HTMLButtonElement;
          if (target) {
            target.style.background = 'white';
            target.style.borderColor = '#e1e5e9';
          }
        }}
      >
        Cancel
      </button>
      
      <button
        onclick={createNewList}
        disabled={!newListName.trim()}
        style="
          padding: 0.75rem 1.5rem;
          border: none;
          background: #007acc;
          color: white;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          opacity: {newListName.trim() ? '1' : '0.5'};
        "
        onmouseover={(e) => {
          const target = e.target as HTMLButtonElement;
          if (target && newListName.trim()) {
            target.style.background = '#005fa3';
          }
        }}
        onfocus={(e) => {
          const target = e.target as HTMLButtonElement;
          if (target && newListName.trim()) {
            target.style.background = '#005fa3';
          }
        }}
        onmouseout={(e) => {
          const target = e.target as HTMLButtonElement;
          if (target) {
            target.style.background = '#007acc';
          }
        }}
        onblur={(e) => {
          const target = e.target as HTMLButtonElement;
          if (target) {
            target.style.background = '#007acc';
          }
        }}
      >
        Create
      </button>
    </div>
  </div>
{/snippet}
</div>
