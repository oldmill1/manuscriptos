<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import MenuBar from '$lib/components/MenuBar.svelte';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if $page.url.pathname !== '/' && $page.url.pathname !== '/explorer'}
	<MenuBar />
{/if}

{@render children()}
