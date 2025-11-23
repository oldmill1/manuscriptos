<script lang="ts">
  import styles from './Explorer.module.scss';
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
  }
  
  let { children }: Props = $props();
</script>

<div class={styles.container}>
  {#if children}
    {@render children()}
  {:else}
    <div class={styles.center}>
      <!-- Empty centered area with pastel background -->
    </div>
  {/if}
</div>
