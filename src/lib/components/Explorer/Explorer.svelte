<script lang="ts">
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import type { Snippet } from 'svelte';
	import { Motion } from 'svelte-motion';
	import Switch from '../Buttons/Switch/Switch.svelte';
	import { ExplorerNav } from '../ExplorerNav';
	import Modal from '../Modal/Modal.svelte';
	import styles from './Explorer.module.scss';
	import ExplorerItem from './ExplorerItem/ExplorerItem.svelte';
	import type { ExplorerData } from './types';

	interface Props {
		children?: Snippet;
		data: ExplorerData;
		isSelectionMode?: boolean;
		onSelectionChange?: () => void;
		onDeleteSelected?: (selectedDocuments: any[]) => void;
		showSelectionSwitch?: boolean;
		onSelectionToggle?: (enabled: boolean) => void;
		onNewFolder?: () => void;
		onFolderCreate?: (folderName: string, tempId: string) => void;
	}

	let {
		children,
		data,
		isSelectionMode = false,
		onSelectionChange,
		onDeleteSelected,
		showSelectionSwitch = false,
		onSelectionToggle,
		onNewFolder,
		onFolderCreate
	}: Props = $props();

	// Track selected documents from the store
	let selectedDocs = $state<any[]>([]);
	let isDeleteModalOpen = $state(false);
	let isDeleting = $state(false);

	// Subscribe to selected documents store
	$effect(() => {
		const unsubscribe = selectedDocuments.subscribe((state) => {
			selectedDocs = state.documents;
		});

		return unsubscribe;
	});

	// Calculate if delete should be disabled based on selection mode and selected items
	let selectedCount = $derived(selectedDocs.length);
	let isDeleteButtonDisabled = $derived(!isSelectionMode || selectedCount === 0);

	function handleDeleteClick() {
		if (!isDeleteButtonDisabled) {
			isDeleteModalOpen = true;
		}
	}

	async function handleConfirmDelete() {
		if (isDeleting) {
			return;
		}

		isDeleting = true;
		
		try {
			// Call the parent's delete handler
			onDeleteSelected?.(selectedDocs);
			
			// Clear selection after successful deletion
			selectedDocuments.clearSelection();
			
			console.log('All selected documents deleted successfully');
		} catch (error) {
			console.error('Error deleting documents:', error);
		} finally {
			isDeleting = false;
			isDeleteModalOpen = false;
		}
	}

	function handleCancelDelete() {
		isDeleteModalOpen = false;
	}

	function applyMotion(node: any, motionAction: any) {
		return motionAction(node);
	}

	function handleSelectionToggle() {
		const newMode = !isSelectionMode;
		console.log('Selection mode toggled:', newMode ? 'ON' : 'OFF');
		onSelectionToggle?.(newMode);
	}

	function handleItemClick(item: any, event: MouseEvent) {
		if (isSelectionMode) {
			event.preventDefault();
			toggleItemSelection(item);
		} else {
			item.onClick?.(item, event);
		}
	}

	function toggleItemSelection(item: any) {
		if (selectedDocuments.isSelected(item.id)) {
			selectedDocuments.removeDocument(item.id);
		} else {
			selectedDocuments.addDocument(item);
		}
		onSelectionChange?.();
	}

	function checkIfSelected(item: any): boolean {
		return selectedDocs.some((doc) => doc.id === item.id);
	}

	async function handleNewFolder() {
		console.log('New folder clicked');
		// Call the parent's new folder handler
		onNewFolder?.();
	}
</script>

<div class={styles.container}>
	{#if children}
		{@render children()}
	{:else}
		<div class={styles.explorerBg}>
			<ExplorerNav 
				content={[
					{
						id: 'cut',
						label: 'Cut',
						icon: '✂️',
						onClick: () => console.log('Cut clicked'),
						disabled: true
					},
					{
						id: 'copy',
						label: 'Copy',
						icon: '📋',
						onClick: () => console.log('Copy clicked'),
						disabled: true
					},
					{
						id: 'paste',
						label: 'Paste',
						icon: '📄',
						onClick: () => console.log('Paste clicked'),
						disabled: true
					},
					{
						id: 'folder',
						label: 'New Folder',
						icon: '📁',
						onClick: handleNewFolder
					}
				]}
			/>
			<div class={styles.desktop}>
			{#if data.hasLoaded}
				{#each data.items as item (item.id)}
					<ExplorerItem
						item={item}
						isSelectionMode={isSelectionMode}
						onItemClick={handleItemClick}
						onFolderCreate={onFolderCreate}
					/>
				{/each}
			{/if}
		</div>

			<!-- Selection switch -->
			{#if showSelectionSwitch && data.hasLoaded && data.items.length > 0}
				<div class={styles.selectionSwitch}>
					<Switch 
						checked={isSelectionMode} 
						onchange={handleSelectionToggle}
					/>
					
					{#if isSelectionMode}
						<Motion 
							let:motion
							whileHover={!isDeleteButtonDisabled ? { y: -2 } : {}}
							whileTap={!isDeleteButtonDisabled ? { scale: 0.9 } : {}}
							transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
						>
							<div 
                                class={`${styles['deleteButton']} ${isDeleteButtonDisabled ? styles['disabled'] : ''} `} 
                                use:motion
                                onclick={handleDeleteClick}
                                onkeydown={(e) => {
                                    if (!isDeleteButtonDisabled && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        handleDeleteClick();
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
					{/if}
				</div>
			{/if}

			{#if data.hasLoaded && data.items.length === 0}
				<div class={styles.centerMessage}>
					<p>Empty</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<Modal 
	isOpen={isDeleteModalOpen}
	dark={true}
	buttons={[
		{ text: 'Cancel', callback: handleCancelDelete },
		{ text: 'Delete', callback: handleConfirmDelete, primary: true }
	]}
>
	{#snippet content()}
		<h2 style="margin: 0; font-size: 28px; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Confirm Deletion</h2>
	{/snippet}
</Modal>
