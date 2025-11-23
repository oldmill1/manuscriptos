<script lang="ts">
  import styles from './WidgetArea.module.scss';
  import type { Snippet } from 'svelte';
  import { widgetVisibility, hideWidget } from '$lib/stores/widgetVisibility';
  import AddToListWidget from './AddToListWidget.svelte';
  
  interface Props {
    children?: Snippet;
    title?: string;
    variant?: 'default' | 'compact' | 'expanded';
    class?: string;
    documentId?: string;
  }
  
  let { children, title, variant = 'default', class: className = '', documentId }: Props = $props();
  
  let isVisible = $state(true);
  
  // Subscribe to the store
  $effect(() => {
    const unsubscribe = widgetVisibility.subscribe(value => {
      isVisible = value;
    });
    return unsubscribe;
  });
  
  function toggleVisibility() {
    hideWidget();
  }
</script>

<div class={`${styles.widgetArea} ${!isVisible ? styles.hidden : ''}`}>
  {#if title}
    <div class={styles.header}>
      <div class={styles.titleContainer}>
        <img src="/icons/widget.png" alt="Widget" class={styles.titleIcon} />
        <h2 class={styles.title}>{title}</h2>
      </div>
      <button class={styles.toggleButton} onclick={toggleVisibility}>
        {isVisible ? 'Hide' : 'Show'}
      </button>
    </div>
  {/if}
  
  {#if isVisible}
    <div class={styles.content}>
      {#if documentId}
        <AddToListWidget {documentId} />
      {/if}
      
      {#if children}
        {@render children()}
      {:else if !documentId}
        <div class={styles.placeholder}>
          <p>Widget area content goes here</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
