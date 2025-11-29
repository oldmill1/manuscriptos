import { writable } from 'svelte/store';

interface SavedNotificationState {
	show: boolean;
	timestamp: number;
}

function createSavedNotificationStore() {
	const { subscribe, set, update } = writable<SavedNotificationState>({
		show: false,
		timestamp: 0
	});

	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	return {
		subscribe,
		show: () => {
			// Clear any existing timeout
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			// Show the notification
			set({ show: true, timestamp: Date.now() });

			// Hide after 3 seconds
			timeoutId = setTimeout(() => {
				set({ show: false, timestamp: 0 });
				timeoutId = null;
			}, 3000);
		},
		hide: () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}
			set({ show: false, timestamp: 0 });
		}
	};
}

export const savedNotification = createSavedNotificationStore();
