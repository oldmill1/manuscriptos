<script lang="ts">
	import styles from './ExplorerItem.module.scss';
	import SwitchMini from '../../SwitchMini/SwitchMini.svelte';
	import { Motion } from 'svelte-motion';

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

	function handleClick(event: MouseEvent) {
		onItemClick?.(item, event);
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
		class={`${styles.explorerItem} ${isSelectionMode ? styles.selectionMode : ''} ${isSelected ? styles.selected : ''}`}
		use:motion
		role="button"
		tabindex="0"
		onclick={handleClick}
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
