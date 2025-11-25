<script lang="ts">
	import styles from './RangeSlider.module.scss';

	interface Props {
		min?: number;
		max?: number;
		value?: number;
		oninput?: (event: Event) => void;
	}

	let { 
		min = 200, 
		max = 1024, 
		value = $bindable(600), 
		oninput 
	}: Props = $props();

	// Calculate percentage for track fill
	const percentage = $derived(((value - min) / (max - min)) * 100);
	const cssVarsString = $derived(`--value: ${percentage}%`);
</script>

<input 
	type="range" 
	{min} 
	{max} 
	{value} 
	{oninput}
	class={styles.rangeSlider}
	style={cssVarsString}
/>
