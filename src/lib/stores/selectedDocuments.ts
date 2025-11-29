import { writable } from 'svelte/store';
import type { Document } from '$lib/models/Document';
import type { ClipboardItem } from '$lib/interfaces/ClipboardItem';

// Base interface for items that can be selected (kept for backward compatibility)
export interface SelectableItem {
	id: string;
	name: string;
	icon?: string;
}

export interface SelectedDocumentsState {
	documents: SelectableItem[];
	lastUpdated: Date | null;
	copiedItems: ClipboardItem[];
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
		copySelected: (richClipboardItems?: ClipboardItem[]) => {
			update((state) => {
				// If rich clipboard data is provided (from appState), use it
				if (richClipboardItems) {
					return {
						...state,
						copiedItems: richClipboardItems,
						copyOperation: 'copy',
						lastUpdated: new Date()
					};
				}

				// Otherwise, fall back to basic conversion (backward compatibility)
				const clipboardItems: ClipboardItem[] = state.documents.map(doc => ({
					id: doc.id,
					type: 'document' as const, // Default to document for now
					name: doc.name,
					data: null as any, // Will be populated by appState
					originalParentId: undefined
				}));

				return {
					...state,
					copiedItems: clipboardItems,
					copyOperation: 'copy',
					lastUpdated: new Date()
				};
			});
		},

		// Cut selected items to clipboard
		cutSelected: () => {
			update((state) => {
				// Convert SelectableItem[] to ClipboardItem[] for now
				// We'll enhance this later when we have service methods to get full data
				const clipboardItems: ClipboardItem[] = state.documents.map(doc => ({
					id: doc.id,
					type: 'document' as const, // Default to document for now
					name: doc.name,
					data: null as any, // Temporary - will be populated when we integrate with services
					originalParentId: undefined
				}));

				return {
					documents: [],
					copiedItems: clipboardItems,
					copyOperation: 'cut',
					lastUpdated: new Date()
				};
			});
		},

		// Paste items from clipboard
		pasteItems: (targetParentId?: string) => {
			// Return the current clipboard state with rich ClipboardItem data
			let clipboardItems: ClipboardItem[] = [];
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
