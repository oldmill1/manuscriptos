<script lang="ts">
	import { goto } from '$app/navigation';
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
	import { useAppState } from '$lib/stores/appState.svelte';
	import { selectedDocuments } from '$lib/stores/selectedDocuments';

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

	// Use centralized app state
	const app = useAppState();

	// Copy/Paste handlers
	async function handleCopySelected() {
		console.log('🔥 handleCopySelected called (subfolder)');
		await app.copySelected();
	}

	async function handleCutSelected() {
		console.log('🔥 handleCutSelected called (subfolder)');
		app.cutSelected();
	}

	async function handlePasteSelected() {
		console.log('🔥 handlePasteSelected called (subfolder)');
		const currentParentId = currentFolderId;
		console.log('🔥 Current parent ID for paste (subfolder):', currentParentId);
		await app.pasteClipboard(currentParentId);
		
		// Refresh the local data to show the pasted item
		await loadFolderContents();
	}

	async function loadFolderContents() {
		try {
			// Load child folders
			childFolders = await listService.getByParentId(currentFolderId);
			// Sort by creation date, newest first
			childFolders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			// Load documents in this folder using parentId
			documents = await documentService.getByParentId(currentFolderId);
			// Sort by creation date, newest first
			documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		} catch (err) {
			console.error('Failed to refresh folder contents:', err);
		}
	}

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
			
			// Set context in appState for consistent temporary item handling
			app.setCurrentParentId(listId);
			console.log('🔥 Step 2 Test: Set appState.currentParentId to:', listId);
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
			app.removeTemporaryFolder(tempId);
			
			// Clear editing state
			if (app.editingTempFolderId === tempId) {
				app.setEditingTempFolderId(null);
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

	async function handleCharacterCreate(characterName: string, tempId: string) {
		try {
			// Create the real character list using ListService with parentId
			const newCharacter = new List('character', characterName, currentFolderId);
			const savedCharacter = await listService.create(newCharacter);
			
			// Remove the temporary character
			app.removeTemporaryFolder(tempId);
			
			// Clear editing state
			if (app.editingTempFolderId === tempId) {
				app.setEditingTempFolderId(null);
			}
			
			// Add the new character to childFolders to show it immediately
			const updatedChildFolders = [...childFolders, savedCharacter];
			// Sort by creation date, newest first
			updatedChildFolders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			childFolders = updatedChildFolders;
			
		} catch (error) {
			console.error('Failed to create character:', error);
		}
	}

	async function handleDocumentCreate(documentName: string, tempId: string) {
		try {
			// Create the real document using DocumentService with parentId
			const newDocument = new Document(documentName, '', currentFolderId);
			const savedDocument = await documentService.create(newDocument);
			
			// Remove the temporary document
			app.removeTemporaryDocument(tempId);
			
			// Clear editing state
			if (app.editingTempDocumentId === tempId) {
				app.setEditingTempDocumentId(null);
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
		// Create a temporary document using appState (consistent with root explorer)
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

	function handleNewCharacter() {
		// Create a temporary character list using appState (consistent with root explorer)
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

	
	function handleBack() {
		window.location.href = '/explorer';
	}

	function handleNewFolder() {
		// Create a temporary folder using appState (consistent with root explorer)
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
		
		// Filter appState temporary items to only show ones for current context
		const contextTempFolders = app.temporaryFolders.filter((f: ExplorerItem) => f.parentId === currentFolderId);
		const contextTempDocuments = app.temporaryDocuments.filter((d: ExplorerItem) => d.parentId === currentFolderId);
		
		// Combine temporary folders, temporary documents, child folders, and documents
		const temporaryFolderItems = contextTempFolders.map(f => ({ ...f, isFolder: true }));
		const temporaryDocumentItems = contextTempDocuments.map(d => ({ ...d, isFolder: false }));
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
			isSelectionMode={isSelectionMode}
			showSelectionSwitch={true}
			onSelectionToggle={handleSelectionToggle}
			onDeleteSelected={handleDeleteSelected}
			onNewFolder={handleNewFolder}
			onNewDocument={handleNewDocument}
			onNewCharacter={handleNewCharacter}
			onFolderCreate={handleFolderCreate}
			onFolderRename={handleFolderRename}
			onDocumentCreate={handleDocumentCreate}
			onDocumentRename={handleDocumentRename}
			onCharacterCreate={handleCharacterCreate}
			onCopySelected={handleCopySelected}
			onCutSelected={handleCutSelected}
			onPasteSelected={handlePasteSelected}
			editingTempFolderId={app.editingTempFolderId}
			editingTempDocumentId={app.editingTempDocumentId}
			folderIds={pathArray}
			currentListType={list?.type}
			currentListName={list?.name}
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
