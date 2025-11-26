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
}

function createSelectedDocumentsStore() {
	const { subscribe, set, update } = writable<SelectedDocumentsState>({
		documents: [],
		lastUpdated: null
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
					documents: [...state.documents, document],
					lastUpdated: new Date()
				};
			});
		},

		// Remove a document from the selected list
		removeDocument: (documentId: string) => {
			update((state) => ({
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
						documents: state.documents.filter((doc) => doc.id !== document.id),
						lastUpdated: new Date()
					};
				} else {
					return {
						documents: [...state.documents, document],
						lastUpdated: new Date()
					};
				}
			});
		},

		// Clear all selected documents
		clearSelection: () => {
			update((state) => ({
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
				lastUpdated: new Date()
			});
		}
	};
}

export const selectedDocuments = createSelectedDocumentsStore();
