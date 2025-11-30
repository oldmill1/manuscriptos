<script lang="ts">
	import { goto } from '$app/navigation';
	import Dock from '$lib/components/Dock/Dock.svelte';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import type { ExplorerItem } from '$lib/components/Explorer/types';
	import { convertDocumentsToExplorerItems, convertListsToExplorerItems } from '$lib/components/Explorer/utils';
	import { ExplorerService } from '$lib/services/ExplorerService';
	import { useAppState } from '$lib/stores/appState.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import styles from './+page.module.scss';

	let { data }: PageProps = $props();

	// Use centralized app state
	const app = useAppState();
	const explorerService = new ExplorerService(app);
	let explorerData = $state<ExplorerItem[]>([]);

	onMount(async () => {
		try {
			await app.loadRootLevel();
			// Set context for root level (no parent folder)
			app.setCurrentParentId(undefined);
			// Step 2 Test: Set appState.currentParentId to undefined (root level)
		} catch (error) {
			console.error('Failed to load lists or documents:', error);
		}
	});

	// Create a reactive effect to update explorer data when app state changes
	$effect(() => {
		const allItems = [
			...convertListsToExplorerItems(app.lists.filter(list => list.parentId === undefined)),
			...convertDocumentsToExplorerItems(app.documents.filter(doc => doc.parentId === undefined)),
			...app.temporaryFolders,
			...app.temporaryDocuments
		];
		
		// Add onClick function to each item for navigation
		const itemsWithClickHandlers = allItems.map(item => ({
			...item,
			onClick: (clickedItem: any, event: MouseEvent) => {
				if (clickedItem.type === 'document') {
					goto(`/docs/${clickedItem.id}`);
				} else if (clickedItem.type === 'list') {
					goto(`/explorer/${clickedItem.id}`);
				} else {
					// Fallback for items without type property
					if (clickedItem.isFolder) {
						goto(`/explorer/${clickedItem.id}`);
					} else {
						goto(`/docs/${clickedItem.id}`);
					}
				}
			}
		}));
		
		explorerData = itemsWithClickHandlers;
	});

	function handleNewDocument() {
		// Use ExplorerService function
		explorerService.document.new();
	}

	async function handleDocumentCreate(documentName: string, tempId: string) {
		await explorerService.document.new(documentName, tempId, undefined);
	}

	
	// Helper function to get current parent ID based on URL path
	function getCurrentParentId(): string | undefined {
		// Extract parent ID from URL if we're in a nested folder
		const pathParts = window.location.pathname.split('/').filter(part => part);
		if (pathParts.length > 1 && pathParts[0] === 'explorer') {
			return pathParts[pathParts.length - 1]; // Last segment is the parent ID
		}
		return undefined; // Root level
	}

	function handleNewFolder() {
		// Create a temporary folder with a unique ID and "New List" name
		const tempId = `temp-${crypto.randomUUID()}`;
		const tempFolder: ExplorerItem = {
			id: tempId,
			name: 'New List',
			type: 'list',
			icon: '/icons/folder.png',
			isTemp: true,
			isEditing: true
		};
		
		app.addTemporaryFolder(tempFolder);
		app.setEditingTempFolderId(tempId);
	}

	function handleNewCharacter() {
		// Create a temporary character list with a unique ID and "New Character" name
		const tempId = `temp-char-${crypto.randomUUID()}`;
		const tempCharacter: ExplorerItem = {
			id: tempId,
			name: 'New Character',
			type: 'list',
			icon: '/icons/folder.png',
			isTemp: true,
			isEditing: true,
			listType: 'character'
		};
		
		app.addTemporaryFolder(tempCharacter);
		app.setEditingTempFolderId(tempId);
	}

	function handleNewManuscript() {
		// Create a temporary manuscript list with a unique ID and "New Manuscript" name
		const tempId = `temp-manuscript-${crypto.randomUUID()}`;
		const tempManuscript: ExplorerItem = {
			id: tempId,
			name: 'New Manuscript',
			type: 'list',
			icon: '/icons/folder.png',
			isTemp: true,
			isEditing: true,
			listType: 'manuscript'
		};
		
		app.addTemporaryFolder(tempManuscript);
		app.setEditingTempFolderId(tempId);
	}

	async function handleFolderRename(folderId: string, newName: string) {
		await explorerService.list.update('name', folderId, newName);
	}

	async function handleDocumentRename(documentId: string, newName: string) {
		await explorerService.document.update('name', documentId, newName);
	}

	
	function handleFavorites() {
		// Navigate to favorites page
		goto('/favorites');
	}

	function handleSelectionToggle(enabled: boolean) {
		app.setSelectionMode(enabled);
	}

	async function handleDeleteSelected(selectedDocs: any[]) {
		try {
			// Separate documents and folders
			const documentsToDelete = selectedDocs.filter(item => !item.isFolder);
			const foldersToDelete = selectedDocs.filter(item => item.isFolder);

			// Delete documents
			for (const doc of documentsToDelete) {
				await app.deleteDocument(doc.id);
			}

			// Delete folders (recursively)
			for (const folder of foldersToDelete) {
				await handleFolderDelete(folder.id);
			}

		} catch (error) {
			console.error('Failed to delete selected items:', error);
		}
	}

	async function handleFolderDelete(folderId: string) {
		try {
			// First, delete all documents in this folder
			const documentsInFolder = await app.loadDocumentsByParentId(folderId);
			if (documentsInFolder.length > 0) {
				const documentDeletePromises = documentsInFolder.map(async (doc) => {
					await app.deleteDocument(doc.id);
				});
				await Promise.all(documentDeletePromises);
			}

			// Then, delete all subfolders recursively
			const subfolders = await app.loadListsByParentId(folderId);
			if (subfolders.length > 0) {
				const folderDeletePromises = subfolders.map(async (subfolder) => {
					await handleFolderDelete(subfolder.id); // Recursive call
				});
				await Promise.all(folderDeletePromises);
			}

			// Finally, delete the folder itself
			await app.deleteList(folderId);
			
		} catch (error) {
			console.error('Failed to delete folder:', error);
		}
	}

	async function handleDocumentDelete(documentId: string) {
		try {
			await app.deleteDocument(documentId);
		} catch (error) {
			console.error('Failed to delete document:', error);
		}
	}

	async function handleFolderCreate(folderName: string, tempId: string) {
		try {
			// Create the actual folder
			const savedFolder = await app.createList(folderName, undefined);
			
			// Remove the temporary folder
			app.removeTemporaryFolder(tempId);
			if (app.editingTempFolderId === tempId) {
				app.setEditingTempFolderId(null);
			}
			
		} catch (error) {
			console.error('Failed to create folder:', error);
		}
	}

	async function handleCharacterCreate(characterName: string, tempId: string) {
		try {
			// Create the actual character list
			const savedCharacter = await app.createCharacterList(characterName, undefined);
			
			// Remove the temporary character
			app.removeTemporaryFolder(tempId);
			if (app.editingTempFolderId === tempId) {
				app.setEditingTempFolderId(null);
			}
			
		} catch (error) {
			console.error('Failed to create character:', error);
		}
	}

	async function handleManuscriptCreate(manuscriptName: string, tempId: string) {
		try {
			// Create the actual manuscript list
			const savedManuscript = await app.createManuscriptList(manuscriptName, undefined);
			
			// Remove the temporary manuscript
			app.removeTemporaryFolder(tempId);
			if (app.editingTempFolderId === tempId) {
				app.setEditingTempFolderId(null);
			}
			
		} catch (error) {
			console.error('Failed to create manuscript:', error);
		}
	}

	function handleItemSelect(item: ExplorerItem) {
		// Selection logic will be handled by selectedDocuments store
	}

	// Copy/Paste handlers
	async function handleCopySelected() {
		// handleCopySelected called
		await app.copySelected();
	}

	async function handleCutSelected() {
		// handleCutSelected called
		app.cutSelected();
	}

	async function handlePasteSelected() {
		// handlePasteSelected called - PASTE BUTTON WORKS!
		const currentParentId = getCurrentParentId();
		// Current parent ID for paste
		await app.pasteClipboard(currentParentId);
	}
