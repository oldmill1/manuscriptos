<script lang="ts">
	import styles from './ActionRow.module.scss';
	
	let {
		children
	}: {
		children: any;
	} = $props();
</script>

<div class={styles['action-row']}>
	<div class={styles.columns}>
		<div class={styles.column}>
			{@render children()}
		</div>
	</div>
</div>
