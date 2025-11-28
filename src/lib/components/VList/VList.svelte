<script lang="ts" generics="T">
	import Switch from '$lib/components/Buttons/Switch/Switch.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import { DocumentService } from '$lib/services/DocumentService';
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import { Motion } from 'svelte-motion';
	import { fade } from 'svelte/transition';
	import styles from './VList.module.scss';

	interface Props {
		items: T[];
		hasLoaded: boolean;
		isSelectionMode: boolean;
		emptyMessage: string;
		buttonText: string;
		emptyButtonTopDrawerText: string;
		emptyButtonBottomDrawerText: string;
		onEmptyButtonClick: () => void;
		onItemClick: (item: T, event: MouseEvent) => void;
		onToggleSelection: (item: T) => void;
		onToggleSelectionMode: (enabled: boolean) => void;
		onDeleteClick: () => void;
		getItemId: (item: T) => string;
		isItemSelected: (item: T) => boolean;
		renderItemContent: import('svelte').Snippet<[T]>;
		enableDocumentDeletion: boolean;
	}

	let {
		items = [],
		hasLoaded = false,
		isSelectionMode = false,
		emptyMessage = 'No items found',
		buttonText = 'Create new document',
		emptyButtonTopDrawerText = 'get started...',
		emptyButtonBottomDrawerText = '...it\'s easy!',
		onEmptyButtonClick = () => {},
		onItemClick = () => {},
		onToggleSelection = () => {},
		onToggleSelectionMode = () => {},
		onDeleteClick = () => {},
		getItemId = (item) => (item as any).id,
		isItemSelected = () => false,
		renderItemContent = defaultItemContent,
		enableDocumentDeletion = false
	}: Props = $props();

	let isDeleteModalOpen = $state(false);
	let documentService: DocumentService;
	let isDeleting = $state(false);
	let selectedDocs: any[] = $state([]);

	// Subscribe to selected documents store for reactivity
	$effect(() => {
		const unsubscribe = selectedDocuments.subscribe((state) => {
			selectedDocs = state.documents;
		});
		return unsubscribe;
	});

	// Create reactive isItemSelected function
	function checkIfSelected(item: T): boolean {
		return selectedDocs.some((doc) => doc.id === getItemId(item));
	}

	function handleItemClick(item: T, event: MouseEvent) {
		if (isSelectionMode) {
			event.preventDefault();
			toggleItemSelection(item);
		} else {
			onItemClick(item, event);
		}
	}

	function toggleItemSelection(item: T) {
		onToggleSelection(item);
	}

	function handleSwitchChange(enabled: boolean) {
		console.log('=== VLIST SELECTION DEBUG ===');
		console.log('VList handleSwitchChange called with:', enabled);
		console.log('Current isSelectionMode before:', isSelectionMode);
		onToggleSelectionMode(enabled);
		console.log('Called onToggleSelectionMode with:', enabled);
		console.log('=== END VLIST SELECTION DEBUG ===');
	}

	function handleDeleteClick() {
		if (!isDeleteButtonDisabled) {
			isDeleteModalOpen = true;
		}
	}

	async function handleConfirmDelete() {
		if (isDeleting || !enableDocumentDeletion) {
			onDeleteClick(); // Fallback to original behavior
			isDeleteModalOpen = false;
			return;
		}

		isDeleting = true;
		
		try {
			if (!documentService) {
				const { DocumentService } = await import('$lib/services/DocumentService');
				const { PouchDatabase } = await import('$lib/implementations/PouchDatabase');
				documentService = new DocumentService(new PouchDatabase('manuscriptOS_DB'));
			}

			const selectedDocs = $selectedDocuments.documents;
			console.log('Deleting documents:', selectedDocs.map(doc => doc.id));

			// Delete each selected document
			const deletePromises = selectedDocs.map(async (doc) => {
				try {
					await documentService.delete(doc.id);
					console.log('Successfully deleted document:', doc.id);
				} catch (error) {
					console.error('Failed to delete document:', doc.id, error);
					throw error;
				}
			});

			await Promise.all(deletePromises);

			// Clear selection after successful deletion
			selectedDocuments.clearSelection();

			// Call the original onDeleteClick for any additional cleanup
			onDeleteClick();

			console.log('All selected documents deleted successfully');
		} catch (error) {
			console.error('Error deleting documents:', error);
			// You could show an error notification here
		} finally {
			isDeleting = false;
			isDeleteModalOpen = false;
		}
	}

	function handleCancelDelete() {
		isDeleteModalOpen = false;
	}

	// Calculate if delete should be disabled based on selection mode and selected items
	let selectedCount = $derived(selectedDocs.length);
	let isDeleteButtonDisabled = $derived(!isSelectionMode || selectedCount === 0);

	function applyMotion(node: any, motionAction: any) {
		return motionAction(node);
	}
