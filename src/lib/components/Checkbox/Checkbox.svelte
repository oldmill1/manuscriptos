<script lang="ts">
	import { Motion } from 'svelte-motion';
	import styles from './Checkbox.module.scss';
	
	export let checked = false;
	export let disabled = false;
	export let label = '';
	
	function handleChange() {
		if (!disabled) {
			checked = !checked;
		}
	}
</script>

<div class={styles.checkbox}>
	<label class={styles.checkboxLabel}>
		<input 
			type="checkbox" 
			{checked} 
			{disabled}
			onchange={handleChange}
			class={styles.checkboxInput}
		/>
		<!-- Animated checkbox custom styling -->
		<Motion 
			let:motion
			whileHover={{ scale: disabled ? 1 : 1.1 }}
			whileTap={{ scale: disabled ? 1 : 0.9 }}
			animate={{
				borderColor: checked ? '#007AFF' : '#ccc',
				backgroundColor: checked ? '#007AFF' : 'white'
			}}
			transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
		>
			<span class={styles.checkboxCustom} use:motion>
				<!-- Animated checkmark -->
				<Motion
					let:motion
					animate={{
						opacity: checked ? 1 : 0,
						scale: checked ? 1 : 0.5,
						rotate: checked ? 45 : 0
					}}
					transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
				>
					{#if checked}
						<span class={styles.checkmark} use:motion></span>
					{/if}
				</Motion>
			</span>
		</Motion>
		{#if label}
			<span class={styles.checkboxText}>{label}</span>
		{/if}
	</label>
</div>
