<script lang="ts">
	import styles from './FolderButton.module.scss';
	import IconItem from '../global/IconItem.svelte';
	import { List } from '$lib/models/List';

	interface Props {
		list: List;
		onListClick: (list: List, event: MouseEvent) => void;
	}

	let { list, onListClick }: Props = $props();

	function handleClick(event: MouseEvent) {
		onListClick(list, event);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick(event as any);
		}
	}
</script>

<button
	type="button"
	class={styles.folderButton}
	onclick={handleClick}
	onkeydown={handleKeydown}
>
	<IconItem name={list.name || 'Untitled List'} icon="/icons/folder.png" />
</button>
