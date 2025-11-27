<script lang="ts">
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import type { SelectableItem } from '$lib/stores/selectedDocuments';
	import { onDestroy } from 'svelte';
	import { Motion } from 'svelte-motion';
	import SwitchMini from '../../SwitchMini/SwitchMini.svelte';
	import styles from './ExplorerItem.module.scss';

	interface Props {
		item: SelectableItem;
		isSelectionMode?: boolean;
		onItemClick?: (item: any, event: MouseEvent) => void;
		onFolderCreate?: (folderName: string, tempId: string) => void;
		onFolderRename?: (folderId: string, newName: string) => void;
	}

	let {
		item,
		isSelectionMode = false,
		onItemClick,
		onFolderCreate,
		onFolderRename
	}: Props = $props();

	// Track global selection state for documents
	let globallySelected = $state(false);
	
	// Track editing state for folders
	let isEditing = $state(false);
	let editingValue = $state('');
	let inputElement = $state<HTMLInputElement>();
	
	// Track long press for editing
	let pressTimer = $state<number | null>(null);
	let isPressed = $state(false);

	// Subscribe to store updates and check if this item is selected
	const unsubscribeSelection = selectedDocuments.subscribe(state => {
		globallySelected = state.documents.some(doc => doc.id === item.id);
		
		// Note: Don't automatically enable editing for folders when selected
		// Editing should be a separate action from selection
	});
	
	// Auto-focus input when editing starts
	$effect(() => {
		if (isEditing && inputElement) {
			inputElement.focus();
			inputElement.select();
		}
	});

	function handleMouseDown(event: MouseEvent) {
		// Only enable long press for folders
		if (item.icon === '/icons/folder.png' && !isSelectionMode) {
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
		if (item.icon === '/icons/folder.png') {
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
		console.log('Toggling selection for:', item.name);
		if (selectedDocuments.isSelected(item.id)) {
			console.log('Removing document from selection');
			selectedDocuments.removeDocument(item.id);
		} else {
			console.log('Adding document to selection');
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
			// Save the folder with new name
			if (editingValue.trim() && onFolderRename) {
				onFolderRename(item.id, editingValue.trim());
			}
			isEditing = false;
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			// Cancel editing
			isEditing = false;
		}
	}
	
	function handleInputBlur() {
		// Save the folder when input loses focus
		if (editingValue.trim() && onFolderRename) {
			onFolderRename(item.id, editingValue.trim());
		}
		isEditing = false;
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
		{#if isEditing && item.icon === '/icons/folder.png'}
			<input 
				type="text" 
				bind:this={inputElement}
				bind:value={editingValue}
				class={styles.input}
				onkeydown={handleInputKeydown}
				onblur={handleInputBlur}
				onclick={(e: MouseEvent) => e.stopPropagation()}
			/>
		{:else}
			<span class={styles.label}>{item.name}</span>
		{/if}
	</div>
</Motion>
