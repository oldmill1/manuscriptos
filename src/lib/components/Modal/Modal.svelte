<script lang="ts">
  import styles from './Modal.module.scss';
  
  export let content: any = null;
  export let isOpen: boolean = false;
  
  function handleBackdropClick() {
    isOpen = false;
  }
  
  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }
  
  function handleModalClick(event: MouseEvent) {
    event.stopPropagation();
  }
  
  function handleModalKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      isOpen = false;
    }
  }
</script>

{#if isOpen}
  <div 
    class={styles['modal-backdrop']} 
    role="dialog" 
    aria-modal="true"
    aria-labelledby="modal-title"
    on:click={handleBackdropClick}
    on:keydown={handleBackdropKeydown}
    tabindex="-1"
  >
    <div 
      class={styles['modal-content']} 
      role="document"
      on:click={handleModalClick}
      on:keydown={handleModalKeydown}
      tabindex="0"
    >
      {@render content?.()}
    </div>
  </div>
{/if}
