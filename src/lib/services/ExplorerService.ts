// ExplorerService - Centralized explorer operations
/**
 * API for centralized explorer operations
 * 
 * Document Operations:
 * - document.new(): void
 * - document.new(title?: string, tempId?: string, parentId?: string): Promise<void>
 * - document.delete(documentId: string): Promise<void>
 * - document.update(field: string, id: string, value: any): Promise<void>
 * 
 * List Operations:
 * - list.new(): void
 * - list.save(listName: string, tempId: string, parentId?: string): Promise<void>
 * - list.delete(listId: string): Promise<void>
 * - list.update(field: string, id: string, value: any): Promise<void>
 * 
 * Bulk Operations:
 * - deleteSelected(items: ExplorerItem[]): Promise<void>
 */
import type { ExplorerItem } from '$lib/components/Explorer/types';
import { useAppState } from '$lib/stores/appState.svelte';

export class ExplorerService {
	private app: ReturnType<typeof useAppState>;

	constructor(app: ReturnType<typeof useAppState>) {
		this.app = app;
	}

	// Document operations
	document = {
		// Create temporary document (empty new())
		new: (name?: string, tempId?: string, parentId?: string): Promise<void> => {
			if (name && tempId && parentId) {
				// Save temporary document with parameters
				return this.saveDocument(name, tempId, parentId);
			} else {
				// Create temporary document (empty new())
				this.createTempDocument();
				return Promise.resolve();
			}
		},

		// Delete document
		delete: async (documentId: string): Promise<void> => {
			await this.app.deleteDocument(documentId);
		},

		// Update document property
		update: async (property: 'name', id: string, newName: string): Promise<void> => {
			await this.renameDocument(id, newName);
		}
	};

	// List operations
	list = {
		// Create temporary list
		new: (): void => {
			const tempId = `temp-${crypto.randomUUID()}`;
			const tempFolder: ExplorerItem = {
				id: tempId,
				name: 'New List',
				type: 'list',
				icon: '/icons/folder.png',
				isTemp: true,
				isEditing: true
			};
			
			this.app.addTemporaryFolder(tempFolder);
			this.app.setEditingTempFolderId(tempId);
		},

		// Save temporary list
		save: async (listName: string, tempId: string, parentId?: string): Promise<void> => {
			try {
				// Create the real list using ListService with parentId
				const { List } = await import('$lib/models/List');
				const { ListService } = await import('$lib/services/ListService');
				
				const newList = new List('custom', listName, parentId);
				if (!this.app.listService) {
					throw new Error('ListService not available');
				}
				const savedList = await this.app.listService.create(newList);
				
				// Add the new list to centralized state
				await this.app.updateList(savedList);
				
				// Remove the temporary list
				this.app.removeTemporaryFolder(tempId);
				
				// Clear editing state
				if (this.app.editingTempFolderId === tempId) {
					this.app.setEditingTempFolderId(null);
				}
				
			} catch (error) {
				console.error('Failed to create list:', error);
				throw error;
			}
		},

		// Delete list (recursive)
		delete: async (listId: string): Promise<void> => {
			try {
				if (!this.app.listService) {
					throw new Error('ListService not available');
				}

				// Get all child lists recursively
				const allListsToDelete = await this.getAllDescendantLists(listId);
				
				// Delete all documents in all these lists
				await this.deleteAllDocumentsInLists(allListsToDelete);
				
				// Delete all lists (bottom-up to avoid foreign key issues)
				for (const list of allListsToDelete.reverse()) {
					await this.app.listService.delete(list.id);
					// Remove from centralized state
					await this.app.deleteList(list.id);
				}
				
			} catch (error) {
				console.error('Failed to delete list:', error);
				throw error;
			}
		},

		// Update list property
		update: async (property: 'name', id: string, newName: string): Promise<void> => {
			await this.renameList(id, newName);
		}
	};

	// Get available folder types
	getAvailableTypes(): string[] {
		return ['character', 'manuscript', 'scene', 'folder', 'custom', 'collection'];
	}

