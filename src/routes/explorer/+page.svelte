<script lang="ts">
	import { goto } from '$app/navigation';
	import Dock from '$lib/components/Dock/Dock.svelte';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import type { ExplorerItem } from '$lib/components/Explorer/types';
	import { convertDocumentsToExplorerItems, convertListsToExplorerItems, createExplorerData } from '$lib/components/Explorer/utils';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import { Document } from '$lib/models/Document';
	import { List } from '$lib/models/List';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { useAppState } from '$lib/stores/appState.svelte';
	import styles from './+page.module.scss';

	let { data }: PageProps = $props();

	// Use centralized app state
	const app = useAppState();
	let explorerData = $state<ExplorerItem[]>([]);

	onMount(async () => {
		try {
			await app.loadRootLevel();
		} catch (error) {
			console.error('Failed to load lists or documents:', error);
		}
	});

	// Create a reactive effect to update explorer data when app state changes
	$effect(() => {
		const allItems = [
			...convertListsToExplorerItems(app.lists),
			...convertDocumentsToExplorerItems(app.documents),
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
		// Create a temporary document with a unique ID and "Untitled Document" name
		const tempId = `temp-doc-${crypto.randomUUID()}`;
		const tempDocument: ExplorerItem = {
			id: tempId,
			name: 'Untitled Document',
			type: 'document',
			icon: '/icons/new.png',
			isTemp: true,
			isEditing: true
		};
		
		app.addTemporaryDocument(tempDocument);
		app.setEditingTempDocumentId(tempId);
	}

	async function handleDocumentCreate(documentName: string, tempId: string) {
		try {
			// Create the actual document
			const savedDocument = await app.createDocument(documentName, '', undefined);
			
			// Remove the temporary document
			app.removeTemporaryDocument(tempId);
			if (app.editingTempDocumentId === tempId) {
				app.setEditingTempDocumentId(null);
			}
			
		} catch (error) {
			console.error('Failed to create document:', error);
		}
	}

	function handleNewFolder() {
		console.log('Creating new folder...');
		
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

	async function handleFolderRename(folderId: string, newName: string) {
		try {
			const folder = app.lists.find((f: List) => f.id === folderId);
			if (!folder) {
				console.error('Folder not found for renaming:', folderId);
				return;
			}
			
			// Update the folder name
			folder.name = newName;
			await app.updateList(folder);
			
		} catch (error) {
			console.error('Failed to rename folder:', error);
		}
	}

	async function handleDocumentRename(documentId: string, newName: string) {
		try {
			// Get the latest version of the document from the database
			const currentDocument = await app.documentService.read(documentId);
			if (!currentDocument) {
				console.error('Document not found for renaming:', documentId);
				return;
			}
			
			// Update the document title on the fresh object
			currentDocument.title = newName;
			
			try {
				await app.updateDocument(currentDocument);
			} catch (updateError: any) {
				// If there's a conflict but the rename worked, just log it and continue
				if (updateError.message?.includes('conflict')) {
					console.log('Document rename completed despite conflict');
					return; // Exit early since the rename worked
				} else {
					throw updateError;
				}
			}
			
		} catch (error) {
			console.error('Failed to rename document:', error);
		}
	}

	function handleFavorites() {
		console.log('Favorites clicked');
	}

	function handleSelectionToggle(enabled: boolean) {
		app.setSelectionMode(enabled);
	}

	async function handleDeleteSelected(selectedDocs: any[]) {
		try {
			console.log('Raw selected items:', selectedDocs.map(item => ({
				id: item.id,
				name: item.name,
				title: item.title,
				isFolder: item.isFolder,
				icon: item.icon
			})));

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
			console.log('Deleting folder:', folderId);
			
			// First, delete all documents in this folder
			const documentsInFolder = await app.loadDocumentsByParentId(folderId);
			if (documentsInFolder.length > 0) {
				console.log(`Deleting ${documentsInFolder.length} documents in folder`);
				const documentDeletePromises = documentsInFolder.map(async (doc) => {
					await app.deleteDocument(doc.id);
				});
				await Promise.all(documentDeletePromises);
			}

			// Then, delete all subfolders recursively
			const subfolders = await app.loadListsByParentId(folderId);
			if (subfolders.length > 0) {
				console.log(`Deleting ${subfolders.length} subfolders recursively`);
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
			console.log('Deleting document:', documentId);
			await app.deleteDocument(documentId);
		} catch (error) {
			console.error('Failed to delete document:', error);
		}
	}

	async function handleFolderCreate(folderName: string, tempId: string) {
		try {
			console.log('Creating folder:', folderName);
			
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

	function handleItemSelect(item: ExplorerItem) {
		console.log('Selected item:', item);
		// Selection logic will be handled by selectedDocuments store
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
		onFolderCreate={handleFolderCreate}
		onFolderRename={handleFolderRename}
		onDocumentCreate={handleDocumentCreate}
		onDocumentRename={handleDocumentRename}
		editingTempFolderId={app.editingTempFolderId}
		editingTempDocumentId={app.editingTempDocumentId}
		folderIds={[]}
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
