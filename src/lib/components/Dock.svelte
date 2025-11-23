<script lang="ts">
  import styles from './Dock.module.scss';

  export interface DockItem {
    id: string;
    icon: string;
    title: string;
    onClick: () => void;
    active?: boolean;
    badge?: number;
  }

  export type { DockItem };

  export let items: DockItem[] = [];
</script>

<div class={styles['dock']}>
  {#each items as item (item.id)}
    <button 
      class={`${styles['dock-item']} ${item.active ? styles['active'] : ''}`}
      onclick={item.onClick}
      title={item.title}
    >
      <img 
        src={item.icon} 
        alt={item.title} 
        class={styles['dock-icon']} 
      />
      {#if item.badge && item.badge > 0}
        <span class={styles['selection-count']}>{item.badge}</span>
      {/if}
    </button>
  {/each}
</div>
