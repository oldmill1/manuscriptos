<script lang="ts">
	import type { Snippet } from 'svelte';
	import styles from './ContentLayout.module.scss';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class={styles.container}>
	<div class={styles.contentLayout}>
		{@render children?.()}
	</div>
</div>