</script>

<div class={styles['explorer-container']}>
	<!-- Using the new standardized data interface -->
	<Explorer 
		data={{
			items: explorerData,
			type: 'document',
			hasLoaded: app.hasLoaded
		}} 
		isSelectionMode={app.isSelectionMode}
		showSelectionSwitch={true}
		onSelectionToggle={handleSelectionToggle}
		onDeleteSelected={handleDeleteSelected}
		onNewFolder={handleNewFolder}
		onNewDocument={handleNewDocument}
		onNewCharacter={handleNewCharacter}
		onNewManuscript={handleNewManuscript}
		onFolderCreate={handleFolderCreate}
		onFolderRename={handleFolderRename}
		onDocumentCreate={handleDocumentCreate}
		onDocumentRename={handleDocumentRename}
		onCharacterCreate={handleCharacterCreate}
		onManuscriptCreate={handleManuscriptCreate}
		onCopySelected={handleCopySelected}
		onCutSelected={handleCutSelected}
		onPasteSelected={handlePasteSelected}
		editingTempFolderId={app.editingTempFolderId}
		editingTempDocumentId={app.editingTempDocumentId}
		folderIds={[]}
		currentListType={null}
		currentListName={''}
	/>
</div>

<!-- Dock -->
<Dock
	items={[
		{
			id: 'home',
			icon: '/icons/logo-small.png',
			title: 'Home',
			onClick: () => goto('/')
		},
		{
			id: 'new-document',
			icon: '/icons/new.png',
			title: 'New Document',
			onClick: () => handleNewDocument()
		},
		{
			id: 'favorites',
			icon: '/icons/heart.png',
			title: 'Favorites',
			onClick: () => goto('/favorites')
		},
		{
			id: 'explorer',
			icon: '/icons/folder.png',
			title: 'Explorer',
			onClick: () => goto('/explorer')
		}
	]}
/>
