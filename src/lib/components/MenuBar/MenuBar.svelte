<script lang="ts">
	import styles from './MenuBar.module.scss';
	import { toggleWidgetVisibility } from '$lib/stores/widgetVisibility';

	interface Props {
		title?: string;
		titleEditable?: boolean;
		documentId?: string;
		dbService?: any;
	}

	let { title = '', titleEditable = false, documentId, dbService }: Props = $props();

	let isEditing = $state(false);
	let editingTitle = $state('');
	let inputRef = $state<HTMLInputElement>();
	let isValid = $state(true);
	const tabindex = $derived(titleEditable ? 0 : undefined);

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
</script>

<div class={styles.menubar}>
	<div class={styles.leftSection}>
		<button
			type="button"
			class={styles.homeButton}
			onclick={goHome}
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && goHome()}
			aria-label="Go home"
		>
			<img src="/icons/home-flat.png" alt="Home" class={styles.homeIcon} />
		</button>
	</div>
	<div class={styles.centerSection}>
		{#if isEditing}
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
				<span class={styles.documentTitle}>
					{title}
				</span>
			{/if}
		{/if}
	</div>
	<div class={styles.rightSection}>
		<div class={styles.taskDrawer}>
			<button
				type="button"
				class={styles.widgetButton}
				onclick={handleWidgetClick}
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleWidgetClick()}
				aria-label="Toggle widgets"
			>
				<img src="/icons/widget.png" alt="Widgets" class={styles.widgetIcon} />
			</button>
		</div>
	</div>
</div>
