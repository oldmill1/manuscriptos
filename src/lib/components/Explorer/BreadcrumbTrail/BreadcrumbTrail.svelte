<script lang="ts">
	import { ListService } from '$lib/services/ListService';
	import { Motion } from 'svelte-motion';
	import styles from './BreadcrumbTrail.module.scss';

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
					name: 'manuscriptOS',
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
				<span class={styles.separator}>
					<svg fill="currentColor" viewBox="0 0 24 24" class={styles.icon}>
						<path
							clip-rule="evenodd"
							d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
							fill-rule="evenodd"
						></path>
					</svg>
				</span>
			{/if}
			
			{#if index === breadcrumbs.length - 1}
				<!-- Current folder - not clickable -->
				<span class={styles.current}>{item.name}</span>
			{:else}
				<!-- Parent folder - clickable -->
				<Motion 
					let:motion
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
				>
					<button 
						class={styles.breadcrumb}
						onclick={() => handleBreadcrumbClick(item)}
						type="button"
						use:motion
					>
						{item.name}
					</button>
				</Motion>
			{/if}
		{/each}
	</div>
{/if}
