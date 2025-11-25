<script lang="ts">
	import styles from './WidgetArea.module.scss';
	import type { Snippet } from 'svelte';
	import { widgetVisibility, hideWidget } from '$lib/stores/widgetVisibility';
	import AddToListWidget from './AddToListWidget.svelte';
	import RewriterWidget from './RewriterWidget.svelte';
	import type { TransitionConfig } from 'svelte/transition';

	interface Props {
		children?: Snippet;
		title?: string;
		variant?: 'default' | 'compact' | 'expanded';
		class?: string;
		documentId?: string;
		dbService?: any;
	}

	let { children, title, variant = 'default', class: className = '', documentId, dbService }: Props = $props();

	let isVisible = $state(true);
	let isAnimating = $state(false);

	// Subscribe to the store using Svelte 5 syntax
	$effect(() => {
		const unsubscribe = widgetVisibility.subscribe((value) => {
			const wasVisible = isVisible;
			// Set animating state synchronously BEFORE updating visibility
			if (!value && wasVisible) {
				// Force immediate update
				isAnimating = true;
				// Use microtask to ensure it's set before transition
				queueMicrotask(() => {
					isAnimating = true;
				});
			} else if (value && !wasVisible) {
				// Reset when showing
				isAnimating = false;
			}
			isVisible = value;
		});
		return unsubscribe;
	});

	function toggleVisibility() {
		isVisible = !isVisible;
		widgetVisibility.set(isVisible);
	}

	function handleIntroStart() {
		isAnimating = true;
	}

	function handleIntroEnd() {
		isAnimating = false;
	}

	function handleOutroStart() {
		// Ensure animating is set immediately when outro starts
		isAnimating = true;
	}

	function handleOutroEnd() {
		// Keep animating true until element is fully removed
		isAnimating = true;
	}

	function fadeDown(node: Element, { duration = 300 }: { duration?: number } = {}): TransitionConfig {
		return {
			duration,
			css: (t) => {
				const opacity = t;
				const y = (1 - t) * -10; // Start at -10px, move to 0px
				return `
					opacity: ${opacity};
					transform: translateY(${y}px);
				`;
			}
		};
	}
</script>

{#if isVisible}
	<div 
		class={`${styles.widgetArea} ${isAnimating ? styles.animating : ''}`} 
		transition:fadeDown={{ duration: 300 }}
		onintrostart={handleIntroStart}
		onintroend={handleIntroEnd}
		onoutrostart={handleOutroStart}
		onoutroend={handleOutroEnd}
	>
		<div class={`${styles.contentContainer} ${isAnimating ? styles.animating : ''}`}>
			<div class={`${styles.content} ${isAnimating ? styles.animating : ''}`}>
				{#if documentId}
					<AddToListWidget {documentId} {dbService} />
					<RewriterWidget {documentId} {dbService} />
				{/if}

				{#if children}
					{@render children()}
				{:else if !documentId}
					<div class={styles.placeholder}>
						<p>Widget area content goes here</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
