<script lang="ts">
	import '$lib/styles/reset.css';
	import { onMount } from 'svelte';
	import { shortcutsService } from '$lib/services/ShortcutsService';
	import { editorFontSize } from '$lib/stores/editorFontSize';
	import { Analytics } from '@vercel/analytics/svelte';

	let { children } = $props();

	// Initialize global shortcuts
	onMount(() => {
		// Register Option + "=" to increase font size
		// Using 'code' instead of 'key' for Mac compatibility (Option + "+" produces "≠" character)
		shortcutsService.register({
			code: 'Equal', // Physical key code for =/+ key
			modifiers: ['Alt'],
			handler: () => {
				editorFontSize.increase();
			},
			description: 'Increase editor font size'
		});

		// Register Option + "-" to decrease font size
		shortcutsService.register({
			code: 'Minus', // Physical key code for -/_ key
			modifiers: ['Alt'],
			handler: () => {
				editorFontSize.decrease();
			},
			description: 'Decrease editor font size'
		});

		// Register Option + "L" to toggle widget area visibility
		shortcutsService.register({
			code: 'KeyL', // Physical key code for L key
			modifiers: ['Alt'],
			handler: () => {
				// Import and use the toggle function from widgetVisibility store
				import('$lib/stores/widgetVisibility').then(({ toggleWidgetVisibility }) => {
					toggleWidgetVisibility();
				});
			},
			description: 'Toggle widget area visibility'
		});

		// Start listening for shortcuts
		shortcutsService.start();

		// Cleanup on unmount
		return () => {
			shortcutsService.stop();
		};
	});
</script>


<svelte:head>
	<title>manuscriptOS Novel Writer</title>
</svelte:head>

{@render children()}

<Analytics />
