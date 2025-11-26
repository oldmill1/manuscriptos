<script lang="ts">
	import { onMount } from 'svelte';
	import { List } from '$lib/models/List';
	import { ListService } from '$lib/services/ListService';
	import { Document } from '$lib/models/Document';
	import { DocumentService } from '$lib/services/DocumentService';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import Dock, { type DockItem } from '$lib/components/Dock/Dock.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import type { PageProps } from './$types';
	import { convertListsToExplorerItems, convertDocumentsToExplorerItems, createExplorerData } from '$lib/components/Explorer/utils';

	let { data }: PageProps = $props();

	let listService: ListService;
	let documentService: DocumentService;
	let lists = $state<List[]>([]);
	let documents = $state<Document[]>([]);
	let hasLoaded = $state(false);
	let isSelectionMode = $state(false);

	onMount(async () => {
		try {
			const { ListService } = await import('$lib/services/ListService');
			const { DocumentService } = await import('$lib/services/DocumentService');
			listService = new ListService();
			documentService = new DocumentService();

			// Load lists
			const allLists = await listService.list();

			if (allLists.length === 0) {
				lists = [];
				
				// Fetch all documents when no lists exist
				const allDocuments = await documentService.list();
				documents = allDocuments.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
			} else {
				lists = allLists.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
				documents = [];
			}
		} catch (error) {
			console.error('Failed to load lists or documents:', error);
		} finally {
			hasLoaded = true;
		}
	});

	function handleListClick(list: List, event: MouseEvent) {
		// Navigate to the list view
		window.location.href = `/explorer/${list.id}`;
	}

	function handleDocumentClick(document: Document, event: MouseEvent) {
		// Navigate to the document view
		window.location.href = `/docs/${document.id}`;
	}

	// Create standardized data for Explorer
	const explorerData = $derived.by(() => {
		if (!hasLoaded) return createExplorerData([], 'list', false);
		
		if (lists.length === 0) {
			// Show un-listed documents
			return createExplorerData(
				convertDocumentsToExplorerItems(documents, handleDocumentClick),
				'document',
				true
			);
		} else {
			// Show lists
			return createExplorerData(
				convertListsToExplorerItems(lists, handleListClick),
				'list',
				true
			);
		}
	});

	function handleNewDocument() {
		console.log('New document clicked');
	}

	function handleFavorites() {
		console.log('Favorites clicked');
	}

	function handleSelectionToggle(enabled: boolean) {
		isSelectionMode = enabled;
	}

	async function handleDeleteSelected(selectedDocs: any[]) {
		if (!documentService) {
			return;
		}

		try {
			// Delete each selected document
			const deletePromises = selectedDocs.map(async (doc) => {
				await documentService.delete(doc.id);
			});

			await Promise.all(deletePromises);
			
			// Refresh the documents list if we're showing documents
			if (lists.length === 0) {
				const allDocuments = await documentService.list();
				documents = allDocuments.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
			}
		} catch (error) {
			console.error('Failed to delete documents:', error);
		}
	}
</script>

<MenuBar title="Explorer" />

<div class="explorer-container">
	<!-- Using the new standardized data interface -->
	<Explorer 
		data={explorerData} 
		{isSelectionMode}
		showSelectionSwitch={true}
		onSelectionToggle={handleSelectionToggle}
		onDeleteSelected={handleDeleteSelected}
	/>

	{#if lists.length > 0 || documents.length > 0}
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
