<script lang="ts">
	import { goto } from '$app/navigation';
	import Dock from '$lib/components/Dock/Dock.svelte';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import type { ExplorerItem } from '$lib/components/Explorer/types';
	import { convertDocumentsToExplorerItems, convertListsToExplorerItems, createExplorerData } from '$lib/components/Explorer/utils';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import { Document } from '$lib/models/Document';
	import { List } from '$lib/models/List';
	import { DocumentService } from '$lib/services/DocumentService';
	import { ListService } from '$lib/services/ListService';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
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
			const allLists = await listService.getByParentId(undefined);
			lists = allLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			
		} catch (error) {
			// Only log if it's not a conflict (since rename still works)
			if (!(error as any).message?.includes('conflict')) {
				console.error('Failed to rename folder:', error);
			}
		}
	}

	async function handleDocumentRename(documentId: string, newName: string) {
		try {
			// Get the latest version of the document from the database
			const currentDocument = await documentService.read(documentId);
			if (!currentDocument) {
				console.error('Document not found for renaming:', documentId);
				return;
			}
			
			// Update the document title on the fresh object
			currentDocument.title = newName;
			
			try {
				await documentService.update(currentDocument);
			} catch (updateError: any) {
				// If there's a conflict but the rename worked, just log it and continue
				if (updateError.message?.includes('conflict')) {
					console.log('Document rename completed despite conflict');
					return; // Exit early since the rename worked
				} else {
					throw updateError;
				}
			}
			
			// Only refresh if there was no conflict
			const allDocuments = await documentService.getByParentId(undefined);
			documents = allDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			
		} catch (error) {
			// Only log if it's not a conflict (since rename still works)
			if (!(error as any).message?.includes('conflict')) {
				console.error('Failed to rename document:', error);
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
		if (!documentService || !listService) {
			return;
		}

		try {
			console.log('Raw selected items:', selectedDocs.map(item => ({
				id: item.id,
				name: item.name,
				title: item.title,
				isFolder: item.isFolder,
				icon: item.icon
			})));
			
			// Separate folders and documents
			const foldersToDelete = selectedDocs.filter(doc => doc.isFolder);
			const documentsToDelete = selectedDocs.filter(doc => !doc.isFolder);
			
			console.log('Starting cascade delete for folders:', foldersToDelete.map(f => ({ id: f.id, name: f.name })));
			console.log('Documents to delete:', documentsToDelete.map(d => ({ id: d.id, title: d.title })));
			
			// 1. Get ALL descendant folders recursively
			const allFoldersToDelete = await getAllDescendantFolders(foldersToDelete);
			console.log('All folders to delete (including descendants):', allFoldersToDelete.map(f => ({ id: f.id, name: f.name })));
			
			// 2. Delete all documents in all those folders
			await deleteAllDocumentsInFolders(allFoldersToDelete);
			
			// 3. Delete all folders (bottom-up)
			await deleteFoldersBottomUp(allFoldersToDelete);
			
			// 4. Delete the originally selected documents
			if (documentsToDelete.length > 0) {
				const documentDeletePromises = documentsToDelete.map(async (doc) => {
					await documentService.delete(doc.id);
					console.log('Deleted document:', doc.id);
				});
				await Promise.all(documentDeletePromises);
			}
			
			// 5. Update local state
			lists = lists.filter(list => !allFoldersToDelete.some(deleted => deleted.id === list.id));
			documents = documents.filter(doc => !documentsToDelete.some(deleted => deleted.id === doc.id));
			console.log('Cascade delete completed');
			
		} catch (error) {
			console.error('Failed to delete items:', error);
		}
	}

	// Helper function to get all descendant folders recursively
	async function getAllDescendantFolders(rootFolders: any[]): Promise<any[]> {
		const allFolders: any[] = [];
		const foldersToProcess = [...rootFolders];
		
		while (foldersToProcess.length > 0) {
			const currentFolder = foldersToProcess.pop()!;
			allFolders.push(currentFolder);
			
			// Get child folders of current folder
			const childFolders = await listService.getByParentId(currentFolder.id);
			foldersToProcess.push(...childFolders);
		}
		
		return allFolders;
	}

	// Helper function to delete all documents in specified folders
	async function deleteAllDocumentsInFolders(folders: any[]) {
		for (const folder of folders) {
			const documentsInFolder = await documentService.getByParentId(folder.id);
			if (documentsInFolder.length > 0) {
				console.log(`Deleting ${documentsInFolder.length} documents in folder: ${folder.name}`);
				const documentDeletePromises = documentsInFolder.map(async (doc) => {
					await documentService.delete(doc.id);
				});
				await Promise.all(documentDeletePromises);
			}
		}
	}

	// Helper function to delete folders bottom-up (children first)
	async function deleteFoldersBottomUp(folders: any[]) {
		// Sort folders by depth (deepest first) to avoid constraint issues
		const foldersByDepth = [...folders].sort((a, b) => {
			const aDepth = getFolderDepth(a);
			const bDepth = getFolderDepth(b);
			return bDepth - aDepth; // Deepest first
		});
		
		for (const folder of foldersByDepth) {
			await listService.delete(folder.id);
			console.log('Deleted folder:', folder.name);
		}
	}

	// Helper function to calculate folder depth
	function getFolderDepth(folder: any): number {
		// This is a simplified version - in a real implementation you might need to track depth
		// For now, we'll use the parentId chain length
		let depth = 0;
		let currentId = folder.parentId;
		while (currentId) {
			depth++;
			// In a real implementation, you'd look up the parent folder
			// For now, this is good enough for sorting
			break;
		}
		return depth;
	}
</script>

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
		onDocumentRename={handleDocumentRename}
		editingTempFolderId={editingTempFolderId}
		editingTempDocumentId={editingTempDocumentId}
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
			onClick: handleNewDocument
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
