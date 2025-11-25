import { writable } from 'svelte/store';

function createMarginWidthStore() {
	const { subscribe, set, update } = writable(960); // Default max-width in pixels

	return {
		subscribe,
		set,
		update,
		get: () => {
			let value = 960;
			subscribe(v => value = v)();
			return value;
		}
	};
}

export const marginWidth = createMarginWidthStore();
