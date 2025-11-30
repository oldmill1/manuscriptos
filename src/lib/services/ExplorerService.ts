// ExplorerService - Centralized explorer operations
/**
 * API for centralized explorer operations
 * 
 * Document Operations:
 * - document.new(title?: string, tempId?: string, parentId?: string): Promise<void>
 * - document.update(field: string, id: string, value: any): Promise<void>
 * 
 * List Operations:
 * - list.new(): void
 * - list.save(listName: string, tempId: string, parentId?: string): Promise<void>
 * - list.update(field: string, id: string, value: any): Promise<void>
 * 
 * TODO: Add delete operations for both documents and lists
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
}
