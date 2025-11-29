<script lang="ts">
	import styles from './XProfile.module.scss';

	interface Props {
		characterId: string;
	}

	let { characterId }: Props = $props();
</script>

<div class={styles.container}>
	<div class={styles.profileCard}>
		<h1 class={styles.title}>Character View</h1>
		<p class={styles.characterId}>Character ID: {characterId}</p>
		<p class={styles.message}>Hello World</p>
	</div>
</div>
