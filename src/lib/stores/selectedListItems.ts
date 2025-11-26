import { writable } from 'svelte/store';

export interface ListItem {
	id: string;
	name: string;
	icon: string;
	[key: string]: any; // Allow additional properties
}

export interface SelectedListItemsState {
	items: ListItem[];
	lastUpdated: Date | null;
}

function createSelectedListItemsStore() {
	const { subscribe, set, update } = writable<SelectedListItemsState>({
		items: [],
		lastUpdated: null
	});

	return {
		subscribe,

		// Add an item to the selected list
		addItem: (item: ListItem) => {
			update((state) => {
				// Check if item already exists
				if (state.items.some((listItem) => listItem.id === item.id)) {
					return state;
				}

				return {
					items: [...state.items, item],
					lastUpdated: new Date()
				};
			});
		},

		// Remove an item from the selected list
		removeItem: (itemId: string) => {
			update((state) => ({
				items: state.items.filter((listItem) => listItem.id !== itemId),
				lastUpdated: new Date()
			}));
		},

		// Toggle item selection
		toggleItem: (item: ListItem) => {
			update((state) => {
				const isSelected = state.items.some((listItem) => listItem.id === item.id);

				if (isSelected) {
					return {
						items: state.items.filter((listItem) => listItem.id !== item.id),
						lastUpdated: new Date()
					};
				} else {
					return {
						items: [...state.items, item],
						lastUpdated: new Date()
					};
				}
			});
		},

		// Clear all selected items
		clearSelection: () => {
			update((state) => ({
				items: [],
				lastUpdated: new Date()
			}));
		},

		// Check if an item is selected
		isSelected: (itemId: string) => {
			let selected = false;
			subscribe((state) => {
				selected = state.items.some((listItem) => listItem.id === itemId);
			})();
			return selected;
		},

		// Get count of selected items
		getSelectedCount: () => {
			let count = 0;
			subscribe((state) => {
				count = state.items.length;
			})();
			return count;
		},

		// Get the currently selected items
		getItems: () => {
			let items: ListItem[] = [];
			subscribe((state) => {
				items = state.items;
			})();
			return items;
		},

		// Set the entire selection
		setSelection: (items: ListItem[]) => {
			set({
				items,
				lastUpdated: new Date()
			});
		}
	};
}

export const selectedListItems = createSelectedListItemsStore();
