<script lang="ts">
	import styles from './CreateFirstButton.module.scss';

	let {
		text = 'Create your first document',
		onclick = () => {}
	}: {
		text?: string;
		onclick: () => void;
	} = $props();
</script>

<button class={styles['create-first-btn']} {onclick}>
	{text}
</button>
