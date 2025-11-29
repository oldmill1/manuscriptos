<script lang="ts">
	import { onMount } from 'svelte';
	import { List } from '$lib/models/List';
	import { Document } from '$lib/models/Document';
	import { ListService } from '$lib/services/ListService';
	import { DocumentService } from '$lib/services/DocumentService';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import type { ExplorerItem } from '$lib/components/Explorer/types';
	import { convertDocumentsToExplorerItems, convertListsToExplorerItems, createExplorerData } from '$lib/components/Explorer/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Extract pathArray from SvelteKit data.params
	let pathArray = $state<string[]>([]);

	let listService: ListService;
	let documentService: DocumentService;
	let list = $state<List | null>(null);
	let documents = $state<Document[]>([]);
	let childFolders = $state<List[]>([]);
	let hasLoaded = $state(false);
	let error = $state<string | null>(null);
	let currentFolderId = $state<string | undefined>(undefined);
	let isSelectionMode = $state(false);
	let editingTempFolderId = $state<string | null>(null);
	let editingTempDocumentId = $state<string | null>(null);
	let temporaryFolders = $state<any[]>([]);
	let temporaryDocuments = $state<ExplorerItem[]>([]);

	onMount(async () => {
		try {
			const { ListService } = await import('$lib/services/ListService');
			const { DocumentService } = await import('$lib/services/DocumentService');
						const { PouchDatabase } = await import('$lib/implementations/PouchDatabase');
			const database = new PouchDatabase('manuscriptOS_DB');
			listService = new ListService();
			documentService = new DocumentService(database);
			
			// Load the list - extract pathArray from SvelteKit data
			pathArray = data.path || [];
			const listId = pathArray.length > 0 ? pathArray[pathArray.length - 1] : undefined;
			
			// Set current folder ID for nested folder creation
			currentFolderId = listId;
			if (!listId) {
				error = 'No list specified';
				hasLoaded = true;
				return;
			}
			
			list = await listService.read(listId);
			if (!list) {
				error = 'List not found';
				hasLoaded = true;
				return;
			}

			// Load child folders
			childFolders = await listService.getByParentId(currentFolderId);
			// Sort by creation date, newest first
			childFolders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			// Load documents in this folder using parentId
			documents = await documentService.getByParentId(currentFolderId);
			// Sort by creation date, newest first
			documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			
		} catch (err) {
			console.error('Failed to load list documents:', err);
			error = 'Failed to load list';
		} finally {
			hasLoaded = true;
		}
	});

	async function handleFolderCreate(folderName: string, tempId: string) {
		try {
			// Create the real folder using ListService with parentId
			const newFolder = new List(null, folderName, currentFolderId);
			const savedFolder = await listService.create(newFolder);
			
			// Remove the temporary folder
			temporaryFolders = temporaryFolders.filter(f => f.id !== tempId);
			
			// Clear editing state
			if (editingTempFolderId === tempId) {
				editingTempFolderId = null;
			}
			
			// Add the new folder to childFolders to show it immediately
			const updatedChildFolders = [...childFolders, savedFolder];
			// Sort by creation date, newest first
			updatedChildFolders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			childFolders = updatedChildFolders;
			
		} catch (error) {
			console.error('Failed to create folder:', error);
		}
	}

	async function handleDocumentCreate(documentName: string, tempId: string) {
		try {
			// Create the real document using DocumentService with parentId
			const newDocument = new Document(documentName, '', currentFolderId);
			const savedDocument = await documentService.create(newDocument);
			
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
			
		} catch (error) {
			console.error('Failed to create document:', error);
		}
	}

	function handleDocumentClick(doc: Document, event: MouseEvent) {
		// Navigate to the document in the Editor
		window.location.href = `/docs/${doc.id}`;
	}

	
	function handleFolderClick(folder: List, event: MouseEvent) {
		
		// Build the full path by appending current folder to existing path
		const fullPath = [...pathArray, folder.id];
		const navigationPath = fullPath.join('/');
		
		// Navigate to the folder with full path
		window.location.href = `/explorer/${navigationPath}`;
	}

	function handleNewDocument() {
		// Create a temporary document with a unique ID and "Untitled Document" name
		const tempDocument = {
			id: `temp-doc-${Date.now()}`, // Unique ID using timestamp
			name: 'Untitled Document',
			icon: '/icons/new.png',
			onClick: (item: any, event: MouseEvent) => {
				// Handle click on temporary document (optional - could open rename dialog)
			}
		};
		
		// Add to temporary documents array
		temporaryDocuments = [...temporaryDocuments, tempDocument];
		
		// Set this document as the one being edited
		editingTempDocumentId = tempDocument.id;
	}

	
	function handleBack() {
		window.location.href = '/explorer';
	}

	function handleNewFolder() {
		// Create a temporary folder with a unique ID and "New List" name
		const tempFolder = {
			id: `temp-${Date.now()}`, // Unique ID using timestamp
			name: 'New List',
			icon: '/icons/folder.png',
			onClick: (item: any, event: MouseEvent) => {
				// Handle click on temporary folder (optional - could open rename dialog)
			}
		};
		
		// Add to temporary folders array
		temporaryFolders = [...temporaryFolders, tempFolder];
		
		// Set this folder as the one being edited
		editingTempFolderId = tempFolder.id;
	}

	function handleSelectionToggle(enabled: boolean) {
		isSelectionMode = enabled;
	}

	async function handleDeleteSelected(selectedDocs: any[]) {
		if (!documentService || !listService) {
			return;
		}

		try {
			// Separate folders and documents
			const foldersToDelete = selectedDocs.filter(doc => doc.isFolder);
			const documentsToDelete = selectedDocs.filter(doc => !doc.isFolder);
			
			// 1. Get ALL descendant folders recursively
			const allFoldersToDelete = await getAllDescendantFolders(foldersToDelete);
			
			// 2. Delete all documents in all those folders
			await deleteAllDocumentsInFolders(allFoldersToDelete);
			
			// 3. Delete all folders (bottom-up)
			await deleteFoldersBottomUp(allFoldersToDelete);
			
			// 4. Delete the originally selected documents
			if (documentsToDelete.length > 0) {
				const documentDeletePromises = documentsToDelete.map(async (doc) => {
					await documentService.delete(doc.id);
				});
				await Promise.all(documentDeletePromises);
			}
			
			// 5. Update local state
			childFolders = childFolders.filter(folder => !allFoldersToDelete.some(deleted => deleted.id === folder.id));
			documents = documents.filter(doc => !documentsToDelete.some(deleted => deleted.id === doc.id));
			
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

	async function handleFolderRename(folderId: string, newName: string) {
		try {
			const currentList = await listService.read(folderId);
			if (!currentList) {
				console.error('List not found for renaming:', folderId);
				return;
			}
			
			currentList.name = newName;
			await listService.update(currentList);
			
			// Update just the renamed folder in the local array
			const updatedChildFolders = childFolders.map(folder => {
				if (folder.id === folderId) {
					folder.name = newName;
					return folder;
				}
				return folder;
			});
			childFolders = updatedChildFolders;
			
		} catch (error) {
			console.error('Failed to rename folder:', error);
		}
	}

	async function handleDocumentRename(documentId: string, newName: string) {
		try {
			const currentDocument = await documentService.read(documentId);
			if (!currentDocument) {
				console.error('Document not found for renaming:', documentId);
				return;
			}
			
			currentDocument.title = newName;
			await documentService.update(currentDocument);
			
			// Update just the renamed document in the local array
			const updatedDocuments = documents.map(document => {
				if (document.id === documentId) {
					document.title = newName;
					return document;
				}
				return document;
			});
			documents = updatedDocuments;
			
		} catch (error) {
			console.error('Failed to rename document:', error);
		}
	}

	
	// Create standardized data for Explorer
	const explorerData = $derived.by(() => {
		if (!hasLoaded) return createExplorerData([], 'document', false);
		
		// Combine temporary folders, temporary documents, child folders, and documents
		const temporaryFolderItems = temporaryFolders.map(f => ({ ...f, isFolder: true }));
		const temporaryDocumentItems = temporaryDocuments.map(d => ({ ...d, isFolder: false }));
		const childFolderItems = convertListsToExplorerItems(childFolders, handleFolderClick);
		const documentItems = convertDocumentsToExplorerItems(documents, handleDocumentClick);
		
		// Show temporary items FIRST, then child folders, then documents
		return createExplorerData(
			[...temporaryFolderItems, ...temporaryDocumentItems, ...childFolderItems, ...documentItems],
			'document',
			true
		);
	});
</script>

<div class="explorer-container">
	{#if error}
		<div class="error-message">
			<p>{error}</p>
		</div>
	{:else}
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
			folderIds={pathArray}
		/>
	{/if}
</div>


<style>
	.explorer-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.error-message {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 400px;
		color: #ff6b6b;
		font-size: 18px;
	}
</style>
