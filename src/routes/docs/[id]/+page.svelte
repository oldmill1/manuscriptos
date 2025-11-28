<script lang="ts">
	import Editor from '$lib/components/Editor/Editor.svelte';
	import StatusBar from '$lib/components/Editor/StatusBar.svelte';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import WidgetArea from '$lib/components/widgetsarea/WidgetArea.svelte';
	import Dock from '$lib/components/Dock/Dock.svelte';
	import RangeSlider from '$lib/components/RangeSlider/RangeSlider.svelte';
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { editorFontSize } from '$lib/stores/editorFontSize';
	import { marginWidth } from '$lib/stores/marginWidth';
	import type { DockItem } from '$lib/components/Dock/Dock.svelte';

	let { data }: PageProps = $props();
	let documentContent = $state<string | undefined>(undefined);
	let documentTitle = $state<string>('');
	let dbService = $state<any>();
	let isLoading = $state(true);

	// Font size state for status bar
	let fontSize = $state(editorFontSize.get());

	// Margin width state for slider (range: 200px to 1024px)
	let marginWidthValue = $state(marginWidth.get());

	function handleMarginChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		marginWidth.set(value);
		marginWidthValue = value;
	}

	// Dock items for navigation
	const dockItems: DockItem[] = [
		{
			id: 'new-document',
			icon: '/icons/new.png',
			title: 'New Document',
			onClick: handleNewDocument
		},
		{
			id: 'favorites',
			icon: '/icons/heart.png',
			title: 'Favorites',
			onClick: () => {
				console.log('Favorites clicked');
			}
		},
		{
			id: 'explorer',
			icon: '/icons/folder.png',
			title: 'Explorer',
			onClick: () => {
				window.location.href = '/explorer';
			}
		},
		{
			id: 'cabinet',
			icon: '/icons/cabinet.png',
			title: 'Cabinet',
			onClick: () => {
				window.location.href = '/cabinet';
			}
		}
	];

	async function handleNewDocument() {
		try {
			if (!dbService) {
				throw new Error('Database not initialized');
			}

			const { Document } = await import('$lib/models/Document');
			const newDoc = new Document();
			const savedDoc = await dbService.create(newDoc);

			// Show saved notification
			const { savedNotification } = await import('$lib/stores/savedNotificationStore');
			savedNotification.show();

			console.log('New document created:', savedDoc.id);
			console.log('New document title:', savedDoc.title);

			// Navigate to the new document
			window.location.href = `/docs/${savedDoc.id}`;
		} catch (error) {
			console.error('Failed to create new document:', error);
		}
	}

	$effect(() => {
		const unsubscribe = editorFontSize.subscribe((size) => {
			fontSize = size;
		});
		return unsubscribe;
	});

	// Function to update document content from widgets
	function updateDocumentContent(docId: string, newContent: string) {
		if (docId === data.id) {
			console.log('[PAGE] Updating document content from widget');
			documentContent = newContent;
		}
	}

	// Make function available globally for widgets
	onMount(async () => {
		if (typeof window !== 'undefined') {
			(window as any).updateDocumentContent = updateDocumentContent;
		}
		await loadDocument();
	});

	async function loadDocument() {
		try {
			// Initialize document service
			const { DocumentService } = await import('$lib/services/DocumentService');
			const { PouchDatabase } = await import('$lib/implementations/PouchDatabase');
			dbService = new DocumentService(new PouchDatabase('manuscriptOS_DB'));

			// Load the document
			const document = await dbService.read(data.id);

			if (document) {
				documentContent = document.content;
				documentTitle = document.title;
				console.log(`
[LOADED] ${document.title}
         └─ ${document.id.substring(0, 8)} • ${document.createdAt.toRelativeTime?.() || 'just now'}
`);
			} else {
				documentContent = '';
				documentTitle = 'Untitled Document';
			}
		} catch (error) {
			console.error('Failed to load document:', error);
			documentContent = '';
			documentTitle = 'Untitled Document';
		} finally {
			isLoading = false;
		}
	}
</script>

<MenuBar title={documentTitle} titleEditable={true} documentId={data.id} {dbService} />
<Editor content={documentContent} documentId={data.id} {dbService} />

{#snippet leftContent()}
	<span>{fontSize}rem</span>
{/snippet}

{#snippet rightContent()}
	<RangeSlider 
		value={marginWidthValue} 
		oninput={handleMarginChange}
	/>
{/snippet}

<StatusBar {leftContent} {rightContent} />
<WidgetArea title="Widgets" documentId={data.id} {dbService} />
<!-- <Dock items={dockItems} /> -->
