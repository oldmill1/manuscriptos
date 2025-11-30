<script lang="ts">
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import type { ExplorerItem } from '$lib/components/Explorer/types';
	import { convertDocumentsToExplorerItems, convertListsToExplorerItems, createExplorerData } from '$lib/components/Explorer/utils';
	import { Document } from '$lib/models/Document';
	import { List } from '$lib/models/List';
	import { DocumentService } from '$lib/services/DocumentService';
	import { ListService } from '$lib/services/ListService';
	import { useAppState } from '$lib/stores/appState.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { ExplorerService } from '$lib/services/ExplorerService';

	let { data }: PageProps = $props();

	// Extract pathArray from SvelteKit data.params
	let pathArray = $state<string[]>([]);

	let listService: ListService;
	let documentService: DocumentService;
	let list = $state<List | null>(null);
	let childFolders = $state<List[]>([]);
	let hasLoaded = $state(false);
	let error = $state<string | null>(null);
	let currentFolderId = $state<string | undefined>(undefined);
	let isSelectionMode = $state(false);

	// Use centralized app state
	const app = useAppState();
	const explorerService = new ExplorerService(app);

	// Computed documents from app state, filtered by current folder
	const documents = $derived(() => {
		const filtered = app.documents.filter(doc => doc.parentId === currentFolderId);
		return filtered;
	});

	// Copy/Paste handlers
	async function handleCopySelected() {
		// handleCopySelected called (subfolder)
		await app.copySelected();
	}

	async function handleCutSelected() {
		// handleCutSelected called (subfolder)
		app.cutSelected();
	}

	async function handlePasteSelected() {
		// handlePasteSelected called (subfolder)
		const currentParentId = currentFolderId;
		// Current parent ID for paste (subfolder)
		await app.pasteClipboard(currentParentId);
		
		// No need to refresh - centralized state handles updates automatically
	}

	async function loadFolderContents() {
		try {
			// Load child folders
			const loadedChildFolders = await listService.getByParentId(currentFolderId);
			
			// Add loaded folders to centralized state
			for (const folder of loadedChildFolders) {
				await app.updateList(folder);
			}
			
			// Also ensure root-level folders are loaded for desktop navigation
			const rootFolders = await listService.getByParentId(undefined);
			for (const folder of rootFolders) {
				await app.updateList(folder);
			}
			
			// Sort by creation date, newest first
			childFolders = loadedChildFolders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

			// Documents are now computed from app state, no manual loading needed
		} catch (err) {
			console.error('Failed to load folder contents:', err);
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
			// Step 2 Test: Set appState.currentParentId
			
			// Load all documents from database for nested explorer support
			await app.loadRootLevel();
			
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

			// Documents are now computed from app state, no manual loading needed
			
		} catch (err) {
			console.error('Failed to load list documents:', err);
			error = 'Failed to load list';
		} finally {
			hasLoaded = true;
		}
	});

	async function handleFolderCreate(folderName: string, tempId: string) {
		try {
			// Use ExplorerService to save the list
			await explorerService.list.save(folderName, tempId, currentFolderId);
		} catch (error) {
			console.error('Failed to create folder:', error);
		}
	}

	function handleNewFolder() {
		// Use ExplorerService to create temporary list
		explorerService.list.new();
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

	async function handleSceneCreate(sceneName: string, tempId: string) {
		try {
			// Create the real scene list using ListService with parentId
			const newScene = new List('scene', sceneName, currentFolderId);
			const savedScene = await listService.create(newScene);
			
			// Remove the temporary scene
			app.removeTemporaryFolder(tempId);
			
			// Clear editing state
			if (app.editingTempFolderId === tempId) {
				app.setEditingTempFolderId(null);
			}
			
			// Add the new scene to childFolders to show it immediately
			const updatedChildFolders = [...childFolders, savedScene];
			// Sort by creation date, newest first
			updatedChildFolders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			childFolders = updatedChildFolders;
			
		} catch (error) {
			console.error('Failed to create scene:', error);
		}
	}

	async function handleDocumentCreate(documentName: string, tempId: string) {
		// Use ExplorerService for document creation
		await explorerService.document.new(documentName, tempId, currentFolderId);
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
		explorerService.document.new();
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

	function handleNewScene() {
		// Create a temporary scene list using appState (consistent with other handlers)
		const tempId = `temp-scene-${crypto.randomUUID()}`;
		const tempScene: ExplorerItem = {
			id: tempId,
			name: 'New Scene',
			type: 'list',
			icon: '/icons/scene.png',
			isTemp: true,
			isEditing: true,
			listType: 'scene'
		};
		
		app.addTemporaryFolder(tempScene);
		app.setEditingTempFolderId(tempId);
	}

	
	function handleBack() {
		window.location.href = '/explorer';
	}

	function handleSelectionToggle(enabled: boolean) {
		isSelectionMode = enabled;
	}

	async function handleDeleteSelected(selectedDocs: any[]) {
		try {
			// Use ExplorerService for all deletion logic
			await explorerService.deleteSelected(selectedDocs);
		} catch (error) {
			console.error('Failed to delete selected items:', error);
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
		await explorerService.list.update('name', folderId, newName);
	}

	async function handleDocumentRename(documentId: string, newName: string) {
		await explorerService.document.update('name', documentId, newName);
	}

	
	// Create standardized data for Explorer
	const explorerData = $derived.by(() => {
		if (!hasLoaded) return createExplorerData([], 'document', false);
		
		// Filter appState temporary items to only show ones for current context
		const contextTempFolders = app.temporaryFolders.filter((f: ExplorerItem) => f.parentId === currentFolderId);
		const contextTempDocuments = app.temporaryDocuments.filter((d: ExplorerItem) => d.parentId === currentFolderId);
		
		// Filter appState lists to only show child folders for current context
		const childFoldersFromState = app.lists.filter((l: List) => l.parentId === currentFolderId);
		
		// Combine temporary folders, temporary documents, child folders, and documents
		const temporaryFolderItems = contextTempFolders.map((f: ExplorerItem) => ({ ...f, isFolder: true }));
		const temporaryDocumentItems = contextTempDocuments.map((d: ExplorerItem) => ({ ...d, isFolder: false }));
		const childFolderItems = convertListsToExplorerItems(childFoldersFromState, handleFolderClick);
		const documentItems = convertDocumentsToExplorerItems(documents(), handleDocumentClick);
		
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
			onNewScene={handleNewScene}
			onFolderCreate={handleFolderCreate}
			onFolderRename={handleFolderRename}
			onDocumentCreate={handleDocumentCreate}
			onDocumentRename={handleDocumentRename}
			onCharacterCreate={handleCharacterCreate}
			onSceneCreate={handleSceneCreate}
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
