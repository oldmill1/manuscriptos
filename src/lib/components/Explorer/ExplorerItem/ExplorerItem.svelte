<script lang="ts">
	import styles from './ExplorerItem.module.scss';
	import SwitchMini from '../../SwitchMini/SwitchMini.svelte';
	import { Motion } from 'svelte-motion';
	import { onDestroy } from 'svelte';
	import { selectedListItems, type ListItem } from '$lib/stores/selectedListItems';

	interface Props {
		item: any;
		isSelectionMode?: boolean;
		isSelected?: boolean;
		onItemClick?: (item: any, event: MouseEvent) => void;
		onToggleSelection?: (item: any) => void;
	}

	let {
		item,
		isSelectionMode = false,
		isSelected = false,
		onItemClick,
		onToggleSelection
	}: Props = $props();

	let pressTimer: number | null = null;
	let isLongPress = false;

	function handleClick(event: MouseEvent) {
		// Don't trigger regular click if it was a long press
		if (isLongPress) {
			isLongPress = false;
			return;
		}
		onItemClick?.(item, event);
	}

	function handleMouseDown(event: MouseEvent) {
		// Only start long press timer for left click
		if (event.button === 0) {
			isLongPress = false;
			pressTimer = setTimeout(() => {
				isLongPress = true;
				// Add item to global selection
				selectedListItems.toggleItem(item as ListItem);
			}, 1000); // 1 second long press
		}
	}

	function handleMouseUp() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	function handleMouseLeave() {
		if (pressTimer) {
			clearTimeout(pressTimer);
			pressTimer = null;
		}
	}

	function handleToggleSelection() {
		onToggleSelection?.(item);
	}

	function handleSwitchChange() {
		onToggleSelection?.(item);
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

	// Track global selection state
	let globallySelected = $state(false);

	// Subscribe to store updates and check if this item is selected
	const unsubscribeSelection = selectedListItems.subscribe(state => {
		globallySelected = state.items.some(listItem => listItem.id === item.id);
	});

	// Cleanup timer on component destroy
	onDestroy(() => {
		if (pressTimer) {
			clearTimeout(pressTimer);
		}
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
		class={`${styles.explorerItem} ${isSelectionMode ? styles.selectionMode : ''} ${isSelected || globallySelected ? styles.selected : ''}`}
		use:motion
		role="button"
		tabindex="0"
		onclick={handleClick}
		onmousedown={handleMouseDown}
		onmouseup={handleMouseUp}
		onmouseleave={handleMouseLeave}
		onkeydown={handleKeydown}
	>
		{#if isSelectionMode}
			<div class={styles.selectionCheckbox}>
				<SwitchMini
					checked={isSelected}
					onchange={handleSwitchChange}
					onclick={(e: MouseEvent) => e.stopPropagation()}
				/>
			</div>
		{/if}
		<img src={item.icon} alt={item.name} class={styles.icon} />
		<span class={styles.label}>{item.name}</span>
	</div>
</Motion>
