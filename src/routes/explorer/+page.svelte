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
	let temporaryDocuments = $state<ExplorerItem[]>([]);
	let hasLoaded = $state(false);
	let isSelectionMode = $state(false);
	let editingTempFolderId = $state<string | null>(null);
	let editingTempDocumentId = $state<string | null>(null);

	onMount(async () => {
		try {
			const { ListService } = await import('$lib/services/ListService');
			const { DocumentService } = await import('$lib/services/DocumentService');
			listService = new ListService();
			documentService = new DocumentService();

			// Load lists - only root level (parentId: undefined)
			const allLists = await listService.getByParentId(undefined);
			lists = allLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			// Load documents - only root level (parentId: undefined)
			const rootDocuments = await documentService.getByParentId(undefined);
			documents = rootDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
		
		// Show temporary folders and documents FIRST, then lists, then unlisted documents
		const temporaryFolderItems = temporaryFolders.map(f => ({ ...f, isFolder: true }));
		const temporaryDocumentItems = temporaryDocuments.map(d => ({ ...d, isFolder: false }));
		return createExplorerData(
			[...temporaryFolderItems, ...temporaryDocumentItems, ...listItems, ...documentItems],
			'list', // Keep as 'list' type for compatibility
			true
		);
	});

	function handleNewDocument() {
		console.log('New document clicked in root explorer');
		
		// Create a temporary document with a unique ID and "Untitled Document" name
		const tempDocument = {
			id: `temp-doc-${Date.now()}`, // Unique ID using timestamp
			name: 'Untitled Document',
			icon: '/icons/new.png',
			onClick: (item: any, event: MouseEvent) => {
				// Handle click on temporary document (optional - could open rename dialog)
			}
		};
		
		console.log('Created temp document in root:', tempDocument.id);
		
		// Add to temporary documents array
		temporaryDocuments = [...temporaryDocuments, tempDocument];
		
		// Set this document as the one being edited
		editingTempDocumentId = tempDocument.id;
	}

	async function handleDocumentCreate(documentName: string, tempId: string) {
		try {
			console.log('Creating document in root:', documentName, 'from temp:', tempId);
			
			// Create the real document using DocumentService with parentId: undefined for root
			const newDocument = new Document(documentName, '', undefined);
			const savedDocument = await documentService.create(newDocument);
			
			console.log('Document created successfully in root');
			
			// Remove the temporary document
			temporaryDocuments = temporaryDocuments.filter(d => d.id !== tempId);
			
			// Clear editing state
			if (editingTempDocumentId === tempId) {
				editingTempDocumentId = null;
			}
			
			// Add the new document to documents to show it immediately
			const updatedDocuments = [...documents, savedDocument];
			// Sort by creation date, newest first
			updatedDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			documents = updatedDocuments;
			console.log('Added new document to documents:', savedDocument.title);
			
		} catch (error) {
			console.error('Failed to create document:', error);
		}
	}

	function handleNewFolder() {
		console.log('Creating new folder...');
		
		// Create a temporary folder with a unique ID and "New List" name
		
		const tempFolder: ExplorerItem = {
			id: `temp-${Date.now()}`, // Unique ID using timestamp
			name: 'New List',
			icon: '/icons/folder.png',
			onClick: (item: ExplorerItem, event: MouseEvent) => {
				// Handle click on temporary folder (optional - could open rename dialog)
			}
		};
		
		console.log('Created temp folder:', tempFolder.id);
		
		// Add to temporary folders array
		temporaryFolders = [...temporaryFolders, tempFolder];
		
		// Set this folder as the one being edited
		editingTempFolderId = tempFolder.id;
	}
	
	async function handleFolderCreate(folderName: string, tempId: string) {
		try {
			console.log('Creating folder:', folderName, 'from temp:', tempId);
			
			// Create the real folder using ListService
			const newFolder = new List('custom', folderName);
			const savedFolder = await listService.create(newFolder);
			
			console.log('Folder created successfully, removing temp folder');
			
			// Remove the temporary folder
			temporaryFolders = temporaryFolders.filter(f => f.id !== tempId);
			
			// Clear editing state
			if (editingTempFolderId === tempId) {
				editingTempFolderId = null;
			}
			
			// Add the real folder to the lists array (it will appear first due to sorting)
			lists = [savedFolder, ...lists];
			
			console.log('Temporary folders after removal:', temporaryFolders.map(f => ({ id: f.id, name: f.name })));
			
		} catch (error) {
			console.error('Failed to create folder:', error);
		}
	}
	
	async function handleFolderRename(folderId: string, newName: string) {
		try {
			// Get the latest version of the list from the database
			const currentList = await listService.read(folderId);
			if (!currentList) {
				console.error('List not found for renaming:', folderId);
				return;
			}
			
			// Update the list name on the fresh object
			currentList.name = newName;
			
			try {
				await listService.update(currentList);
			} catch (updateError: any) {
				// If there's a conflict but the rename worked, just log it and continue
				if (updateError.message?.includes('conflict')) {
					console.log('Rename completed despite conflict');
					return; // Exit early since the rename worked
				} else {
					throw updateError;
				}
			}
			
			// Only refresh if there was no conflict
			const allLists = await listService.list();
			lists = allLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			
		} catch (error) {
			// Only log if it's not a conflict (since rename still works)
			if (!(error as any).message?.includes('conflict')) {
				console.error('Failed to rename folder:', error);
			}
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
		onNewDocument={handleNewDocument}
		onFolderCreate={handleFolderCreate}
		onFolderRename={handleFolderRename}
		onDocumentCreate={handleDocumentCreate}
		editingTempFolderId={editingTempFolderId}
		editingTempDocumentId={editingTempDocumentId}
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
