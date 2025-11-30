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
		console.log('ExplorerService initialized');
	}

	// Placeholder for future unified operations
	helloWorld(): string {
		return 'ExplorerService is ready';
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

	// Get available folder types
	getAvailableTypes(): string[] {
		return ['character', 'manuscript', 'scene', 'custom'];
	}

	// Save permanent item
	async save(type: TempItemType['type'], name: string, tempId: string, parentId?: string): Promise<void> {
		switch (type) {
			case 'document':
				// Debug: Log what we're trying to save
				console.log('ExplorerService.save() called with:', { type, name, tempId, parentId });
				
				// Create actual document using app state with parentId context
				console.log('Before app.createDocument() - app.documents count:', this.app.documents.length);
				const savedDocument = await this.app.createDocument(name, '', parentId);
				console.log('After app.createDocument() - saved document:', savedDocument);
				console.log('After app.createDocument() - app.documents count:', this.app.documents.length);
				
				// Don't call loadRootLevel() - it replaces the documents array and loses the new document
				
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
}
