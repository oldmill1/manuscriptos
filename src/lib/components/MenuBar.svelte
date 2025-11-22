<script lang="ts">
	import styles from './MenuBar.module.scss';
	import { createNewDocument } from '$lib/utils/documentUtils';

	const menuItems = ['New'];

	async function handleNewClick() {
		await createNewDocument();
	}
</script>

<div class={styles.menubar}>
	{#each menuItems as item}
		<button 
			type="button"
			class={styles.menuItem}
			onclick={handleNewClick}
			onkeydown={async (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					await handleNewClick();
				}
			}}
		>
			{item}
		</button>
	{/each}
</div>
