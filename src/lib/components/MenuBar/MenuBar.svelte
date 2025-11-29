<script lang="ts">
	import { goto } from '$app/navigation';
	import styles from './MenuBar.module.scss';
	import { toggleWidgetVisibility } from '$lib/stores/widgetVisibility';
	import { Motion } from 'svelte-motion';

	interface Props {
		title?: string;
		logo?: string;
		titleEditable?: boolean;
		documentId?: string;
		dbService?: any;
		backButton?: boolean;
		onBackClick?: () => void;
		hideLeftButton?: boolean;
		largeLogo?: boolean;
	}

	let { title = '', logo, titleEditable = false, documentId, dbService, backButton = false, onBackClick, hideLeftButton = false, largeLogo = false }: Props = $props();

	let isEditing = $state(false);
	let editingTitle = $state('');
	let inputRef = $state<HTMLInputElement>();
	let isValid = $state(true);
	const tabindex = $derived(titleEditable ? 0 : undefined);

	function applyMotion(node: any, motionAction: any) {
		return motionAction(node);
	}

	function startEditing() {
		isEditing = true;
		editingTitle = title;
		isValid = true;
		setTimeout(() => inputRef?.focus(), 0);
	}

	function validateTitle(title: string): boolean {
		return title.trim().length > 0 && title.trim().length <= 100;
	}

	async function saveTitle() {
		if (!validateTitle(editingTitle)) {
			isValid = false;
			return;
		}

		const newTitle = editingTitle.trim();

		if (newTitle !== title && documentId && dbService) {
			try {
				await updateDocumentWithRetry(newTitle);
				// Only update UI state after successful database update
				title = newTitle;
				isEditing = false;
				isValid = true;
				console.log(`
[TITLE UPDATED] ${newTitle}
        └─ ${documentId.substring(0, 8)} • ${new Date().toLocaleTimeString()}
`);
			} catch (error) {
				console.error('Failed to update title after retries:', error);
				// Revert to edit mode on persistent failure
				isValid = false;
				// Don't change isEditing - let user try again
			}
		} else {
			// Title didn't change, just exit edit mode
			isEditing = false;
			isValid = true;
		}
	}

	async function updateDocumentWithRetry(newTitle: string, maxRetries: number = 3): Promise<void> {
		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				const existingDoc = await dbService.read(documentId);
				if (existingDoc) {
					existingDoc.updateTitle(newTitle);
					await dbService.update(existingDoc);
					return; // Success, exit retry loop
				}
			} catch (error: any) {
				if (error.status === 409 && attempt < maxRetries) {
					// Conflict error, retry after a short delay
					console.log(`Update conflict, retrying... (attempt ${attempt}/${maxRetries})`);
					await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
				} else {
					throw error; // Re-throw if not a conflict or max retries reached
				}
			}
		}
		throw new Error(`Failed to update document after ${maxRetries} attempts`);
	}

	function cancelEdit() {
		isEditing = false;
		isValid = true;
		editingTitle = title;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			saveTitle();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEdit();
		}
	}

	function handleWidgetClick() {
		toggleWidgetVisibility();
	}

	function goHome() {
		window.location.href = '/';
	}

	function handleTitleClick() {
		// Check if we're in the explorer section
		const currentPath = window.location.pathname;
		
		if (currentPath === '/explorer') {
			// If we're at the root explorer, go to home
			goto('/');
		} else if (currentPath.startsWith('/explorer')) {
			// If we're in a nested explorer path, go back to /explorer
			goto('/explorer');
		} else {
			// Otherwise, go to home
			goto('/');
		}
	}
</script>

<div class={styles.menubar}>
	<div class={styles.leftSection}>
		{#if !hideLeftButton}
			{#if backButton}
				<Motion 
					let:motion
					whileHover={{ scale: 1.1, y: -2 }}
					whileTap={{ scale: 0.95, y: 0 }}
					transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
				>
					<button
						type="button"
						class={styles.backButton}
						onclick={onBackClick}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onBackClick?.()}
						aria-label="Go back"
						use:motion
					>
						<img src="/icons/logo.png" alt="Back" class={styles.backIcon} />
					</button>
				</Motion>
			{:else}
				<Motion 
					let:motion
					whileHover={{ scale: 1.1, y: -2 }}
					whileTap={{ scale: 0.95, y: 0 }}
					transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
				>
					<button
						type="button"
						class={styles.homeButton}
						onclick={goHome}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && goHome()}
						aria-label="Go home"
						use:motion
					>
						<img src="/icons/logo.png" alt="Home" class={styles.homeIcon} />
					</button>
				</Motion>
			{/if}
		{/if}
	</div>
	<div class={styles.centerSection}>
		{#if logo}
			<Motion 
				let:motion
				whileHover={{ scale: 1.02, y: -1 }}
				whileTap={{ scale: 0.98, y: 0 }}
				transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
			>
				<button
					type="button"
					class={largeLogo ? styles.largeLogoButton : styles.logoButton}
					onclick={handleTitleClick}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTitleClick()}
					use:motion
				>
					<img src={logo} alt="Logo" class={largeLogo ? styles.largeLogo : styles.logo} />
				</button>
			</Motion>
		{:else if isEditing}
			<input
				bind:this={inputRef}
				bind:value={editingTitle}
				class={`${styles.titleInput} ${!isValid ? styles.invalid : ''}`}
				onkeydown={handleKeydown}
				onblur={saveTitle}
			/>
		{:else if title}
			{#if titleEditable}
				<button
					type="button"
					class={styles.documentTitle}
					onclick={startEditing}
					onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && startEditing()}
				>
					{title}
				</button>
			{:else}
				<Motion 
					let:motion
					whileHover={{ scale: 1.02, y: -1 }}
					whileTap={{ scale: 0.98, y: 0 }}
					transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
				>
					<button
						type="button"
						class={styles.documentTitle}
						onclick={handleTitleClick}
						onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTitleClick()}
						use:motion
					>
						{title}
					</button>
				</Motion>
			{/if}
		{/if}
	</div>
	<div class={styles.rightSection}>
		<div class={styles.taskDrawer}>
			<!-- Task drawer is now empty -->
		</div>
	</div>
</div>
