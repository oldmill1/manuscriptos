<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main>
	<h1>Character View</h1>
	<p>Character ID: {data.id}</p>
	<p>Hello World</p>
</main>
