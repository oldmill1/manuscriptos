<script lang="ts">
	import styles from './MenuBar.module.scss';

	const menuItems = ['New'];

	function handleNewClick() {
		console.log('New clicked');
	}
</script>

<div class={styles.menubar}>
	{#each menuItems as item}
		<button 
			type="button"
			class={styles.menuItem}
			onclick={handleNewClick}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleNewClick();
				}
			}}
		>
			{item}
		</button>
	{/each}
</div>
