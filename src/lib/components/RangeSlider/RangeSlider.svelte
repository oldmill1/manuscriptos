<script lang="ts">
	import styles from './RangeSlider.module.scss';

	interface Props {
		min?: number;
		max?: number;
		value?: number;
		oninput?: (event: Event) => void;
	}

	let { 
		min = 0, 
		max = 100, 
		value = 50, 
		oninput 
	}: Props = $props();
</script>

<input 
	type="range" 
	{min} 
	{max} 
	{value} 
	{oninput}
	class={styles.rangeSlider}
/>
