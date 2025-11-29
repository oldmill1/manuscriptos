// Toast state management using Svelte 5 runes
let activeToasts = $state<Array<{ id: string; message: string; element: HTMLElement }>>([]);

// Toast service for showing notifications
export const toastService = {
	/**
	 * Show a toast notification
	 */
	show(message: string, duration: number = 3000): string {
		const id = crypto.randomUUID();
		
		// Create toast element
		const toastElement = document.createElement('div');
		toastElement.className = 'toast';
		toastElement.textContent = message;
		toastElement.style.cssText = `
			position: fixed;
			top: 20px;
			left: 50%;
			transform: translateX(-50%);
			background: rgba(0, 0, 0, 0.8);
			color: white;
			padding: 12px 20px;
			border-radius: 8px;
			font-size: 14px;
			font-weight: 500;
			text-align: center;
			z-index: 9999;
			backdrop-filter: blur(4px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			user-select: none;
			opacity: 0;
			transition: opacity 0.3s ease;
		`;

		// Add to DOM
		document.body.appendChild(toastElement);

		// Add to state
		const toast = { id, message, element: toastElement };
		activeToasts = [...activeToasts, toast];

		// Fade in
		requestAnimationFrame(() => {
			toastElement.style.opacity = '1';
		});

		// Auto-remove after duration
		setTimeout(() => {
			this.remove(id);
		}, duration);

		return id;
	},

	/**
	 * Remove a toast by ID
	 */
	remove(id: string): void {
		const toast = activeToasts.find(t => t.id === id);
		if (toast) {
			// Fade out
			toast.element.style.opacity = '0';
			
			// Remove from DOM after transition
			setTimeout(() => {
				if (toast.element.parentNode) {
					toast.element.parentNode.removeChild(toast.element);
				}
				activeToasts = activeToasts.filter(t => t.id !== id);
			}, 300);
		}
	},

	/**
	 * Clear all toasts
	 */
	clear(): void {
		activeToasts.forEach(toast => {
			toast.element.style.opacity = '0';
			setTimeout(() => {
				if (toast.element.parentNode) {
					toast.element.parentNode.removeChild(toast.element);
				}
			}, 300);
		});
		activeToasts = [];
	},

	/**
	 * Get current toasts (for debugging/testing)
	 */
	getToasts() {
		return activeToasts;
	}
};
