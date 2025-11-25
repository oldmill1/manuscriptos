<script lang="ts">
	import styles from './Editor.module.scss';
	import { onMount } from 'svelte';
	import { Document } from '$lib/models/Document';
	import { editorFontSize } from '$lib/stores/editorFontSize';
	import { savedNotification } from '$lib/stores/savedNotificationStore';

	interface Props {
		content?: string | undefined;
		documentId?: string;
		dbService?: any;
		key?: string;
		forceClear?: boolean;
	}

	let { content = undefined, documentId, dbService }: Props = $props();

	// Reactive state for editor content
	let editorContent = $state(content || '');
	
	// Check if editor is empty
	let isEmpty = $derived(!editorContent.trim());

	// Reference to the editable div
	let editableDiv: HTMLElement;
	
	// Subscribe to font size changes and apply to editor
	$effect(() => {
		const unsubscribe = editorFontSize.subscribe((size) => {
			if (editableDiv) {
				editableDiv.style.fontSize = `${size}rem`;
			}
		});
		return unsubscribe;
	});

	// Debounce variables
	let debounceTimer: number;
	let isUpdatingFromWidget = $state(false);

	// Track the previous content to detect actual prop changes
	let previousContent = $state(content);
	let previousDocumentId = $state(documentId);

	// Set initial content after mount
	onMount(() => {
		const contentToSet: string = content || '';
		if (editableDiv) {
			editableDiv.innerText = contentToSet;
			editorContent = contentToSet;
			previousContent = contentToSet;
			// Set initial font size from store
			const currentSize = editorFontSize.get();
			editableDiv.style.fontSize = `${currentSize}rem`;
		}
	});

	// Update content when prop changes from parent
	$effect(() => {
		const contentToSet: string = content || '';

		// Force update if documentId changed OR content changed
		const documentIdChanged = documentId !== previousDocumentId;
		const contentChanged = contentToSet !== previousContent;

		if (documentIdChanged || contentChanged) {
			if (editableDiv) {
				// Force complete DOM clear using selection API
				const range = document.createRange();
				range.selectNodeContents(editableDiv);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
				document.execCommand('delete');
				editableDiv.innerText = contentToSet;
			}

			editorContent = contentToSet;
			previousContent = contentToSet;
			previousDocumentId = documentId;
		}
	});

	// Handle input events with debouncing
	async function handleInput(event: Event) {
		const target = event.target as HTMLElement;
		editorContent = target.innerText || '';

		// Clear existing timer
		clearTimeout(debounceTimer);

		// Set new timer
		debounceTimer = setTimeout(async () => {
			try {
				if (documentId && dbService) {
					// Load existing document
					const existingDoc = await dbService.read(documentId);

					if (existingDoc) {
						// Update content
						existingDoc.updateContent(editorContent);

						// Save to database
						await dbService.update(existingDoc);

						// Show saved notification
						savedNotification.show();

						console.log(`
[SAVED] ${existingDoc.title}
        └─ ${existingDoc.id.substring(0, 8)} • ${new Date().toLocaleTimeString()}
`);
					}
				}
			} catch (error) {
				console.error('Failed to save document:', error);
			}
		}, 500); // 500ms delay
	}
</script>

<div class={styles.editorContainer}>
	<div class={styles.rulerContainer}>
		<div
			class={styles.contentEditable}
			contenteditable="true"
			oninput={handleInput}
			bind:this={editableDiv}
		></div>
	</div>
	{#if isEmpty}
		<div class={styles.emptyTips}>
			<div class={styles.tipText}>
				To create a new document, press Option + N
			</div>
		</div>
	{/if}
</div>
