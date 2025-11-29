<script lang="ts">
	import styles from './ActionRow.module.scss';
	
	let {
		items = []
	}: {
		items?: any[];
	} = $props();
</script>

<div class={styles['action-row']}>
	{#each items as item}
		{@render item()}
	{/each}
</div>
