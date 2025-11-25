<script lang="ts">
	import { onMount } from 'svelte';
	import { List } from '$lib/models/List';
	import { ListService } from '$lib/services/ListService';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import Dock, { type DockItem } from '$lib/components/Dock.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import type { PageProps } from './$types';
	import { convertListsToExplorerItems, createExplorerData } from '$lib/components/Explorer/utils';

	let { data }: PageProps = $props();

	let listService: ListService;
	let lists = $state<List[]>([]);
	let hasLoaded = $state(false);

	onMount(async () => {
		try {
			const { ListService } = await import('$lib/services/ListService');
			listService = new ListService();

			// Load lists
			const allLists = await listService.list();
			console.log('Lists loaded:', allLists);

			if (allLists.length === 0) {
				console.log('No lists found');
				lists = [];
			} else {
				lists = allLists.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
			}
		} catch (error) {
			console.error('Failed to load lists:', error);
		} finally {
			hasLoaded = true;
		}
	});

	function handleListClick(list: List, event: MouseEvent) {
		console.log('List clicked:', list.id, list.name);
		// Navigate to the list view
		window.location.href = `/explorer/${list.id}`;
	}

	// Create standardized data for Explorer
	const explorerData = $derived.by(() => {
		if (!hasLoaded) return createExplorerData([], 'list', false);
		return createExplorerData(
			convertListsToExplorerItems(lists, handleListClick),
			'list',
			true
		);
	});

	function handleNewDocument() {
		console.log('New document clicked');
	}

	function handleFavorites() {
		console.log('Favorites clicked');
	}
</script>

<MenuBar title="Explorer" />

<div class="explorer-container">
	<!-- Using the new standardized data interface -->
	<Explorer data={explorerData} />

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
