<script lang="ts">
	import { onMount } from 'svelte';
	import { List } from '$lib/models/List';
	import { Document } from '$lib/models/Document';
	import { Character } from '$lib/models/Character';
	import { ListService } from '$lib/services/ListService';
	import { DocumentService } from '$lib/services/DocumentService';
	import { CharacterService } from '$lib/services/CharacterService';
	import Explorer from '$lib/components/Explorer/Explorer.svelte';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import type { ExplorerItem } from '$lib/components/Explorer/types';
	import { convertDocumentsToExplorerItems, convertListsToExplorerItems, convertCharactersToExplorerItems, createExplorerData } from '$lib/components/Explorer/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Extract pathArray from SvelteKit data.params
	let pathArray = $state<string[]>([]);

	let listService: ListService;
	let documentService: DocumentService;
	let characterService: CharacterService;
	let list = $state<List | null>(null);
	let documents = $state<Document[]>([]);
	let characters = $state<Character[]>([]);
	let childFolders = $state<List[]>([]);
	let hasLoaded = $state(false);
	let error = $state<string | null>(null);
	let currentFolderId = $state<string | undefined>(undefined);
	let isSelectionMode = $state(false);
	let editingTempFolderId = $state<string | null>(null);
	let editingTempDocumentId = $state<string | null>(null);
	let editingTempCharacterId = $state<string | null>(null);
	let temporaryFolders = $state<any[]>([]);
	let temporaryDocuments = $state<ExplorerItem[]>([]);
	let temporaryCharacters = $state<ExplorerItem[]>([]);

	onMount(async () => {
		try {
			const { ListService } = await import('$lib/services/ListService');
			const { DocumentService } = await import('$lib/services/DocumentService');
			const { CharacterService } = await import('$lib/services/CharacterService');
			const { PouchDatabase } = await import('$lib/implementations/PouchDatabase');
			const database = new PouchDatabase('manuscriptOS_DB');
			listService = new ListService();
			documentService = new DocumentService(database);
			characterService = new CharacterService(database);

			// Load the list - extract pathArray from SvelteKit data
			pathArray = data.path || [];
			console.log('Debug: full pathArray:', pathArray);
			console.log('Debug: pathArray length:', pathArray.length);
			const listId = pathArray.length > 0 ? pathArray[pathArray.length - 1] : undefined;
			console.log('Debug: extracted listId:', listId);
			
			// Set current folder ID for nested folder creation
			currentFolderId = listId;
			if (!listId) {
				error = 'No list specified';
				hasLoaded = true;
				return;
			}
			
			list = await listService.read(listId);
			console.log('Debug: listService.read() returned:', list);
			if (!list) {
				console.log('Debug: list is null/undefined for ID:', listId);
				error = 'List not found';
				hasLoaded = true;
				return;
			}

			// Load child folders
			childFolders = await listService.getByParentId(currentFolderId);
			// Sort by creation date, newest first
			childFolders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			console.log('Loaded child folders:', childFolders.map(f => ({ id: f.id, name: f.name, parentId: f.parentId })));

			// Load documents in this folder using parentId
			documents = await documentService.getByParentId(currentFolderId);
			// Sort by creation date, newest first
			documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			console.log('Loaded documents in folder:', documents.map(d => ({ id: d.id, title: d.title, parentId: d.parentId })));

			// Load characters in this folder using parentId
			characters = await characterService.getByParentId(currentFolderId);
			// Sort by creation date, newest first
			characters.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			console.log('Loaded characters in folder:', characters.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })));

		} catch (err) {
			console.error('Failed to load list documents:', err);
			error = 'Failed to load list';
		} finally {
			hasLoaded = true;
		}
	});

	async function handleFolderCreate(folderName: string, tempId: string) {
		try {
			console.log('Creating folder:', folderName, 'from temp:', tempId);
			console.log('Using currentFolderId:', currentFolderId);
			
			// Create the real folder using ListService with parentId
			const newFolder = new List('custom', folderName, currentFolderId);
			const savedFolder = await listService.create(newFolder);
			
			console.log('Folder created successfully with parentId:', currentFolderId);
			
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
			console.log('Added new folder to childFolders:', savedFolder.name);
			
			console.log('Folder creation completed - folder added to view');
			
		} catch (error) {
			console.error('Failed to create folder:', error);
		}
	}

	async function handleDocumentCreate(documentName: string, tempId: string) {
		try {
			console.log('Creating document:', documentName, 'from temp:', tempId);
			console.log('Using currentFolderId:', currentFolderId);
			
			// Create the real document using DocumentService with parentId
			const newDocument = new Document(documentName, '', currentFolderId);
			const savedDocument = await documentService.create(newDocument);
			
			console.log('Document created successfully with parentId:', currentFolderId);
			
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
			
			console.log('Document creation completed - document added to view');
			
		} catch (error) {
			console.error('Failed to create document:', error);
		}
	}

	function handleDocumentClick(doc: Document, event: MouseEvent) {
		console.log('Document clicked:', doc.id, doc.title);
		console.log('Document parentId:', doc.parentId); // Add this log
		// Navigate to the document in the Editor
		window.location.href = `/docs/${doc.id}`;
	}

	function handleCharacterClick(character: ExplorerItem, event: MouseEvent) {
		console.log('The character file was clicked!');
		// TODO: Navigate to character page when implemented
	}

	// Wrapper function for convertCharactersToExplorerItems
	function createCharacterClickHandler(character: Character) {
		return (explorerItem: ExplorerItem, event: MouseEvent) => {
			console.log('The character file was clicked!');
			// TODO: Navigate to character page when implemented
		};
	}

	function handleFolderClick(folder: List, event: MouseEvent) {
		console.log('Folder clicked:', folder.id, folder.name);
		
		// Build the full path by appending current folder to existing path
		const fullPath = [...pathArray, folder.id];
		const navigationPath = fullPath.join('/');
		console.log('Navigating to full path:', navigationPath);
		
		// Navigate to the folder with full path
		window.location.href = `/explorer/${navigationPath}`;
	}

	function handleNewDocument() {
		console.log('New document clicked in folder:', currentFolderId);
		
		// Create a temporary document with a unique ID and "Untitled Document" name
		const tempDocument = {
			id: `temp-doc-${Date.now()}`, // Unique ID using timestamp
			name: 'Untitled Document',
			icon: '/icons/new.png',
			onClick: (item: any, event: MouseEvent) => {
				// Handle click on temporary document (optional - could open rename dialog)
			}
		};
		
		console.log('Created temp document:', tempDocument.id);
		console.log('Temp document object:', tempDocument);
		
		// Add to temporary documents array
		temporaryDocuments = [...temporaryDocuments, tempDocument];
		console.log('Temporary documents array:', temporaryDocuments);
		
		// Set this document as the one being edited
		editingTempDocumentId = tempDocument.id;
		console.log('Set editingTempDocumentId to:', editingTempDocumentId);
	}

	function handleNewCharacter() {
		console.log('Creating new character in folder:', currentFolderId);
		
		// Create a temporary character with a unique ID and "Untitled Character" name
		const tempCharacter: ExplorerItem = {
			id: `temp-char-${Date.now()}`,
			name: 'Untitled Character',
			type: 'character',
			icon: '/icons/fantasy.png',
			isTemp: true,
			isEditing: true
		};
		
		// Add to temporary characters for editing
		temporaryCharacters = [...temporaryCharacters, tempCharacter];
		editingTempCharacterId = tempCharacter.id;
		
		console.log('Temporary character created:', tempCharacter.id);
	}

	async function handleCharacterCreate(characterName: string, tempId: string) {
		console.log('Creating character:', characterName, 'in folder:', currentFolderId);
		try {
			// Create the actual character using CharacterService
			const character = new Character(characterName, null, null, currentFolderId, `/${currentFolderId}`, currentFolderId ? 1 : 0);
			console.log('Character object created:', character.toJSON());
			
			const savedCharacter = await characterService.create(character);
			console.log('Character saved to database:', savedCharacter.toJSON());
			
			// Remove the temporary character
			temporaryCharacters = temporaryCharacters.filter(char => char.id !== tempId);
			if (editingTempCharacterId === tempId) {
				editingTempCharacterId = null;
			}
			
			// Add the new character to the characters array
			characters = [...characters, savedCharacter].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			
			console.log('Character created successfully!');
		} catch (error) {
			console.error('Failed to create character:', error);
		}
	}

	function handleBack() {
		window.location.href = '/explorer';
	}

	function handleNewFolder() {
		console.log('New folder clicked');
		
		// Create a temporary folder with a unique ID and "New List" name
		const tempFolder = {
			id: `temp-${Date.now()}`, // Unique ID using timestamp
			name: 'New List',
			icon: '/icons/folder.png',
			onClick: (item: any, event: MouseEvent) => {
				// Handle click on temporary folder (optional - could open rename dialog)
			}
		};
		
		console.log('Created temp folder:', tempFolder.id);
		
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
			
			console.log('Starting cascade delete for folders in', currentFolderId, ':', foldersToDelete.map(f => ({ id: f.id, name: f.name })));
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
			childFolders = childFolders.filter(folder => !allFoldersToDelete.some(deleted => deleted.id === folder.id));
			documents = documents.filter(doc => !documentsToDelete.some(deleted => deleted.id === doc.id));
			console.log('Cascade delete completed in folder:', currentFolderId);
			
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
			
			console.log('Folder renamed successfully:', newName);
			
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
			
			console.log('Document renamed successfully:', newName);
			
		} catch (error) {
			console.error('Failed to rename document:', error);
		}
	}

	// Create standardized data for Explorer
	const explorerData = $derived.by(() => {
		if (!hasLoaded) return createExplorerData([], 'document', false);
		
		// Combine temporary folders, temporary documents, temporary characters, child folders, documents, and characters
		const temporaryFolderItems = temporaryFolders.map(f => ({ ...f, isFolder: true }));
		const temporaryDocumentItems = temporaryDocuments.map(d => ({ ...d, isFolder: false }));
		const temporaryCharacterItems = temporaryCharacters.map(c => ({ ...c, isFolder: false, onClick: handleCharacterClick }));
		const childFolderItems = convertListsToExplorerItems(childFolders, handleFolderClick);
		const documentItems = convertDocumentsToExplorerItems(documents, handleDocumentClick);
		const characterItems = convertCharactersToExplorerItems(characters, createCharacterClickHandler);
		
		// Show temporary items FIRST, then child folders, then documents, then characters
		return createExplorerData(
			[...temporaryFolderItems, ...temporaryDocumentItems, ...temporaryCharacterItems, ...childFolderItems, ...documentItems, ...characterItems],
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
			onNewCharacter={handleNewCharacter}
			onFolderCreate={handleFolderCreate}
			onFolderRename={handleFolderRename}
			onDocumentCreate={handleDocumentCreate}
			onDocumentRename={handleDocumentRename}
			onCharacterCreate={handleCharacterCreate}
			editingTempFolderId={editingTempFolderId}
			editingTempDocumentId={editingTempDocumentId}
			editingTempCharacterId={editingTempCharacterId}
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
