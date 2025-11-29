import { Document } from '$lib/models/Document';
import { List } from '$lib/models/List';
import { DocumentService } from '$lib/services/DocumentService';
import { ListService } from '$lib/services/ListService';
import { browser } from '$app/environment';
import { PouchDatabase } from '$lib/implementations/PouchDatabase';
import type { ExplorerItem } from '$lib/components/Explorer/types';
import type { ClipboardItem } from '$lib/interfaces/ClipboardItem';
import { selectedDocuments } from '$lib/stores/selectedDocuments';

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
		addTemporaryFolder(item: ExplorerItem): void {
			state.temporaryFolders = [...state.temporaryFolders, item];
		},

		removeTemporaryFolder(itemId: string): void {
			state.temporaryFolders = state.temporaryFolders.filter(item => item.id !== itemId);
		},

		addTemporaryDocument(item: ExplorerItem): void {
			state.temporaryDocuments = [...state.temporaryDocuments, item];
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
			if (!browser || !state.documentService || !state.listService) return;
			
			try {
				// Get current selected items
				const selectedItems = selectedDocuments.getDocuments();
				
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
				
				// Update the selectedDocuments store with rich clipboard data
				selectedDocuments.copySelected(clipboardItems);
				
			} catch (error) {
				console.error('Failed to copy selected items:', error);
			}
		},

		cutSelected(): void {
			// For now, just use the existing cutSelected from selectedDocuments
			selectedDocuments.cutSelected();
		},

		async pasteClipboard(targetParentId?: string): Promise<void> {
			if (!browser || !state.documentService || !state.listService) return;
			
			try {
				// Get clipboard state from selectedDocuments store
				const clipboardState = selectedDocuments.pasteItems(targetParentId);
				
				if (!clipboardState.items.length) {
					console.log('No items to paste');
					return;
				}

				// Perform paste operations based on operation type
				if (clipboardState.operation === 'copy') {
					// Duplicate items using the rich ClipboardItem data
					for (const item of clipboardState.items) {
						if (item.type === 'document') {
							await state.documentService.duplicate(item.id, targetParentId);
						} else if (item.type === 'list') {
							await state.listService.duplicate(item.id, targetParentId);
						}
					}
				} else if (clipboardState.operation === 'cut') {
					// Move items using the new move functionality
					for (const item of clipboardState.items) {
						if (item.type === 'document') {
							await state.documentService.move(item.id, targetParentId);
						} else if (item.type === 'list') {
							await state.listService.move(item.id, targetParentId);
						}
					}
					
					// Clear clipboard after successful cut/paste
					selectedDocuments.clearSelection();
				}

				// Refresh the current view
				await this.loadRootLevel();
				
			} catch (error) {
				console.error('Failed to paste clipboard items:', error);
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
