<script lang="ts">
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import type { Snippet } from 'svelte';
	import { Motion } from 'svelte-motion';
	import Switch from '../Buttons/Switch/Switch.svelte';
	import AquaButton from '../Buttons/AquaButton/AquaButton.svelte';
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
		onNewManuscript?: () => void;
		onFolderCreate?: (folderName: string, tempId: string) => void;
		onFolderRename?: (folderId: string, newName: string) => void;
		onDocumentCreate?: (documentName: string, tempId: string) => void;
		onDocumentRename?: (documentId: string, newName: string) => void;
		onCharacterCreate?: (characterName: string, tempId: string) => void;
		onManuscriptCreate?: (manuscriptName: string, tempId: string) => void;
		onCopySelected?: () => void;
		onCutSelected?: () => void;
		onPasteSelected?: () => void;
		editingTempFolderId?: string | null;
		editingTempDocumentId?: string | null;
		folderIds?: string[]; // For breadcrumb trail
		currentListType?: string | null; // For custom empty messages
		currentListName?: string; // For custom empty messages
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
		onNewManuscript,
		onFolderCreate,
		onFolderRename,
		onDocumentCreate,
		onDocumentRename,
		onCharacterCreate,
		onManuscriptCreate,
		onCopySelected,
		onCutSelected,
		onPasteSelected,
		editingTempFolderId,
		editingTempDocumentId,
		folderIds = [],
		currentListType = null,
		currentListName = ''
	}: Props = $props();

	// Track selected documents from the store
	let selectedDocs = $state<any[]>([]);
	let isDeleteModalOpen = $state(false);
	let isDeleting = $state(false);
	let hasClipboardItems = $state(false);

	// Subscribe to selected documents store
	$effect(() => {
		const unsubscribe = selectedDocuments.subscribe((state) => {
			console.log('🔥 Explorer store subscription update:', state);
			selectedDocs = state.documents;
			hasClipboardItems = state.copiedItems.length > 0;
			console.log('🔥 hasClipboardItems updated to:', hasClipboardItems);
		});

		return unsubscribe;
	});

	// Calculate if delete should be disabled based on selection mode and selected items
	let selectedCount = $derived(selectedDocs.length);
	let isDeleteButtonDisabled = $derived(!isSelectionMode || selectedCount === 0);
	let isCutCopyButtonDisabled = $derived(!isSelectionMode || selectedCount === 0);
	let isPasteButtonDisabled = $derived(!hasClipboardItems);

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
		// Call the parent's new folder handler
		onNewFolder?.();
	}

	async function handleNewDocument() {
		// Call the parent's new document handler
		onNewDocument?.();
	}

	async function handleNewCharacter() {
		// Call the parent's new character handler
		onNewCharacter?.();
	}

	async function handleNewManuscript() {
		// Call the parent's new manuscript handler
		onNewManuscript?.();
	}

	async function handlePaste() {
		console.log('🔥 NORMAL MODE PASTE BUTTON CLICKED!');
		console.log('🔥 Explorer handlePaste called - PASTE BUTTON CLICKED!');
		// Call the parent's paste handler
		onPasteSelected?.();
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
						icon: '/icons/folder.png',
						onClick: handleNewFolder
					},
					{
						id: 'document',
						label: 'New Document',
						icon: '/icons/new.png',
						onClick: handleNewDocument
					},
					{
						id: 'character',
						label: 'New Character',
						icon: '/icons/fantasy.png',
						onClick: handleNewCharacter
					},
					...(hasClipboardItems ? [{
						id: 'paste',
						label: 'Paste',
						icon: '📋',
						onClick: handlePaste
					}] : [])
				]}
			/>
			<BreadcrumbTrail {folderIds} />
			<div class={styles.desktop}>
			{#if data.hasLoaded}
				<!-- Action row for character lists -->
				{#if currentListType === 'character'}
					<div class={styles.actionRow}>
						<AquaButton 
							text="Add Scene"
							onClick={() => {}}
							primary={true}
							dark={false}
							disabled={false}
							type="button"
						/>
					</div>
				{/if}
				
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
						onManuscriptCreate={onManuscriptCreate}
						forceEditing={editingTempFolderId === item.id || editingTempDocumentId === item.id}
					/>
				{/each}
			{/if}
		</div>

			<!-- Selection switch -->
			{#if showSelectionSwitch && data.hasLoaded}
				<div class={styles.selectionSwitch}>
					<Switch 
						checked={isSelectionMode} 
						onchange={handleSelectionToggle}
					/>
					
					<Motion 
						let:motion
						animate={isSelectionMode ? {
							opacity: 1,
							width: 'auto',
							maxWidth: 200
						} : {
							opacity: 0,
							width: 0,
							maxWidth: 0
						}}
						transition={{ 
							duration: 0.3, 
							ease: [0.4, 0, 0.2, 1] 
						}}
					>
						<div class={styles.actionButtons} use:motion>
							<!-- Cut, Copy, Paste buttons -->
							<Motion 
								let:motion
								whileHover={!isCutCopyButtonDisabled ? { y: -2 } : {}}
								whileTap={!isCutCopyButtonDisabled ? { scale: 0.9 } : {}}
								transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
							>
								<div 
									class={`${styles.actionButton} ${isCutCopyButtonDisabled ? styles.disabled : ''}`} 
									use:motion 
									role="button" 
									tabindex={isCutCopyButtonDisabled ? -1 : 0} 
									onclick={!isCutCopyButtonDisabled ? onCutSelected : undefined} 
									onkeydown={(e) => { 
										if (!isCutCopyButtonDisabled && (e.key === 'Enter' || e.key === ' ')) { 
											onCutSelected?.(); 
										} 
									}}
								>
									<img src="/icons/cut.png" alt="Cut" />
								</div>
							</Motion>
							<Motion 
								let:motion
								whileHover={!isCutCopyButtonDisabled ? { y: -2 } : {}}
								whileTap={!isCutCopyButtonDisabled ? { scale: 0.9 } : {}}
								transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
							>
								<div 
									class={`${styles.actionButton} ${isCutCopyButtonDisabled ? styles.disabled : ''}`} 
									use:motion 
									role="button" 
									tabindex={isCutCopyButtonDisabled ? -1 : 0} 
									onclick={!isCutCopyButtonDisabled ? onCopySelected : undefined} 
									onkeydown={(e) => { 
										if (!isCutCopyButtonDisabled && (e.key === 'Enter' || e.key === ' ')) { 
											onCopySelected?.(); 
										} 
									}}
								>
									<img src="/icons/copy.png" alt="Copy" />
								</div>
							</Motion>
							<Motion 
								let:motion
								whileHover={!isPasteButtonDisabled ? { y: -2 } : {}}
								whileTap={!isPasteButtonDisabled ? { scale: 0.9 } : {}}
								transition={{ duration: 0.1, ease: [0.4, 0, 0.2, 1] }}
							>
								<div 
									class={`${styles.actionButton} ${isPasteButtonDisabled ? styles.disabled : ''}`} 
									use:motion 
									role="button" 
									tabindex={isPasteButtonDisabled ? -1 : 0} 
									onclick={!isPasteButtonDisabled ? onPasteSelected : undefined} 
									onkeydown={(e) => { 
										if (!isPasteButtonDisabled && (e.key === 'Enter' || e.key === ' ')) { 
											onPasteSelected?.(); 
										} 
									}}
								>
									<img src="/icons/paste.png" alt="Paste" />
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
										<span use:applyMotion={motion} style="font-size: 1.2em;">🗑️</span>
									</Motion>
								</div>
							</Motion>
						</div>
					</Motion>
				</div>
			{/if}

			{#if data.hasLoaded && data.items.length === 0}
				<div class={styles.centerMessage}>
					<p>
						{#if currentListType === 'character' && currentListName}
							{currentListName}
						{:else}
							Empty
						{/if}
					</p>
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
