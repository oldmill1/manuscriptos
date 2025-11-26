<script lang="ts">
	import styles from './DTable.module.scss';
	import type { Snippet } from 'svelte';
	import { Document } from '$lib/models/Document';
	import { List } from '$lib/models/List';
	import SwitchMini from '$lib/components/SwitchMini/SwitchMini.svelte';

	interface Props {
		items: (Document | List)[];
		resourceType: 'documents' | 'lists';
		loading?: boolean;
		error?: string | null;
		empty?: boolean;
	}

	let { items, resourceType, loading = false, error = null, empty = false }: Props = $props();

	// Track selected items
	let selectedItems = $state(new Set<string>());

	function toggleItemSelection(itemId: string) {
		if (selectedItems.has(itemId)) {
			selectedItems.delete(itemId);
		} else {
			selectedItems.add(itemId);
		}
		// Trigger reactivity
		selectedItems = new Set(selectedItems);
	}

	function toggleSelectAll() {
		if (selectedItems.size === items.length) {
			selectedItems.clear();
		} else {
			selectedItems = new Set(items.map(item => item.id));
		}
	}

	function isAllSelected() {
		return items.length > 0 && selectedItems.size === items.length;
	}

	function isPartiallySelected() {
		return selectedItems.size > 0 && selectedItems.size < items.length;
	}

	function formatDate(date: Date): string {
		return date.toLocaleString();
	}

	function truncateContent(content: string, maxLength: number = 100): string {
		if (content.length <= maxLength) return content;
		return content.substring(0, maxLength) + '...';
	}

	function isDocument(item: Document | List): item is Document {
		return item instanceof Document;
	}

	function isList(item: Document | List): item is List {
		return item instanceof List;
	}
</script>

<div class={styles['table-container']}>
	{#if loading}
		<div class={styles.loading}>Loading {resourceType}...</div>
	{:else if error}
		<div class={styles.error}>{error}</div>
	{:else if empty}
		<div class={styles.empty}>No {resourceType} found</div>
	{:else}
		<table class={styles['data-table']}>
			<thead>
				<tr>
					<th class={styles['checkbox-cell']}>
						<SwitchMini 
							checked={isAllSelected()} 
							onchange={toggleSelectAll}
						/>
					</th>
					<th>ID</th>
					{#if resourceType === 'documents'}
						<th>Title</th>
						<th>Content Preview</th>
					{:else if resourceType === 'lists'}
						<th>Name</th>
						<th>Type</th>
						<th>Items Count</th>
					{/if}
					<th>Created At</th>
					<th>Updated At</th>
				</tr>
			</thead>
			<tbody>
				{#each items as item (item.id)}
					<tr class={selectedItems.has(item.id) ? styles['selected-row'] : ''}>
						<td class={styles['checkbox-cell']}>
							<SwitchMini 
								checked={selectedItems.has(item.id)}
								onchange={() => toggleItemSelection(item.id)}
							/>
						</td>
						<td class={styles['id-cell']}>{item.id}</td>
						{#if isDocument(item)}
							<td class={styles['title-cell']}>{item.title}</td>
							<td class={styles['content-cell']}>{truncateContent(item.content)}</td>
						{:else if isList(item)}
							<td class={styles['title-cell']}>{item.name}</td>
							<td class={styles['type-cell']}>{item.type}</td>
							<td class={styles['count-cell']}>{item.itemIds.length}</td>
						{/if}
						<td class={styles['date-cell']}>{formatDate(item.createdAt)}</td>
						<td class={styles['date-cell']}>{formatDate(item.updatedAt)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
