<script lang="ts">
  import styles from './ExplorerDock.module.scss';

  export let onToggleSelectionMode: () => void;
  export let isSelectionMode: boolean = false;
  export let selectedCount: number = 0;
</script>

<div class={styles['dock']}>
  <button 
    class={`${styles['dock-item']} ${isSelectionMode ? styles['active'] : ''}`}
    onclick={onToggleSelectionMode}
    title={isSelectionMode ? `Cancel Selection (${selectedCount})` : 'Select Documents'}
  >
    <img 
      src="/icons/select-all.png" 
      alt={isSelectionMode ? 'Cancel Selection' : 'Select Documents'} 
      class={styles['dock-icon']} 
    />
    {#if isSelectionMode && selectedCount > 0}
      <span class={styles['selection-count']}>{selectedCount}</span>
    {/if}
  </button>
</div>
