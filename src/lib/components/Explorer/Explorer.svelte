<script lang="ts">
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import type { Snippet } from 'svelte';
	import { Motion } from 'svelte-motion';
	import Switch from '../Buttons/Switch/Switch.svelte';
	import { ExplorerNav } from '../ExplorerNav';
	import Modal from '../Modal/Modal.svelte';
	import styles from './Explorer.module.scss';
	import ExplorerItem from './ExplorerItem/ExplorerItem.svelte';
	import BreadcrumbTrail from './BreadcrumbTrail/BreadcrumbTrail.svelte';
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
		onNewDocument?: () => void;
		onNewCharacter?: () => void;
		onFolderCreate?: (folderName: string, tempId: string) => void;
		onFolderRename?: (folderId: string, newName: string) => void;
		onDocumentCreate?: (documentName: string, tempId: string) => void;
		onDocumentRename?: (documentId: string, newName: string) => void;
		onCharacterCreate?: (characterName: string, tempId: string) => void;
		onCharacterRename?: (characterId: string, newName: string) => void;
		editingTempFolderId?: string | null;
		editingTempDocumentId?: string | null;
		editingTempCharacterId?: string | null;
		folderIds?: string[]; // For breadcrumb trail
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
		onNewDocument,
		onNewCharacter,
		onFolderCreate,
		onFolderRename,
		onDocumentCreate,
		onDocumentRename,
		onCharacterCreate,
		onCharacterRename,
		editingTempFolderId,
		editingTempDocumentId,
		editingTempCharacterId,
		folderIds = []
	}: Props = $props();

	// Debug: Log all received props
	console.log('=== Explorer component props ===');
	console.log('onNewFolder:', !!onNewFolder);
	console.log('onNewDocument:', !!onNewDocument);
	console.log('onNewCharacter:', !!onNewCharacter);
	console.log('onCharacterCreate:', !!onCharacterCreate);
	console.log('=== End Explorer props ===');

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

	function handleSelectionToggle(enabled: boolean) {
		onSelectionToggle?.(enabled);
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

	async function handleNewDocument() {
		console.log('New document button clicked in Explorer component');
		console.log('onNewDocument function:', onNewDocument);
		console.log('onNewDocument type:', typeof onNewDocument);
		// Call the parent's new document handler
		onNewDocument?.();
	}

	async function handleNewCharacter() {
		console.log('New character button clicked in Explorer component');
		console.log('onNewCharacter function:', onNewCharacter);
		console.log('onNewCharacter type:', typeof onNewCharacter);
		// Call the parent's new character handler
		onNewCharacter?.();
	}
</script>

<div class={styles.container}>
	{#if children}
		{@render children()}
	{:else}
		<div class={styles.explorerBg}>
			<ExplorerNav 
				leftContent={[]}
				rightContent={[
					{
						id: 'folder',
						label: 'New Folder',
						icon: '📁',
						onClick: handleNewFolder
					},
					{
						id: 'document',
						label: 'New Document',
						icon: '📄',
						onClick: handleNewDocument
					},
					{
						id: 'character',
						label: 'New Character',
						icon: '🧙',
						onClick: handleNewCharacter
					}
				]}
			/>
			<BreadcrumbTrail {folderIds} />
			<div class={styles.desktop}>
			{#if data.hasLoaded}
				{#each data.items as item (item.id)}
					<ExplorerItem
						item={item}
						isSelectionMode={isSelectionMode}
						onItemClick={handleItemClick}
						onFolderCreate={onFolderCreate}
						onFolderRename={onFolderRename}
						onDocumentCreate={onDocumentCreate}
						onDocumentRename={onDocumentRename}
						onCharacterCreate={onCharacterCreate}
						onCharacterRename={onCharacterRename}
						forceEditing={editingTempFolderId === item.id || editingTempDocumentId === item.id || editingTempCharacterId === item.id}
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
						<div class={styles.actionButtons}>
							<!-- Cut, Copy, Paste buttons -->
							<Motion 
								let:motion
								whileHover={{ y: -2 }}
								whileTap={{ scale: 0.9 }}
								transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
							>
								<div class={`${styles.actionButton} ${styles.disabled}`} use:motion role="button" tabindex="-1" onclick={(e) => e.preventDefault()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}>
									<span>✂️</span>
								</div>
							</Motion>
							<Motion 
								let:motion
								whileHover={{ y: -2 }}
								whileTap={{ scale: 0.9 }}
								transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
							>
								<div class={`${styles.actionButton} ${styles.disabled}`} use:motion role="button" tabindex="-1" onclick={(e) => e.preventDefault()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}>
									<span>📋</span>
								</div>
							</Motion>
							<Motion 
								let:motion
								whileHover={{ y: -2 }}
								whileTap={{ scale: 0.9 }}
								transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
							>
								<div class={`${styles.actionButton} ${styles.disabled}`} use:motion role="button" tabindex="-1" onclick={(e) => e.preventDefault()} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }}>
									<span>📄</span>
								</div>
							</Motion>
							
							<!-- Delete button -->
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
						</div>
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
