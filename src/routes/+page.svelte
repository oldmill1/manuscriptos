<script lang="ts">
	import { goto } from '$app/navigation';
	import WolverineButton from '$lib/components/Buttons/WolverineButton/WolverineButton.svelte';
	import Dock from '$lib/components/Dock/Dock.svelte';
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	import VList from '$lib/components/VList/VList.svelte';
	import { Document } from '$lib/models/Document';
	import { savedNotification } from '$lib/stores/savedNotificationStore';
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import { onMount } from 'svelte';
	import { useAppState } from '$lib/stores/appState.svelte';
	import styles from './+page.module.scss';

	// Use centralized app state
	const app = useAppState();
	let isBrowser = $state(false);
	let recentDocs = $state<Document[]>([]);
	let selectedCategory = $state('Recents');
	let hasLoaded = $state(false);
	let greeting = $state('');

	onMount(async () => {
		isBrowser = true;
		await app.loadRootLevel();
		
		// Get recent documents from ALL documents in system, not just root level
		const allDocs = await app.loadAllDocuments();
		recentDocs = allDocs.slice(0, 10); // Get last 10 documents created anywhere
		
		hasLoaded = true;
	});

	async function handleNewDocument() {
		try {
			const newDoc = new Document();
			const savedDoc = await app.createDocument(newDoc.title, newDoc.content, newDoc.parentId);

			// Show saved notification
			savedNotification.show();

			// Refresh recent docs before navigating
			const allDocs = [...app.documents];
			recentDocs = allDocs
				.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
				.slice(0, 10);

			await goto(`/docs/${savedDoc.id}`);
		} catch (error) {
			console.error('Failed to create document:', error);
		}
	}

	function handleFavorites() {
		// TODO: Implement favorites functionality
	}

	function handleExplorer() {
		goto('/explorer');
	}

	function handleCabinet() {
		goto('/cabinet');
	}

	async function openDocument(docId: string) {
		await goto(`/docs/${docId}`);
	}

	function handleDocumentClick(doc: Document, event: MouseEvent) {
		if (app.isSelectionMode) {
			event.preventDefault();
			const selectableItem = {
				id: doc.id,
				name: doc.title,
				icon: '/icons/new.png'
			};
			app.toggleDocumentSelection(selectableItem);
		} else {
			openDocument(doc.id);
		}
	}

	const selectedCount = $derived(selectedDocuments.getSelectedCount());
</script>

<svelte:head>
	<title>manuscriptOS Novel Writer</title>
	<meta name="description" content="Welcome to manuscriptOS Novel Writer - Your personal writing companion" />
</svelte:head>

<div class={styles['app-container']}>
	<!-- MenuBar -->
	<MenuBar logo="/icons/logo-small.png" hideLeftButton={true} largeLogo={true} />
	
	<!-- Main Content -->
	<main>
		<div class={styles['content-wrapper']}>
			<div class={styles['content-header']}>
				<h1 class={styles['recents-title']}>{greeting}</h1>
			</div>

			{#snippet documentContentSnippet(doc: Document)}
				<div class={styles['document-info']}>
					<h3 class={styles['document-title']}>{doc.title || 'Untitled Document'}</h3>
					<p class={styles['document-preview']}>
						{doc.content ? doc.content.slice(0, 100) : ''}
					</p>
				</div>
			{/snippet}

			<VList
				items={recentDocs}
				{hasLoaded}
				isSelectionMode={app.isSelectionMode}
				emptyMessage=""
				buttonText="Create new document"
				emptyButtonTopDrawerText="get started..."
				emptyButtonBottomDrawerText="...it\'s easy!"
				onEmptyButtonClick={handleNewDocument}
				onItemClick={handleDocumentClick}
				onToggleSelection={app.toggleDocumentSelection}
				onToggleSelectionMode={() => app.setSelectionMode(!app.isSelectionMode)}
				onDeleteClick={async () => {
					// VList handles deletion, but we need to force reload the app data
					await app.loadRootLevel();
					
					// Reload recent docs from ALL documents in system
					const allDocs = await app.loadAllDocuments();
					recentDocs = allDocs.slice(0, 10);
				}}
				getItemId={(doc) => doc.id}
				isItemSelected={(doc) => selectedDocuments.isSelected(doc.id)}
				renderItemContent={documentContentSnippet}
				enableDocumentDeletion={true}
			/>

			{#if hasLoaded}
				<div class={styles['create-new-section']}>
					<WolverineButton 
						text="Create new document"
						topDrawerText="start writing..."
						bottomDrawerText="...your story awaits"
						onclick={handleNewDocument} 
						width="250px" 
					/>
				</div>
			{/if}
		</div>
	</main>

	<!-- Dock -->
	<Dock
		items={[
			{
				id: 'home',
				icon: '/icons/logo-small.png',
				title: 'Home',
				onClick: () => goto('/')
			},
			{
				id: 'new-document',
				icon: '/icons/new.png',
				title: 'New Document',
				onClick: isBrowser ? handleNewDocument : () => {}
			},
			{
				id: 'favorites',
				icon: '/icons/heart.png',
				title: 'Favorites',
				onClick: handleFavorites
			},
			{
				id: 'explorer',
				icon: '/icons/folder.png',
				title: 'Explorer',
				onClick: handleExplorer
			}
		]}
	/>
</div>

