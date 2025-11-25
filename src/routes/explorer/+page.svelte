<script lang="ts">
	import { onMount } from 'svelte';
	import { List } from '$lib/models/List';
	import { ListService } from '$lib/services/ListService';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import Dock, { type DockItem } from '$lib/components/Dock.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let listService: ListService;
	let isBrowser = false;
	let lists = $state<List[]>([]);
	let hasLoaded = $state(false);

	onMount(async () => {
		isBrowser = true;

		try {
			const { ListService } = await import('$lib/services/ListService');
			listService = new ListService();
			console.log('ListService initialized successfully');

			// Load lists only
			await loadLists();
		} catch (error) {
			console.error('Failed to initialize services in Explorer:', error);
		}
	});

	async function loadLists() {
		try {
			if (!listService) return;

			const allLists = await listService.list();
			console.log('Lists loaded:', allLists);

			// Sort by updatedAt to get the most recently updated lists
			lists = allLists.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
		} catch (error) {
			console.error('Failed to load lists:', error);
		} finally {
			hasLoaded = true;
		}
	}

	function handleListClick(list: List, event: MouseEvent) {
		// TODO: Handle list click - for now just log it
		console.log('List clicked:', list.id, list.name);
	}

	function handleNewDocument() {
		// TODO: Implement new document creation
		console.log('New document clicked');
	}

	function handleFavorites() {
		// TODO: Implement favorites functionality
		console.log('Favorites clicked');
	}
</script>

<MenuBar title="Explorer" />

<div class="explorer-container">
	<Explorer
		lists={lists}
		{hasLoaded}
		onListClick={handleListClick}
	/>

	{#if lists.length > 0}
		<Dock
			items={[
				{
					id: 'new-document',
					icon: '/icons/new.png',
					title: 'New Document',
					onClick: handleNewDocument
				},
				{
					id: 'favorites',
					icon: '/icons/heart.png',
					title: 'Favorites',
					onClick: handleFavorites
				}
			]}
		/>
	{/if}
</div>