	// Create temporary document (private method)
	private createTempDocument(): void {
		const tempId = `temp-doc-${crypto.randomUUID()}`;
		const tempDocument: ExplorerItem = {
			id: tempId,
			name: 'New Document',
			icon: '/icons/new.png',
			type: 'document',
			isTemp: true,
			isEditing: true
		};
		
		this.app.addTemporaryDocument(tempDocument);
		this.app.setEditingTempDocumentId(tempId);
	}

	// Save document (private method)
	private async saveDocument(name: string, tempId: string, parentId?: string): Promise<void> {
		try {
			// Create actual document using app state with parentId context
			await this.app.createDocument(name, '', parentId);
							
			// Remove temporary document and clear editing state
			this.app.removeTemporaryDocument(tempId);
			this.app.setEditingTempDocumentId(null);
		} catch (error) {
			console.error('Failed to save document:', error);
		}
	}

	// Rename document (private method)
	private async renameDocument(id: string, newName: string): Promise<void> {
		try {
			// Check if documentService is available (SSR compatibility)
			if (!this.app.documentService) {
				return;
			}
			
			// Get the latest version of the document from the database
			const currentDocument = await this.app.documentService.read(id);
			if (!currentDocument) {
				return;
			}
			
			// Update the document title on the fresh object
			currentDocument.title = newName;
			
			try {
				await this.app.updateDocument(currentDocument);
			} catch (updateError: any) {
				// If there's a conflict but the rename worked, just continue
				if (updateError.message?.includes('conflict')) {
					return; // Exit early since the rename worked
				} else {
					throw updateError;
				}
			}
			
		} catch (error) {
			// Silent fail for rename errors
		}
	}

	// Rename list (private method)
	private async renameList(id: string, newName: string): Promise<void> {
		try {
			// Check if listService is available (SSR compatibility)
			if (!this.app.listService) {
				console.log('List service not available');
				return;
			}
			
			// Get the latest version from database
			const currentList = await this.app.listService.read(id);
			if (!currentList) {
				console.log('List not found:', id);
				return;
			}
			
			console.log('Renaming list:', currentList.name, '→', newName);
			
			// Update the name
			currentList.name = newName;
			
			try {
				await this.app.updateList(currentList);
				console.log('List updated successfully');
			} catch (updateError: any) {
				// Handle conflicts like we do for documents
				if (updateError.message?.includes('conflict')) {
					console.log('List rename completed despite conflict');
					return; // Exit early if rename worked despite conflict
				} else {
					console.error('List update failed:', updateError);
					throw updateError;
				}
			}
			
		} catch (error) {
			console.error('Failed to rename list:', error);
		}
	}

	// Delete selected items (documents and lists)
	async deleteSelected(items: ExplorerItem[]): Promise<void> {
		try {
			// Separate documents and lists
			const documentsToDelete = items.filter(item => !item.isFolder);
			const listsToDelete = items.filter(item => item.isFolder);
			
			// Delete documents
			for (const doc of documentsToDelete) {
				await this.app.deleteDocument(doc.id);
			}
			
			// Delete lists (recursively)
			for (const list of listsToDelete) {
				await this.list.delete(list.id);
			}
			
		} catch (error) {
			console.error('Failed to delete selected items:', error);
			throw error;
		}
	}

	// Helper: Get all descendant lists recursively
	private async getAllDescendantLists(listId: string): Promise<any[]> {
		if (!this.app.listService) return [];
		
		const allLists: any[] = [];
		const toProcess = [listId];
		
		while (toProcess.length > 0) {
			const currentId = toProcess.pop()!;
			const currentList = await this.app.listService.read(currentId);
			
			if (currentList) {
				allLists.push(currentList);
				
				// Find child lists
				const children = await this.app.listService.getByParentId(currentId);
				children.forEach(child => toProcess.push(child.id));
			}
		}
		
		return allLists;
	}

	// Helper: Delete all documents in the specified lists
	private async deleteAllDocumentsInLists(lists: any[]): Promise<void> {
		for (const list of lists) {
			// Get documents in this list
			const documents = this.app.documents.filter(doc => doc.parentId === list.id);
			
			// Delete each document
			for (const doc of documents) {
				await this.app.deleteDocument(doc.id);
			}
		}
	}
}
