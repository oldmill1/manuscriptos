<script lang="ts">
	import styles from './BreadcrumbTrail.module.scss';
	import type { Snippet } from 'svelte';
	import { ListService } from '$lib/services/ListService';

	interface BreadcrumbItem {
		id: string;
		name: string;
		path: string;
	}

	interface Props {
		folderIds?: string[]; // Array of folder IDs from URL path
	}

	let { folderIds = [] }: Props = $props();

	let breadcrumbs = $state<BreadcrumbItem[]>([]);

	// Build breadcrumb trail from folder IDs
	$effect(() => {
		if (folderIds.length === 0) {
			// Root level - no breadcrumbs needed
			breadcrumbs = [];
			return;
		}

		const buildBreadcrumbs = async () => {
			try {
				const listService = new ListService();
				const trail: BreadcrumbItem[] = [];

				// Always start with manuscriptOS Novel Writer
				trail.push({
					id: 'root',
					name: 'manuscriptOS Novel Writer',
					path: '/explorer'
				});

				// Build path incrementally and fetch folder names
				let currentPath = '/explorer';
				for (let i = 0; i < folderIds.length; i++) {
					const folderId = folderIds[i];
					currentPath += `/${folderId}`;

					// Fetch folder details to get the name
					const folder = await listService.read(folderId);
					if (folder) {
						trail.push({
							id: folderId,
							name: folder.name || 'Untitled Folder',
							path: currentPath
						});
					}
				}

				breadcrumbs = trail;
			} catch (error) {
				console.error('Failed to build breadcrumb trail:', error);
				breadcrumbs = [];
			}
		};

		buildBreadcrumbs();
	});

	function handleBreadcrumbClick(item: BreadcrumbItem) {
		window.location.href = item.path;
	}
</script>

{#if breadcrumbs.length > 0}
	<div class={styles.breadcrumbContainer}>
		{#each breadcrumbs as item, index}
			{#if index > 0}
				<span class={styles.separator}>></span>
			{/if}
			
			{#if index === breadcrumbs.length - 1}
				<!-- Current folder - not clickable -->
				<span class={styles.current}>{item.name}</span>
			{:else}
				<!-- Parent folder - clickable -->
				<button 
					class={styles.breadcrumb}
					onclick={() => handleBreadcrumbClick(item)}
					type="button"
				>
					{item.name}
				</button>
			{/if}
		{/each}
	</div>
{/if}
