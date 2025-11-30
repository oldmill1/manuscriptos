import { writable } from 'svelte/store';
import { browser } from '$app/environment';
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

// Global store instance - truly singleton
let globalStore: ReturnType<typeof createSelectedDocumentsStore> | null = null;

function createSelectedDocumentsStore() {
	// Try to load from localStorage first
	const getInitialState = (): SelectedDocumentsState => {
		if (!browser) {
			return {
				documents: [],
				lastUpdated: null,
				copiedItems: [],
				copyOperation: null
			};
		}

		try {
			const stored = localStorage.getItem('manuscriptOS_selectedDocuments');
			if (stored) {
				const parsed = JSON.parse(stored);
				// Loaded selectedDocuments from localStorage
				return {
					...parsed,
					lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : null
				};
			}
		} catch (error) {
			console.warn('🔥 Failed to load selectedDocuments from localStorage:', error);
		}

		return {
			documents: [],
			lastUpdated: null,
			copiedItems: [],
			copyOperation: null
		};
	};

	const { subscribe, set, update } = writable<SelectedDocumentsState>(getInitialState());

	// Save to localStorage whenever state changes
	const persistStore = (state: SelectedDocumentsState) => {
		if (browser) {
			try {
				localStorage.setItem('manuscriptOS_selectedDocuments', JSON.stringify(state));
				// Saved selectedDocuments to localStorage
			} catch (error) {
				console.warn('🔥 Failed to save selectedDocuments to localStorage:', error);
			}
		}
	};

	// Add debug wrapper to track all store changes
	const debugSet = (newState: SelectedDocumentsState) => {
		// selectedDocuments.set called
		// Clipboard state after set
		persistStore(newState);
		set(newState);
	};

	const debugUpdate = (updater: (state: SelectedDocumentsState) => SelectedDocumentsState) => {
		update((currentState) => {
			const newState = updater(currentState);
			// selectedDocuments.update called
			// Before update
			// After update
			persistStore(newState);
			return newState;
		});
	};

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
			debugUpdate((state) => ({
				...state,
				documents: [],
				lastUpdated: new Date()
				// ✅ Preserve clipboard state - don't clear copiedItems or copyOperation
			}));
		},

		// Clear selection AND clipboard (for when we actually want to reset everything)
		clearAll: () => {
			debugSet({
				documents: [],
				lastUpdated: new Date(),
				copiedItems: [],
				copyOperation: null
			});
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
			debugUpdate((state) => ({
				documents,
				lastUpdated: new Date(),
				copiedItems: state.copiedItems,        // ✅ Preserve clipboard
				copyOperation: state.copyOperation    // ✅ Preserve operation
			}));
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

// Singleton export - ensures the same instance across the entire app
export const selectedDocuments = globalStore || (globalStore = createSelectedDocumentsStore());
