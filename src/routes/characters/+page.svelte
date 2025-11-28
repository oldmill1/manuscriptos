<script lang="ts">
	import ContentLayout from '$lib/components/Layout/ContentLayout.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		console.log('Characters route loaded');
	});
</script>

<ContentLayout>
	<div>
		<h2>Character Explorer Header</h2>
		<p>Breadcrumbs and navigation will go here</p>
		
		<h3>Hello Character Route</h3>
		<p>This is the main content area</p>
		<p>Character items will be displayed here</p>
		
		<p>Selection controls will go here</p>
		<p>No characters yet</p>
	</div>
</ContentLayout>
