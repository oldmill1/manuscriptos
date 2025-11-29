import { writable } from 'svelte/store';
import type { Document } from '$lib/models/Document';

// Base interface for items that can be selected
export interface SelectableItem {
	id: string;
	name: string;
	icon?: string;
}

export interface SelectedDocumentsState {
	documents: SelectableItem[];
	lastUpdated: Date | null;
	copiedItems: SelectableItem[];
	copyOperation: 'copy' | 'cut' | null;
}

function createSelectedDocumentsStore() {
	const { subscribe, set, update } = writable<SelectedDocumentsState>({
		documents: [],
		lastUpdated: null,
		copiedItems: [],
		copyOperation: null
	});

	return {
		subscribe,

		// Add a document to the selected list
		addDocument: (document: SelectableItem) => {
			update((state) => {
				// Check if document already exists
				if (state.documents.some((doc) => doc.id === document.id)) {
					return state;
				}

				return {
					...state,
					documents: [...state.documents, document],
					lastUpdated: new Date()
				};
			});
		},

		// Remove a document from the selected list
		removeDocument: (documentId: string) => {
			update((state) => ({
				...state,
				documents: state.documents.filter((doc) => doc.id !== documentId),
				lastUpdated: new Date()
			}));
		},

		// Toggle document selection
		toggleDocument: (document: SelectableItem) => {
			update((state) => {
				const isSelected = state.documents.some((doc) => doc.id === document.id);

				if (isSelected) {
					return {
						...state,
						documents: state.documents.filter((doc) => doc.id !== document.id),
						lastUpdated: new Date()
					};
				} else {
					return {
						...state,
						documents: [...state.documents, document],
						lastUpdated: new Date()
					};
				}
			});
		},

		// Clear all selected documents
		clearSelection: () => {
			update((state) => ({
				...state,
				documents: [],
				lastUpdated: new Date()
			}));
		},

		// Check if a document is selected
		isSelected: (documentId: string) => {
			let selected = false;
			subscribe((state) => {
				selected = state.documents.some((doc) => doc.id === documentId);
			})();
			return selected;
		},

		// Get count of selected documents
		getSelectedCount: () => {
			let count = 0;
			subscribe((state) => {
				count = state.documents.length;
			})();
			return count;
		},

		// Get the currently selected documents
		getDocuments: () => {
			let docs: SelectableItem[] = [];
			subscribe((state) => {
				docs = state.documents;
			})();
			return docs;
		},

		// Set the entire selection
		setSelection: (documents: SelectableItem[]) => {
			set({
				documents,
				lastUpdated: new Date(),
				copiedItems: [],
				copyOperation: null
			});
		},

		// Copy selected items to clipboard
		copySelected: () => {
			update((state) => ({
				...state,
				copiedItems: [...state.documents],
				copyOperation: 'copy',
				lastUpdated: new Date()
			}));
		},

		// Cut selected items to clipboard
		cutSelected: () => {
			update((state) => ({
				documents: [],
				copiedItems: [...state.documents],
				copyOperation: 'cut',
				lastUpdated: new Date()
			}));
		},

		// Paste items from clipboard
		pasteItems: (targetParentId?: string) => {
			// This will be implemented later when we add the actual paste functionality
			// For now, just return the current clipboard state
			let clipboardItems: SelectableItem[] = [];
			let operation: 'copy' | 'cut' | null = null;
			
			subscribe((state) => {
				clipboardItems = state.copiedItems;
				operation = state.copyOperation;
			})();

			return { items: clipboardItems, operation, targetParentId };
		}
	};
}

export const selectedDocuments = createSelectedDocumentsStore();
