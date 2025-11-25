<script lang="ts" generics="T">
	import { fade } from 'svelte/transition';
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import WolverineButton from '$lib/components/Buttons/WolverineButton/WolverineButton.svelte';
	import Button from '$lib/components/global/Button.svelte';
	import Switch from '$lib/components/Buttons/Switch/Switch.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import { Motion } from 'svelte-motion';
	import { DocumentService } from '$lib/services/DocumentService';
	import styles from './VList.module.scss';

	export let items: T[] = [];
	export let hasLoaded: boolean = false;
	export let isSelectionMode: boolean = false;
	export let emptyMessage: string = 'No items found';
	export let buttonText: string = 'Create new document';
	export let emptyButtonTopDrawerText: string = 'get started...';
	export let emptyButtonBottomDrawerText: string = '...it\'s easy!';
	export let onEmptyButtonClick: () => void = () => {};
	export let onItemClick: (item: T, event: MouseEvent) => void = () => {};
	export let onToggleSelection: (item: T) => void = () => {};
	export let onToggleSelectionMode: () => void = () => {};
	export let onDeleteClick: () => void = () => {};
	export let getItemId: (item: T) => string = (item) => (item as any).id;
	export let isItemSelected: (item: T) => boolean = (item) =>
		selectedDocuments.isSelected(getItemId(item));
	export let renderItemContent: import('svelte').Snippet<[T]> = defaultItemContent;
	export let enableDocumentDeletion: boolean = false;

	let isDeleteModalOpen = false;
	let documentService: DocumentService;
	let isDeleting = false;

	function handleItemClick(item: T, event: MouseEvent) {
		onItemClick(item, event);
	}

	function toggleItemSelection(item: T) {
		onToggleSelection(item);
	}

	function handleSwitchChange() {
		onToggleSelectionMode();
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
				documentService = new DocumentService();
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
	$: selectedCount = $selectedDocuments.documents.length;
	$: isDeleteButtonDisabled = !isSelectionMode || selectedCount === 0;

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
		<button
			class={`${styles['item']} ${isSelectionMode ? styles['selection-mode'] : ''} ${isItemSelected(item) ? styles['selected'] : ''}`}
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
			checked={isItemSelected(item)}
			onchange={() => toggleItemSelection(item)}
			onclick={(e) => e.stopPropagation()}
		/>
	{/if}
</div>
			{@render renderItemContent(item)}
			<div class={styles['item-arrow']}>→</div>
		</button>
	{/each}

	{#if hasLoaded && items.length === 0}
		<div class={styles['empty-state']} transition:fade={{ duration: 300 }}>
			<p>{emptyMessage}</p>
			<WolverineButton 
				text={buttonText}
				topDrawerText={emptyButtonTopDrawerText}
				bottomDrawerText={emptyButtonBottomDrawerText}
				onclick={onEmptyButtonClick} 
				width="250px" 
			/>
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

<Modal 
	bind:isOpen={isDeleteModalOpen}
	dark={true}
	buttons={[
		{ text: 'Cancel', callback: handleCancelDelete },
		{ text: 'Confirm', callback: handleConfirmDelete, primary: true }
	]}
	content={modalContent}
/>

{#snippet modalContent()}
	<div style="text-align: center;">
		<h2 style="margin-bottom: 16px;">Confirm Deletion</h2>
		<p style="opacity: 0.8; margin-bottom: 8px;">Are you sure you want to delete the selected items?</p>
		<p style="opacity: 0.6; font-size: 14px;">{selectedCount} item{selectedCount !== 1 ? 's' : ''} will be permanently deleted.</p>
		{#if isDeleting}
			<p style="opacity: 0.8; font-size: 14px; margin-top: 16px;">Deleting...</p>
		{/if}
	</div>
{/snippet}