</script>

{#snippet defaultItemContent(item: T)}
	<div class={styles['item-info']}>
		<h3 class={styles['item-title']}>{(item as any).title || 'Untitled'}</h3>
		<p class={styles['item-preview']}>
			{(item as any).content ? ((item as any).content as string).slice(0, 100) : ''}
		</p>
	</div>
{/snippet}

<div class={styles['items-list']}>
	{#each items as item (getItemId(item))}
		<Motion 
			let:motion
			whileHover={{ scale: 1.02, x: 4 }}
			whileTap={{ scale: 0.98 }}
			transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
		>
			<button
				class={`${styles['item']} ${isSelectionMode ? styles['selection-mode'] : ''} ${checkIfSelected(item) ? styles['selected'] : ''}`}
				use:motion
				onclick={(e) => handleItemClick(item, e)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleItemClick(item, e as any);
					}
				}}
				type="button"
				transition:fade={{ duration: 300 }}
			>
				<div class={styles['selection-checkbox']}>
					{#if isSelectionMode}
						<input
							type="checkbox"
							checked={checkIfSelected(item)}
							onchange={() => toggleItemSelection(item)}
							onclick={(e) => e.stopPropagation()}
						/>
					{/if}
				</div>
				{@render renderItemContent(item)}
				<div class={styles['item-arrow']}>→</div>
			</button>
		</Motion>
	{/each}

	{#if hasLoaded && items.length === 0}
		<div class={styles['empty-state']} transition:fade={{ duration: 300 }}>
			<p>{emptyMessage}</p>
		</div>
	{/if}
</div>

{#if hasLoaded && items.length > 0}
	<div class={styles['selection-controls']}>
		<Motion 
			let:motion
			whileHover={!isDeleteButtonDisabled ? { y: -2 } : {}}
			whileTap={!isDeleteButtonDisabled ? { scale: 0.9 } : {}}
			transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
		>
			<div 
				class={`${styles['recycle-button']} ${isDeleteButtonDisabled ? styles['disabled'] : ''}`} 
				use:motion
				onclick={handleDeleteClick}
				onkeydown={(e) => {
					if (!isDeleteButtonDisabled && (e.key === 'Enter' || e.key === ' ')) {
						e.preventDefault();
						onDeleteClick();
					}
				}}
				role="button"
				tabindex={isDeleteButtonDisabled ? -1 : 0}
			>
				<Motion 
					let:motion
					whileHover={!isDeleteButtonDisabled ? { y: -2 } : {}}
					transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
				>
					<span use:applyMotion={motion}>🗑️</span>
				</Motion>
			</div>
		</Motion>
		<div class={styles['switch-container']}>
			<Switch checked={isSelectionMode} onchange={handleSwitchChange} />
		</div>
	</div>
{/if}

{#snippet content()}
	<h2 style="margin: 0; font-size: 28px; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Confirm Deletion</h2>
{/snippet}

<Modal 
	isOpen={isDeleteModalOpen}
	dark={true}
	buttons={[
		{ text: 'Cancel', callback: handleCancelDelete },
		{ text: 'Delete', callback: handleConfirmDelete, primary: true }
	]}
>
	{@render content()}
</Modal>
