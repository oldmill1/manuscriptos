<script lang="ts">
  import Explorer from '$lib/components/Explorer.svelte';
  import type { PageProps } from './$types';
  
  let { data }: PageProps = $props();
</script>

<Explorer />
