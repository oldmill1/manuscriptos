// ExplorerService - Centralized explorer operations
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
		// Use listService for ALL list types (folder, character, scene, manuscript)
		// TODO: Implement list renaming logic
	}
}
