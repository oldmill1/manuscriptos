<script lang="ts">
	import { goto } from '$app/navigation';
	import WolverineButton from '$lib/components/Buttons/WolverineButton/WolverineButton.svelte';
	import Dock from '$lib/components/Dock/Dock.svelte';
	import VList from '$lib/components/VList/VList.svelte';
	import { Document } from '$lib/models/Document';
	import { DatabaseService } from '$lib/services/DatabaseService';
	import { savedNotification } from '$lib/stores/savedNotificationStore';
	import { selectedDocuments } from '$lib/stores/selectedDocuments';
	import { onMount } from 'svelte';
	import styles from './+page.module.scss';

	let dbService: DatabaseService;
	let isBrowser = false;
	let recentDocs: Document[] = [];
	let selectedCategory = 'Recents';
	let hasLoaded = false;
	let isSelectionMode = false;
	let greeting = '';

	onMount(async () => {
		isBrowser = true;
		
		// Set time-based greeting
		greeting = getTimeBasedGreeting();

		try {
			const { DatabaseService } = await import('$lib/services/DatabaseService');
			dbService = new DatabaseService('squiredb');

			// Load recent documents
			await loadRecentDocs();
		} catch (error) {
			console.error('Failed to initialize database:', error);
		}
	});

	function getTimeBasedGreeting(): string {
		const hour = new Date().getHours();
		
		if (hour >= 5 && hour < 12) {
			return 'Good Morning';
		} else if (hour >= 12 && hour < 17) {
			return 'Good Afternoon';
		} else if (hour >= 17 && hour < 21) {
			return 'Good Evening';
		} else {
			return 'Good Night';
		}
	}

	async function loadRecentDocs() {
		try {
			if (!dbService) return;

			const docs = await dbService.list();

			// Sort by updatedAt to get the latest documents and take 6
			recentDocs = docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);
		} catch (error) {
			console.error('Failed to load recent documents:', error);
		} finally {
			hasLoaded = true;
		}
	}

	async function handleNewDocument() {
		try {
			if (!isBrowser || !dbService) {
				throw new Error('Database not initialized');
			}

			const newDoc = new Document();
			const savedDoc = await dbService.create(newDoc);

			// Show saved notification
			savedNotification.show();

			// Refresh recent docs before navigating
			await loadRecentDocs();

			await goto(`/docs/${savedDoc.id}`);
		} catch (error) {
			console.error('Failed to create new document:', error);
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

	function toggleDocumentSelection(doc: Document) {
		selectedDocuments.toggleDocument(doc);
	}

	function toggleSelectionMode() {
		isSelectionMode = !isSelectionMode;
		if (!isSelectionMode) {
			selectedDocuments.clearSelection();
		}
	}

	function handleDocumentClick(doc: Document, event: MouseEvent) {
		if (isSelectionMode) {
			event.preventDefault();
			toggleDocumentSelection(doc);
		} else {
			openDocument(doc.id);
		}
	}

	$: selectedCount = selectedDocuments.getSelectedCount();
</script>

<svelte:head>
	<title>Squire</title>
	<meta name="description" content="Welcome to Squire - Your personal writing companion" />
</svelte:head>

<div class={styles['app-container']}>
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
				{isSelectionMode}
				emptyMessage=""
				buttonText="Create new document"
				emptyButtonTopDrawerText="get started..."
				emptyButtonBottomDrawerText="...it's easy!"
				onEmptyButtonClick={handleNewDocument}
				onItemClick={handleDocumentClick}
				onToggleSelection={toggleDocumentSelection}
				onToggleSelectionMode={toggleSelectionMode}
				onDeleteClick={loadRecentDocs}
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
				id: 'new-document',
				icon: '/icons/new.png',
				title: 'New Document',
				onClick: handleNewDocument
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

