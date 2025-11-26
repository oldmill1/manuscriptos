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
	}

	let {
		item,
		isSelectionMode = false,
		onItemClick,
		onFolderCreate
	}: Props = $props();

	// Track global selection state for documents
	let globallySelected = $state(false);
	
	// Track editing state for folders
	let isEditing = $state(false);
	let editingValue = $state('');
	let inputElement = $state<HTMLInputElement>();

	// Subscribe to store updates and check if this item is selected
	const unsubscribeSelection = selectedDocuments.subscribe(state => {
		globallySelected = state.documents.some(doc => doc.id === item.id);
		
		// Enable editing for folders when selected
		if (globallySelected && item.icon === '/icons/folder.png') {
			isEditing = true;
			editingValue = item.name;
		} else {
			isEditing = false;
			editingValue = '';
		}
	});
	
	// Auto-focus input when editing starts
	$effect(() => {
		if (isEditing && inputElement) {
			inputElement.focus();
			inputElement.select();
		}
	});

	function handleClick(event: MouseEvent) {
		// Only allow document selection, ignore folders
		if (isSelectionMode && item.icon !== '/icons/folder.png') {
			event.preventDefault();
			toggleItemSelection(item);
		} else if (!isSelectionMode) {
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
		// Only allow document selection
		if (item.icon !== '/icons/folder.png') {
			toggleItemSelection(item);
		}
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
			// Save the folder
			if (editingValue.trim() && onFolderCreate) {
				onFolderCreate(editingValue.trim(), item.id);
			}
		} else if (event.key === 'Escape') {
			event.preventDefault();
			// Cancel editing and remove from selection
			selectedDocuments.removeDocument(item.id);
		}
	}
	
	function handleInputBlur() {
		// Save the folder when input loses focus
		if (editingValue.trim() && onFolderCreate) {
			onFolderCreate(editingValue.trim(), item.id);
		} else {
			// Remove from selection if empty
			selectedDocuments.removeDocument(item.id);
		}
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
		onclick={handleClick}
		onkeydown={handleKeydown}
	>
		{#if isSelectionMode && item.icon !== '/icons/folder.png'}
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
