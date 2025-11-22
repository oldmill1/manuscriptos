<script lang="ts">
  import Editor from '$lib/components/Editor.svelte';
  import { onMount } from 'svelte';

  let db: any;

  onMount(() => {
    // Initialize PouchDB database called "squiredb"
    db = new PouchDB('squiredb');
    console.log('PouchDB "squiredb" initialized successfully');
  });
</script>

<Editor />
