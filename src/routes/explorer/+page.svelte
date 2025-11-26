<script lang="ts">
	import { onMount } from 'svelte';
	import { List } from '$lib/models/List';
	import { ListService } from '$lib/services/ListService';
	import { Document } from '$lib/models/Document';
	import { DocumentService } from '$lib/services/DocumentService';
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import Dock, { type DockItem } from '$lib/components/Dock/Dock.svelte';
	import StatusBar from '$lib/components/Editor/StatusBar.svelte';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import type { PageProps } from './$types';
	import { convertListsToExplorerItems, convertDocumentsToExplorerItems, createExplorerData } from '$lib/components/Explorer/utils';
	import type { ExplorerItem } from '$lib/components/Explorer/types';
	import styles from './+page.module.scss';

	let { data }: PageProps = $props();

	let listService: ListService;
	let documentService: DocumentService;
	let lists = $state<List[]>([]);
	let documents = $state<Document[]>([]);
	let temporaryFolders = $state<ExplorerItem[]>([]);
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
			lists = allLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			// Always load unlisted documents (recentones not in any list)
			const allDocuments = await documentService.list();
			// TODO: Filter out documents that are already in lists when you have that data
			documents = allDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
		
		// Combine both lists and documents
		const listItems = convertListsToExplorerItems(lists, handleListClick);
		const documentItems = convertDocumentsToExplorerItems(documents, handleDocumentClick);
		
		// Show lists first, then temporary folders, then unlisted documents
		return createExplorerData(
			[...listItems, ...temporaryFolders, ...documentItems],
			'list', // Keep as 'list' type for compatibility
			true
		);
	});

	function handleNewDocument() {
		console.log('New document clicked');
	}

	function handleNewFolder() {
		// Create a temporary folder with a unique ID and "New List" name
		
		const tempFolder: ExplorerItem = {
			id: `temp-${Date.now()}`, // Unique ID using timestamp
			name: 'New List',
			icon: '/icons/folder.png',
			onClick: (item: ExplorerItem, event: MouseEvent) => {
				// Handle click on temporary folder (optional - could open rename dialog)
				console.log('Temporary folder clicked:', item);
			}
		};
		
		// Add to temporary folders array
		temporaryFolders = [...temporaryFolders, tempFolder];
		
		// Auto-select the new folder for editing
		selectedDocuments.addDocument(tempFolder);
	}
	
	async function handleFolderCreate(folderName: string, tempId: string) {
		try {
			// Create the real folder using ListService
			const newFolder = new List('custom', folderName);
			const savedFolder = await listService.create(newFolder);
			
			// Remove the temporary folder
			temporaryFolders = temporaryFolders.filter(f => f.id !== tempId);
			
			// Add the real folder to the lists array (it will appear first due to sorting)
			lists = [savedFolder, ...lists];
			
			// Clear selection
			selectedDocuments.removeDocument(tempId);
			
			console.log('Folder created successfully:', savedFolder.name);
		} catch (error) {
			console.error('Failed to create folder:', error);
		}
	}

	function handleFavorites() {
		console.log('Favorites clicked');
	}

	function handleSelectionToggle(enabled: boolean) {
		isSelectionMode = enabled;
	}

	async function handleDeleteSelected(selectedDocs: any[]) {
		if (!documentService && !listService) {
			return;
		}

		try {
			// Separate documents and lists by their icon/type
			const documentsToDelete = selectedDocs.filter(doc => doc.icon === '/icons/new.png');
			const listsToDelete = selectedDocs.filter(doc => doc.icon === '/icons/folder.png');
			
			// Delete documents
			if (documentsToDelete.length > 0 && documentService) {
				const documentDeletePromises = documentsToDelete.map(async (doc) => {
					await documentService.delete(doc.id);
				});
				await Promise.all(documentDeletePromises);
			}
			
			// Delete lists
			if (listsToDelete.length > 0 && listService) {
				const listDeletePromises = listsToDelete.map(async (list) => {
					await listService.delete(list.id);
				});
				await Promise.all(listDeletePromises);
			}
			
			// Refresh both lists and documents
			const allLists = await listService.list();
			lists = allLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			
			const allDocuments = await documentService.list();
			documents = allDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		} catch (error) {
			console.error('Failed to delete items:', error);
		}
	}
</script>

<MenuBar title="Explorer" />

<div class={styles['explorer-container']}>
	<!-- Using the new standardized data interface -->
	<Explorer 
		data={explorerData} 
		{isSelectionMode}
		showSelectionSwitch={true}
		onSelectionToggle={handleSelectionToggle}
		onDeleteSelected={handleDeleteSelected}
		onNewFolder={handleNewFolder}
		onFolderCreate={handleFolderCreate}
	/>

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
</div>
