import { Document } from '$lib/models/Document';
import { List } from '$lib/models/List';
import { DocumentService } from '$lib/services/DocumentService';
import { ListService } from '$lib/services/ListService';
import { browser } from '$app/environment';
import { PouchDatabase } from '$lib/implementations/PouchDatabase';
import type { ExplorerItem } from '$lib/components/Explorer/types';
import type { ClipboardItem } from '$lib/interfaces/ClipboardItem';
import { selectedDocuments } from '$lib/stores/selectedDocuments';
import { toastService } from '$lib/components/Toast';

// Global app state interface
export interface AppState {
	// Data
	documents: Document[];
	lists: List[];
	temporaryFolders: ExplorerItem[];
	temporaryDocuments: ExplorerItem[];
	
	// UI State
	loading: boolean;
	hasLoaded: boolean;
	isSelectionMode: boolean;
	
	// Editing state
	editingTempFolderId: string | null;
	editingTempDocumentId: string | null;
	
	// Context state
	currentParentId: string | undefined;
	
	// Services (singleton instances, nullable for SSR)
	documentService: DocumentService | null;
	listService: ListService | null;
}

// Create the global app state
function createAppState() {
	// Only initialize services on the client side
	let database: PouchDatabase | null = null;
	let documentService: DocumentService | null = null;
	let listService: ListService | null = null;

	if (browser) {
		database = new PouchDatabase('manuscriptOS_DB');
		documentService = new DocumentService(database);
		listService = new ListService();
	}

	// State using Svelte 5 $state
	const state = $state<AppState>({
		// Data
		documents: [],
		lists: [],
		temporaryFolders: [],
		temporaryDocuments: [],
		
		// UI State
		loading: false,
		hasLoaded: false,
		isSelectionMode: false,
		
		// Editing state
		editingTempFolderId: null,
		editingTempDocumentId: null,
		
		// Context state
		currentParentId: undefined,
		
		// Services
		documentService,
		listService
	});

	// Actions/methods for state management
	const actions = {
		// Loading methods
		async loadRootLevel(): Promise<void> {
			if (!browser || state.loading || !state.documentService || !state.listService) return;
			
			state.loading = true;
			try {
				// Load lists - only root level (parentId: undefined)
				const allLists = await state.listService.getByParentId(undefined);
				state.lists = allLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

				// Load documents - only root level (parentId: undefined)
				const rootDocuments = await state.documentService.getByParentId(undefined);
				state.documents = rootDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				
				
				state.hasLoaded = true;
			} catch (error) {
				console.error('Failed to load root level:', error);
			} finally {
				state.loading = false;
			}
		},

		// Load all documents from entire system (for homepage recents)
		async loadAllDocuments(): Promise<Document[]> {
			if (!browser || !state.documentService) return [];
			
			try {
				const allDocuments = await state.documentService.list();
				return allDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			} catch (error) {
				console.error('Failed to load all documents:', error);
				return [];
			}
		},

		async loadDocumentsByParentId(parentId?: string): Promise<Document[]> {
			if (!browser || !state.documentService) return [];
			try {
				const documents = await state.documentService.getByParentId(parentId);
				return documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			} catch (error) {
				console.error('Failed to load documents by parent ID:', error);
				return [];
			}
		},

		async loadListsByParentId(parentId?: string): Promise<List[]> {
			if (!browser || !state.listService) return [];
			try {
				const lists = await state.listService.getByParentId(parentId);
				return lists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			} catch (error) {
				console.error('Failed to load lists by parent ID:', error);
				return [];
			}
		},

		// Document operations
		async createDocument(title: string, content: string = '', parentId?: string): Promise<Document> {
			if (!browser || !state.documentService) {
				throw new Error('Database not available on server');
			}
			try {
				const document = new Document(title, content, parentId);
				const savedDocument = await state.documentService.create(document);
				
				// Add to state if it's at the current level
				if (savedDocument.parentId === undefined) {
					const updatedDocuments = [...state.documents, savedDocument];
					state.documents = updatedDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				}
				
				return savedDocument;
			} catch (error) {
				console.error('Failed to create document:', error);
				throw error;
			}
		},

		async updateDocument(document: Document): Promise<Document> {
			if (!browser || !state.documentService) {
				throw new Error('Database not available on server');
			}
			try {
				const updatedDocument = await state.documentService.update(document);
				
				// Update in state if it exists
				const index = state.documents.findIndex(doc => doc.id === updatedDocument.id);
				if (index !== -1) {
					const newDocuments = [...state.documents];
					newDocuments[index] = updatedDocument;
					state.documents = newDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				}
				
				return updatedDocument;
			} catch (error) {
				console.error('Failed to update document:', error);
				throw error;
			}
		},

		async deleteDocument(documentId: string): Promise<boolean> {
			if (!browser || !state.documentService) {
				throw new Error('Database not available on server');
			}
			try {
				const success = await state.documentService.delete(documentId);
				
				if (success) {
					// Remove from state
					state.documents = state.documents.filter(doc => doc.id !== documentId);
				}
				
				return success;
			} catch (error) {
				console.error('Failed to delete document:', error);
				throw error;
			}
		},


		// List operations
		async createList(name: string, parentId?: string): Promise<List> {
			if (!browser || !state.listService) {
				throw new Error('Database not available on server');
			}
			try {
				const list = new List(null, name, parentId);
				const savedList = await state.listService.create(list);
				
				// Add to state if it's at the current level
				if (savedList.parentId === undefined) {
					const updatedLists = [...state.lists, savedList];
					state.lists = updatedLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				}
				
				return savedList;
			} catch (error) {
				console.error('Failed to create list:', error);
				throw error;
			}
		},

		async createCharacterList(name: string, parentId?: string): Promise<List> {
			if (!browser || !state.listService) {
				throw new Error('Database not available on server');
			}
			try {
				const list = new List('character', name, parentId);
				const savedList = await state.listService.create(list);
				
				// Add to state if it's at the current level
				if (savedList.parentId === undefined) {
					const updatedLists = [...state.lists, savedList];
					state.lists = updatedLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				}
				
				return savedList;
			} catch (error) {
				console.error('Failed to create character list:', error);
				throw error;
			}
		},

		async createManuscriptList(name: string, parentId?: string): Promise<List> {
			if (!browser || !state.listService) {
				throw new Error('Database not available on server');
			}
			try {
				const list = new List('manuscript', name, parentId);
				const savedList = await state.listService.create(list);
				
				// Add to state if it's at the current level
				if (savedList.parentId === undefined) {
					const updatedLists = [...state.lists, savedList];
					state.lists = updatedLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				}
				
				return savedList;
			} catch (error) {
				console.error('Failed to create manuscript list:', error);
				throw error;
			}
		},

		async updateList(list: List): Promise<List> {
			if (!browser || !state.listService) {
				throw new Error('Database not available on server');
			}
			try {
				const updatedList = await state.listService.update(list);
				
				// Update in state if it exists
				const index = state.lists.findIndex(l => l.id === updatedList.id);
				if (index !== -1) {
					const newLists = [...state.lists];
					newLists[index] = updatedList;
					state.lists = newLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				}
				
				return updatedList;
			} catch (error) {
				console.error('Failed to update list:', error);
				throw error;
			}
		},

		async deleteList(listId: string): Promise<boolean> {
			if (!browser || !state.listService) {
				throw new Error('Database not available on server');
			}
			try {
				const success = await state.listService.delete(listId);
				
				if (success) {
					// Remove from state
					state.lists = state.lists.filter(list => list.id !== listId);
				}
				
				return success;
			} catch (error) {
				console.error('Failed to delete list:', error);
				throw error;
			}
		},

		// Temporary item management
		addTemporaryFolder(item: ExplorerItem, parentId?: string): void {
			// Use provided parentId or fall back to current context
			const finalParentId = parentId ?? state.currentParentId;
			
			// Add parentId to the item if it's not already set
			const itemWithContext = {
				...item,
				parentId: finalParentId
			};
			
			state.temporaryFolders = [...state.temporaryFolders, itemWithContext];
			console.log('🔥 Step 3 Test: Added temporary folder with parentId:', finalParentId);
		},

		removeTemporaryFolder(itemId: string): void {
			state.temporaryFolders = state.temporaryFolders.filter(item => item.id !== itemId);
		},

		addTemporaryDocument(item: ExplorerItem, parentId?: string): void {
			// Use provided parentId or fall back to current context
			const finalParentId = parentId ?? state.currentParentId;
			
			// Add parentId to the item if it's not already set
			const itemWithContext = {
				...item,
				parentId: finalParentId
			};
			
			state.temporaryDocuments = [...state.temporaryDocuments, itemWithContext];
			console.log('🔥 Step 3 Test: Added temporary document with parentId:', finalParentId);
		},

		removeTemporaryDocument(itemId: string): void {
			state.temporaryDocuments = state.temporaryDocuments.filter(item => item.id !== itemId);
		},


		// UI state management
		setSelectionMode(enabled: boolean): void {
			state.isSelectionMode = enabled;
		},

		setEditingTempFolderId(folderId: string | null): void {
			state.editingTempFolderId = folderId;
		},

		setEditingTempDocumentId(documentId: string | null): void {
			state.editingTempDocumentId = documentId;
		},

		setCurrentParentId(parentId: string | undefined): void {
			state.currentParentId = parentId;
		},


		// Utility methods
		clearTemporaryItems(): void {
			state.temporaryFolders = [];
			state.temporaryDocuments = [];
		},

		async refresh(): Promise<void> {
			if (!browser) return;
			state.hasLoaded = false;
			await this.loadRootLevel();
		},

		// Selection methods for compatibility
		clearSelection(): void {
			// This would integrate with selectedDocuments store
			// For now, just exit selection mode
			this.setSelectionMode(false);
		},

		toggleDocumentSelection(item: any): void {
			// Convert document to SelectableItem format
			const selectableItem = {
				id: item.id,
				name: item.title || item.name || 'Untitled Document',
				icon: item.icon || '/icons/ai.png'
			};
			
			// Toggle selection using the selectedDocuments store
			selectedDocuments.toggleDocument(selectableItem);
		},

		// Clipboard methods
		async copySelected(): Promise<void> {
			console.log('🔥 copySelected called');
			if (!browser || !state.documentService || !state.listService) return;
			
			try {
				// Get current selected items
				const selectedItems = selectedDocuments.getDocuments();
				console.log('🔥 selectedItems:', selectedItems);
				
				if (selectedItems.length === 0) {
					console.log('🔥 No items selected, returning');
					return; // Nothing to copy
				}
				
				// Convert to ClipboardItem format with full data
				const clipboardItems: ClipboardItem[] = [];
				
				for (const item of selectedItems) {
					console.log('🔥 Processing item for copy:', item);
					// Try to get document data first
					const document = await state.documentService.read(item.id);
					if (document) {
						console.log('🔥 Found document:', document);
						clipboardItems.push({
							id: document.id,
							type: 'document',
							name: document.title,
							data: document,
							originalParentId: document.parentId
						});
					} else {
						// Try to get list data if document not found
						const list = await state.listService.read(item.id);
						if (list) {
							console.log('🔥 Found list:', list);
							clipboardItems.push({
								id: list.id,
								type: 'list',
								name: list.name,
								data: list,
								originalParentId: list.parentId
							});
						}
					}
				}
				
				console.log('🔥 Final clipboardItems:', clipboardItems);
				
				// Update the selectedDocuments store with rich clipboard data
				selectedDocuments.copySelected(clipboardItems);
				
				// Show toast notification
				const itemCount = clipboardItems.length;
				const message = itemCount === 1 ? "1 item copied" : `${itemCount} items copied`;
				toastService.show(message);
				
				// Exit selection mode and clear selection
				this.setSelectionMode(false);
				selectedDocuments.clearSelection();
				
			} catch (error) {
				console.error('🔥 Failed to copy selected items:', error);
				toastService.show('Failed to copy items');
			}
		},

		cutSelected(): void {
			// For now, just use the existing cutSelected from selectedDocuments
			selectedDocuments.cutSelected();
		},

		async pasteClipboard(targetParentId?: string): Promise<void> {
			console.log('🔥 pasteClipboard called with targetParentId:', targetParentId);
			if (!browser || !state.documentService || !state.listService) {
				console.log('🔥 Early return - browser or services not available');
				return;
			}
			
			try {
				// Get clipboard state from selectedDocuments store
				const clipboardState = selectedDocuments.pasteItems(targetParentId);
				console.log('🔥 clipboardState:', clipboardState);
				
				if (!clipboardState.items.length) {
					console.log('🔥 No items in clipboard');
					toastService.show('No items to paste');
					return;
				}

				const itemCount = clipboardState.items.length;
				console.log('🔥 Processing', itemCount, 'items for paste');

				// Perform paste operations based on operation type
				if (clipboardState.operation === 'copy') {
					console.log('🔥 Performing copy operation');
					// Duplicate items using the rich ClipboardItem data
					for (const item of clipboardState.items) {
						console.log('🔥 Copying item:', item);
						if (item.type === 'document') {
							console.log('🔥 Calling documentService.duplicate for:', item.id);
							await state.documentService.duplicate(item.id, targetParentId);
						} else if (item.type === 'list') {
							console.log('🔥 Calling listService.duplicate for:', item.id);
							await state.listService.duplicate(item.id, targetParentId);
						}
					}
					
					// Show success message
					const message = itemCount === 1 ? "1 item pasted" : `${itemCount} items pasted`;
					toastService.show(message);
					
				} else if (clipboardState.operation === 'cut') {
					console.log('🔥 Performing cut operation');
					// Move items using the new move functionality
					for (const item of clipboardState.items) {
						console.log('🔥 Moving item:', item);
						if (item.type === 'document') {
							console.log('🔥 Calling documentService.move for:', item.id);
							await state.documentService.move(item.id, targetParentId);
						} else if (item.type === 'list') {
							console.log('🔥 Calling listService.move for:', item.id);
							await state.listService.move(item.id, targetParentId);
						}
					}
					
					// Clear clipboard after successful cut/paste
					selectedDocuments.clearSelection();
					
					// Show success message
					const message = itemCount === 1 ? "1 item moved" : `${itemCount} items moved`;
					toastService.show(message);
				}

				console.log('🔥 Refreshing view after paste');
				// Refresh the current view
				await this.loadRootLevel();
				
			} catch (error) {
				console.error('🔥 Failed to paste clipboard items:', error);
				toastService.show('Failed to paste items');
			}
		}
	};

	return {
		// Return state as reactive
		get documents() { return state.documents; },
		get lists() { return state.lists; },
		get temporaryFolders() { return state.temporaryFolders; },
		get temporaryDocuments() { return state.temporaryDocuments; },
		get loading() { return state.loading; },
		get hasLoaded() { return state.hasLoaded; },
		get isSelectionMode() { return state.isSelectionMode; },
		get editingTempFolderId() { return state.editingTempFolderId; },
		get editingTempDocumentId() { return state.editingTempDocumentId; },
		get documentService() { return state.documentService; },
		get listService() { return state.listService; },

		// Return actions
		...actions
	};
}

// Export the singleton app state
export const appState = createAppState();

// Export a hook for easy usage in components
export function useAppState() {
	return appState;
}
