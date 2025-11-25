<script lang="ts">
	import styles from './Explorer.module.scss';
	import DocumentButton from './DocumentButton.svelte';
	import FolderButton from './FolderButton.svelte';
	import IconItem from '../global/IconItem.svelte';
	import Button from '../global/Button.svelte';
	import type { Snippet } from 'svelte';
	import { Document } from '$lib/models/Document';
	import { List } from '$lib/models/List';
	import { selectedDocuments } from '$lib/stores/selectedDocuments';

	interface FileItem {
		id: string;
		name: string;
		type: 'folder' | 'file';
		icon?: string;
	}

	interface Props {
		children?: Snippet;
		files?: FileItem[];
		documents?: Document[];
		lists?: List[];
		hasLoaded?: boolean;
		onDocumentClick?: (doc: Document, event: MouseEvent) => void;
		onListClick?: (list: List, event: MouseEvent) => void;
		isSelectionMode?: boolean;
		onSelectionChange?: () => void;
		onDeleteSelected?: (selectedDocuments: Document[]) => void;
	}

	let {
		children,
		files = [],
		documents = [],
		lists = [],
		hasLoaded = true,
		onDocumentClick,
		onListClick,
		isSelectionMode = false,
		onSelectionChange,
		onDeleteSelected
	}: Props = $props();

	// Convert documents to file items for display
	const documentFiles = $derived(
		documents.map((doc) => ({
			id: doc.id,
			name: doc.title || 'Untitled Document',
			type: 'file' as const,
			icon: '/icons/new.png'
		}))
	);

	// Use documents if available, otherwise fall back to files
	const displayFiles = $derived(documents.length > 0 ? documentFiles : files);

	// Track selected documents from the store
	let selectedDocs = $state<Document[]>([]);

	// Subscribe to selected documents store
	$effect(() => {
		const unsubscribe = selectedDocuments.subscribe((state) => {
			selectedDocs = state.documents;
		});

		return unsubscribe;
	});
</script>

<div class={styles.container}>
	{#if children}
		{@render children()}
	{:else}
		<div class={styles.explorerBg}>
			<div class={styles.desktop}>
			{#if hasLoaded}
				{#if lists.length > 0}
					{#each lists as list (list.id)}
						<FolderButton
							list={list}
							onListClick={onListClick || (() => {})}
						/>
					{/each}
				{:else}
					{#each displayFiles as file (file.id)}
						<div class={styles.fileItem}>
							<IconItem name={file.name} icon={file.icon || '/icons/folder.png'} />
						</div>
					{/each}
				{/if}
			{/if}
		</div>

			{#if hasLoaded && lists.length === 0 && files.length === 0}
				<div class={styles.centerMessage}>
					<p>Empty</p>
				</div>
			{/if}

			{#if isSelectionMode}
				<div class={styles.selectButtonPosition}>
					<Button
						onclick={() => onDeleteSelected?.(selectedDocs)}
						text="Delete"
						icon="/icons/trash-can.png"
						alt="Delete"
					/>
				</div>
			{/if}
		</div>
	{/if}
</div>
