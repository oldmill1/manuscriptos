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
				// Load ALL lists for nested explorer support
				const allLists = await state.listService.list();
				state.lists = allLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

				// Load documents - ALL documents for nested explorer support
				const allDocuments = await state.documentService.list();
				state.documents = allDocuments.sort((a: Document, b: Document) => b.createdAt.getTime() - a.createdAt.getTime());
				
				
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
				
				// Add to state regardless of parent level
				const updatedDocuments = [...state.documents, savedDocument];
				state.documents = updatedDocuments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
				
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
			console.log('🔥 updateList called with:', list.name, list.id);
			if (!browser || !state.listService) {
				console.log('🔥 updateList: No browser or listService');
				throw new Error('Database not available on server');
			}
			try {
				console.log('🔥 updateList: Calling listService.update');
				const updatedList = await state.listService.update(list);
				console.log('🔥 updateList: listService.update returned:', updatedList.name);
				
				// Update in state if it exists
				console.log('🔥 updateList: Current state.lists length:', state.lists.length);
				console.log('🔥 updateList: Looking for list index with id:', updatedList.id);
				const index = state.lists.findIndex(l => l.id === updatedList.id);
				console.log('🔥 updateList: Found list at index:', index);
				
				if (index !== -1) {
					console.log('🔥 updateList: Before update - list name:', state.lists[index].name);
					const newLists = [...state.lists];
					newLists[index] = updatedList;
					console.log('🔥 updateList: After update - list name:', newLists[index].name);
					state.lists = newLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
					console.log('🔥 updateList: state.lists updated, new length:', state.lists.length);
					console.log('🔥 updateList: Updated list name in state:', state.lists.find(l => l.id === updatedList.id)?.name);
				} else {
					console.log('🔥 updateList: List not found in state.lists - ADDING IT');
					console.log('🔥 updateList: All list IDs in state:', state.lists.map(l => l.id));
					const newLists = [...state.lists, updatedList];
					state.lists = newLists.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
					console.log('🔥 updateList: Added list to state, new length:', state.lists.length);
					console.log('🔥 updateList: Updated list name in state:', state.lists.find(l => l.id === updatedList.id)?.name);
				}
				
				return updatedList;
			} catch (error) {
				console.error('🔥 updateList: Error:', error);
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
			// Step 3 Test: Added temporary folder with parentId
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
			// Step 3 Test: Added temporary document with parentId
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
			// copySelected called
			if (!browser || !state.documentService || !state.listService) return;
			
			try {
				// Get current selected items
				const selectedItems = selectedDocuments.getDocuments();
				// selectedItems:
				
				if (selectedItems.length === 0) {
					// No items selected, returning
					return; // Nothing to copy
				}
				
				// Convert to ClipboardItem format with full data
				const clipboardItems: ClipboardItem[] = [];
				
				for (const item of selectedItems) {
					// Try to get document data first
					const document = await state.documentService.read(item.id);
					if (document) {
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
							// Found list:
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
				
				// Final clipboardItems:
				
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
				console.error('Failed to copy selected items:', error);
				toastService.show('Failed to copy items');
			}
		},

		cutSelected(): void {
			// For now, just use the existing cutSelected from selectedDocuments
			selectedDocuments.cutSelected();
		},

		async pasteClipboard(targetParentId?: string): Promise<void> {
			// pasteClipboard called with targetParentId
			if (!browser || !state.documentService || !state.listService) {
				// Early return - browser or services not available
				return;
			}
			
			try {
				// Get clipboard state from selectedDocuments store
				const clipboardState = selectedDocuments.pasteItems(targetParentId);
				// clipboardState:
				
				if (!clipboardState.items.length) {
					// No items in clipboard
					toastService.show('No items to paste');
					return;
				}

				const itemCount = clipboardState.items.length;
				// Processing items for paste

				// Perform paste operations based on operation type
				if (clipboardState.operation === 'copy') {
					// Performing copy operation
					// Duplicate items using the rich ClipboardItem data
					for (const item of clipboardState.items) {
						// Copying item:
						if (item.type === 'document') {
							// Calling documentService.duplicate for:
							await state.documentService.duplicate(item.id, targetParentId);
						} else if (item.type === 'list') {
							// Calling listService.duplicate for:
							await state.listService.duplicate(item.id, targetParentId);
						}
					}
					
					// Show success message
					const message = itemCount === 1 ? "1 item pasted" : `${itemCount} items pasted`;
					toastService.show(message);
					
				} else if (clipboardState.operation === 'cut') {
					// Performing cut operation
					// Move items using the new move functionality
					for (const item of clipboardState.items) {
						// Moving item:
						if (item.type === 'document') {
							// Calling documentService.move for:
							await state.documentService.move(item.id, targetParentId);
						} else if (item.type === 'list') {
							// Calling listService.move for:
							await state.listService.move(item.id, targetParentId);
						}
					}
					
					// Clear clipboard after successful cut/paste
					selectedDocuments.clearSelection();
					
					// Show success message
					const message = itemCount === 1 ? "1 item moved" : `${itemCount} items moved`;
					toastService.show(message);
				}

				// Refreshing view after paste
				// Refresh the appropriate view based on context
				if (targetParentId === undefined || targetParentId === null) {
					// Root level context - refresh root data
					await this.loadRootLevel();
				} else {
					// Nested context - don't refresh here, let the page handle it
					// Nested context - page will handle refresh
				}
				
			} catch (error) {
				console.error('Failed to paste clipboard items:', error);
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
