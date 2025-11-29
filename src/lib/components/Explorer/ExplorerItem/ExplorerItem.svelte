<script lang="ts">
	import { goto } from '$app/navigation';
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import type { ExplorerItem } from '$lib/components/Explorer/types';
	import { onDestroy } from 'svelte';
	import { Motion } from 'svelte-motion';
	import SwitchMini from '../../SwitchMini/SwitchMini.svelte';
	import styles from './ExplorerItem.module.scss';

	interface Props {
		item: ExplorerItem;
		isSelectionMode?: boolean;
		onItemClick?: (item: any, event: MouseEvent) => void;
		onFolderCreate?: (folderName: string, tempId: string) => void;
		onFolderRename?: (folderId: string, newName: string) => void;
		onDocumentCreate?: (documentName: string, tempId: string) => void;
		onDocumentRename?: (documentId: string, newName: string) => void;
		onCharacterCreate?: (characterName: string, tempId: string) => void;
		forceEditing?: boolean;
	}

	let {
		item,
		isSelectionMode = false,
		onItemClick,
		onFolderCreate,
		onFolderRename,
		onDocumentCreate,
		onDocumentRename,
		onCharacterCreate,
		forceEditing = false
	}: Props = $props();

	// Track global selection state for documents
	let globallySelected = $state(false);
	
	// Track editing state for folders
	let isEditing = $state(false);
	let editingValue = $state('');
	let inputElement = $state<HTMLInputElement>();
	
	// Track long press for editing
	let pressTimer = $state<ReturnType<typeof setTimeout> | null>(null);
	let isPressed = $state(false);
	
	// Flag to prevent blur after Enter key
	let isExitingByEnter = $state(false);

	// Subscribe to store updates and check if this item is selected
	const unsubscribeSelection = selectedDocuments.subscribe(state => {
		globallySelected = state.documents.some(doc => doc.id === item.id);
		
		// Note: Don't automatically enable editing for folders when selected
		// Editing should be a separate action from selection
	});
	
	// Handle force editing for new folders and documents
	$effect(() => {
		if (forceEditing && (item.icon === '/icons/folder.png' || item.icon === '/icons/new.png') && !isEditing) {
			isEditing = true;
			editingValue = item.name;
			// Focus the input after it's rendered
			setTimeout(() => {
				inputElement?.focus();
				inputElement?.select();
			}, 0);
		}
	});
	
	// Auto-focus input when editing starts
	$effect(() => {
		if (isEditing && inputElement) {
			inputElement.focus();
			inputElement.select();
		}
	});

	function handleMouseDown(event: MouseEvent) {
		// Enable long press for both folders and documents
		if ((item.icon === '/icons/folder.png' || !item.isFolder) && !isSelectionMode) {
			isPressed = true;
			pressTimer = setTimeout(() => {
				if (isPressed) {
					startEditing();
				}
			}, 1000); // 1 second long press
		}
	}

	function handleMouseUp() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
		isPressed = false;
	}

	function handleMouseLeave() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
		isPressed = false;
	}

	function startEditing() {
		// Allow editing for both folders and documents
		if (item.icon === '/icons/folder.png' || !item.isFolder) {
			isEditing = true;
			editingValue = item.name;
		}
	}

	function handleClick(event: MouseEvent) {
		// Allow both documents and folders to be selected
		if (isSelectionMode) {
			event.preventDefault();
			toggleItemSelection(item);
		} else if (!isSelectionMode && !isEditing) {
			// Only handle click if not in editing mode and not a long press
			onItemClick?.(item, event);
		}
	}

	function toggleItemSelection(item: any) {
		if (selectedDocuments.isSelected(item.id)) {
			selectedDocuments.removeDocument(item.id);
		} else {
			selectedDocuments.addDocument(item);
		}
	}

	function handleSwitchChange() {
		// Allow both documents and folders to be selected
		toggleItemSelection(item);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			// Create a synthetic MouseEvent for keyboard interactions
			const syntheticEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window
			});
			handleClick(syntheticEvent);
		}
	}
	
	function handleInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			event.stopPropagation();
			// Check if this is a temporary folder (starts with 'temp-' but NOT 'temp-doc-' or 'temp-char-')
			const isTempFolder = item.id.startsWith('temp-') && !item.id.startsWith('temp-doc-') && !item.id.startsWith('temp-char-');
			// Check if this is a temporary document (starts with 'temp-doc-')
			const isTempDocument = item.id.startsWith('temp-doc-');
			// Check if this is a temporary character (starts with 'temp-char-')
			const isTempCharacter = item.id.startsWith('temp-char-');
			
			// Set flag to prevent blur from running
			isExitingByEnter = true;
			
			if (editingValue) {
				if (isTempFolder && onFolderCreate) {
					// Create new folder
					onFolderCreate(editingValue, item.id);
				} else if (isTempDocument && onDocumentCreate) {
					// Create new document
					onDocumentCreate(editingValue, item.id);
				} else if (isTempCharacter && onCharacterCreate) {
					// Create new character
					onCharacterCreate(editingValue, item.id);
				} else if (!isTempFolder && !isTempDocument && !isTempCharacter) {
					// Rename existing item
					if (item.isFolder && onFolderRename) {
						// Rename existing folder
						onFolderRename(item.id, editingValue);
					} else if (!item.isFolder && onDocumentRename) {
						// Rename existing document
						onDocumentRename(item.id, editingValue);
					}
				}
			}
			isEditing = false;
			// Remove focus to prevent blur event from firing
			(event.target as HTMLInputElement)?.blur();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			// Cancel editing
			isExitingByEnter = true;
			isEditing = false;
			// Remove focus to prevent blur event from firing
			(event.target as HTMLInputElement)?.blur();
		}
	}
	
	function handleInputBlur() {
		// Completely disable blur handling to prevent duplicates
		// Only Enter key should save the folder
		return;
	}

	// Cleanup on component destroy
	onDestroy(() => {
		unsubscribeSelection();
	});
</script>

<Motion 
	let:motion
	whileHover={{ 
		scale: 1.03,
		y: -2,
		transition: { type: "spring", stiffness: 400 }
	}}
	whileTap={{ scale: 0.98 }}
	transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>
	<div 
		class={`${styles.explorerItem} ${isSelectionMode ? styles.selectionMode : ''} ${globallySelected ? styles.selected : ''}`}
		use:motion
		role="button"
		tabindex="0"
		onmousedown={handleMouseDown}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseLeave}
		onclick={handleClick}
		onkeydown={handleKeydown}
		data-folder-id={item.id}
		data-folder-name={item.name}
	>
		{#if isSelectionMode}
			<div class={styles.selectionCheckbox}>
				<SwitchMini
					checked={globallySelected}
					onchange={handleSwitchChange}
					onclick={(e: MouseEvent) => e.stopPropagation()}
				/>
			</div>
		{/if}
		<img src={item.icon} alt={item.name} class={styles.icon} />
		{#if isEditing && (item.icon === '/icons/folder.png' || item.icon === '/icons/new.png' || !item.isFolder)}
			<input 
				type="text" 
				bind:this={inputElement}
				bind:value={editingValue}
				class={styles.input}
				onblur={handleInputBlur}
				onclick={(e: MouseEvent) => e.stopPropagation()}
				onkeydown={(e: KeyboardEvent) => {
					if (e.key === ' ') {
						e.stopPropagation();
					}
					handleInputKeydown(e);
				}}
			/>
		{:else}
			<span class={styles.label}>{item.name}</span>
		{/if}
	</div>
</Motion>
