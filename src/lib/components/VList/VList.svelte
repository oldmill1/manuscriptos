<script lang="ts" generics="T">
  import { fade } from 'svelte/transition';
  import { selectedDocuments } from '$lib/stores/selectedDocuments';
  import styles from './VList.module.scss';

  export let items: T[] = [];
  export let hasLoaded: boolean = false;
  export let isSelectionMode: boolean = false;
  export let emptyMessage: string = 'No items found';
  export let emptyButtonText: string = 'Create your first item';
  export let onEmptyButtonClick: () => void = () => {};
  export let onItemClick: (item: T, event: MouseEvent) => void = () => {};
  export let onToggleSelection: (item: T) => void = () => {};
  export let getItemId: (item: T) => string = (item) => (item as any).id;
  export let isItemSelected: (item: T) => boolean = (item) => selectedDocuments.isSelected(getItemId(item));
  export let renderItemContent: import('svelte').Snippet<[T]> = defaultItemContent;

  function handleItemClick(item: T, event: MouseEvent) {
    onItemClick(item, event);
  }

  function toggleItemSelection(item: T) {
    onToggleSelection(item);
  }
</script>

{#snippet defaultItemContent(item: T)}
  <div class={styles['item-info']}>
    <h3 class={styles['item-title']}>{item.title || 'Untitled'}</h3>
    <p class={styles['item-preview']}>
      {item.content ? item.content.slice(0, 100) : ''}
    </p>
  </div>
{/snippet}

<div class={styles['items-list']}>
  {#each items as item (getItemId(item))}
    <button 
      class={`${styles['item']} ${isSelectionMode ? styles['selection-mode'] : ''} ${isItemSelected(item) ? styles['selected'] : ''}`} 
      onclick={(e) => handleItemClick(item, e)}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleItemClick(item, e as any);
        }
      }}
      type="button"
      transition:fade={{ duration: 300 }}
    >
      {#if isSelectionMode}
        <div class={styles['selection-checkbox']}>
          <input 
            type="checkbox" 
            checked={isItemSelected(item)}
            onchange={() => toggleItemSelection(item)}
            onclick={(e) => e.stopPropagation()}
          />
        </div>
      {/if}
      {@render renderItemContent(item)}
      <div class={styles['item-arrow']}>→</div>
    </button>
  {/each}
  
  {#if hasLoaded && items.length === 0}
    <div class={styles['empty-state']} transition:fade={{ duration: 300 }}>
      <p>{emptyMessage}</p>
      <button class={styles['create-first-btn']} onclick={onEmptyButtonClick}>
        {emptyButtonText}
      </button>
    </div>
  {/if}
</div>
