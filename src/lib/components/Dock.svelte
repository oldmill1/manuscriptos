<script lang="ts" module>
	export interface DockItem {
		id: string;
		icon: string;
		title: string;
		onClick: () => void;
		active?: boolean;
		badge?: number;
	}
</script>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
	import styles from './Dock.module.scss';

	// Custom slide-in transition without fade
	function slideFn(node: Element, isShowing: boolean) {
		return {
			duration: 400,
			easing: cubicInOut,
			css: (t: number, u: number) => {
				// When showing from hidden, slide from right (100 to 0)
				// When initial load, slide from left (-100 to 0)
				const startX = isShowing ? 150 : -100;
				// Use u (1 - t) for smooth reverse interpolation
				const x = startX * u;
				// Preserve vertical centering (translateY(-50%)) while sliding horizontally
				return `transform: translateX(${x}px) translateY(-50%);`;
			}
		};
	}

	let { items = [] }: { items: DockItem[] } = $props();

	let isVisible = $state(true);
	let isShowing = $state(false);
	let hideTimeout: number;

	function handleMouseMove() {
		// Clear existing timeout
		if (hideTimeout) {
			clearTimeout(hideTimeout);
		}

		// Show dock immediately if it was hidden
		if (!isVisible) {
			isShowing = true;
			isVisible = true;
			// Reset isShowing after animation completes
			setTimeout(() => {
				isShowing = false;
			}, 400);
		}

		// Set new timeout to hide after 3 seconds
		hideTimeout = setTimeout(() => {
			isVisible = false;
		}, 3000) as unknown as number;
	}

	function handleMouseEnter() {
		// When mouse enters dock area, keep it visible
		if (hideTimeout) {
			clearTimeout(hideTimeout);
		}
		isVisible = true;
	}

	function handleMouseLeave() {
		// When mouse leaves dock area, start the 3 second countdown
		handleMouseMove();
	}

	onMount(() => {
		// Add global mouse move listener only in browser
		if (typeof document !== 'undefined') {
			document.addEventListener('mousemove', handleMouseMove);
		}
		
		// Initial timeout to hide after 3 seconds
		hideTimeout = setTimeout(() => {
			isVisible = false;
		}, 3000) as unknown as number;
	});

	onDestroy(() => {
		// Clean up event listeners and timeouts only in browser
		if (typeof document !== 'undefined') {
			document.removeEventListener('mousemove', handleMouseMove);
		}
		if (hideTimeout) {
			clearTimeout(hideTimeout);
		}
	});
</script>

{#if isVisible}
<div 
	class={styles['dock']}
	role="toolbar"
	tabindex="0"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	in:slideFn={isShowing}
	out:fly={{ y: 0, x: 100, duration: 400, easing: cubicInOut }}
>
	{#each items as item (item.id)}
		<button
			class={`${styles['dock-item']} ${item.active ? styles['active'] : ''}`}
			onclick={item.onClick}
			title={item.title}
		>
			<img src={item.icon} alt={item.title} class={styles['dock-icon']} />
			{#if item.badge && item.badge > 0}
				<span class={styles['selection-count']}>{item.badge}</span>
			{/if}
		</button>
	{/each}
</div>
{/if}
