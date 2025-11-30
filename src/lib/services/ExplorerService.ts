// ExplorerService - Centralized explorer operations
import type { ListType } from '$lib/models/List';
import type { ExplorerItem } from '$lib/components/Explorer/types';
import { useAppState } from '$lib/stores/appState.svelte';

// Supported temporary item types
interface TempItemType {
	type: 'document' | 'folder' | 'manuscript' | 'character' | 'scene';
}

// TODO: Implement unified folder/document creation and management

export class ExplorerService {
	private app: ReturnType<typeof useAppState>;

	constructor(app: ReturnType<typeof useAppState>) {
		this.app = app;
	}

	// Get available folder types
	getAvailableTypes(): string[] {
		return ['character', 'manuscript', 'scene', 'custom'];
	}

	// Unified temporary item creation
	createTemp(type: TempItemType['type']): void {
		switch (type) {
			case 'document':
				const tempId = `temp-doc-${crypto.randomUUID()}`;
				const tempDocument: ExplorerItem = {
					id: tempId,
					name: 'Untitled Document',
					type: 'document',
					icon: '/icons/new.png',
					isTemp: true,
					isEditing: true
				};
				this.app.addTemporaryDocument(tempDocument);
				this.app.setEditingTempDocumentId(tempId);
				break;
			case 'folder':
				// TODO: Implement folder creation
				break;
			case 'character':
				// TODO: Implement character creation
				break;
			case 'scene':
				// TODO: Implement scene creation
				break;
			case 'manuscript':
				// TODO: Implement manuscript creation
				break;
		}
	}

	// Save permanent item
	async save(type: TempItemType['type'], name: string, tempId: string, parentId?: string): Promise<void> {
		switch (type) {
			case 'document':				
				// Create actual document using app state with parentId context
				await this.app.createDocument(name, '', parentId);
								
				// Remove temporary document and clear editing state
				this.app.removeTemporaryDocument(tempId);
				this.app.setEditingTempDocumentId(null);
				break;
			case 'folder':
				// TODO: Implement folder creation
				break;
			case 'character':
				// TODO: Implement character creation
				break;
			case 'scene':
				// TODO: Implement scene creation
				break;
			case 'manuscript':
				// TODO: Implement manuscript creation
				break;
		}
	}

	// Rename item
	async rename(type: 'document' | 'list', id: string, newName: string): Promise<void> {
		switch (type) {
			case 'document':
				await this.renameDocument(id, newName);
				break;
			case 'list':
				await this.renameList(id, newName);
				break;
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
