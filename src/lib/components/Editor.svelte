<script lang="ts">
  import styles from './Editor.module.scss';
  
  interface Props {
    // No props for now - we'll add them as we build out the component
  }
  
  let {}: Props = $props();
  
  // Initial content - first paragraph of Hitchhiker's Guide to the Galaxy
  let content = $state("Far out in the uncharted backwaters of the unfashionable end of the western spiral arm of the Galaxy lies a small unregarded yellow sun. Orbiting this at a distance of roughly ninety-two million miles is an utterly insignificant little blue green planet whose ape-descended life forms are so amazingly primitive that they still think digital watches are a pretty neat idea.");
  
  // Reference to the editable div
  let editableDiv: HTMLElement;
  
  // Basic input handler for now
  function handleInput(event: Event) {
    const target = event.target as HTMLElement;
    content = target.innerText || '';
  }
</script>

<div class={styles.editorContainer}>
  <div 
    class={styles.contentEditable}
    contenteditable="true"
    oninput={handleInput}
    bind:this={editableDiv}
  >
    {content}
  </div>
</div>

