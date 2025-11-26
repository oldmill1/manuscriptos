<script lang="ts">
	import { Motion } from 'svelte-motion';
	import styles from './SwitchMini.module.scss';
	
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
	<label class={styles.switch}>
		<input 
			type="checkbox" 
			{checked} 
			{disabled}
			onchange={handleChange}
			class={styles.switchInput}
		/>
		<!-- Animated slider background -->
		<Motion 
			let:motion
			whileHover={{ scale: disabled ? 1 : 1.05 }}
			whileTap={{ scale: disabled ? 1 : 0.95 }}
			animate={{
				boxShadow: checked ? "0 0 1px #59d102" : "none"
			}}
			transition={{ duration: 0.4, ease: [0.215, 0.610, 0.355, 1] }}
		>
			<span class={styles.slider} use:motion>
				<!-- Green thumb (visible when checked) -->
				<Motion
					let:motion
					animate={{
						x: checked ? 0 : "150%"
					}}
					transition={{ duration: 0.4, ease: [0.215, 0.610, 0.355, 1] }}
				>
					<span class={styles.thumbGreen} use:motion></span>
				</Motion>
				<!-- Gray thumb (visible when unchecked) -->
				<Motion
					let:motion
					animate={{
						x: checked ? "-150%" : 0
					}}
					transition={{ duration: 0.4, ease: [0.215, 0.610, 0.355, 1] }}
				>
					<span class={styles.thumbGray} use:motion></span>
				</Motion>
			</span>
		</Motion>
		{#if label}
			<span class={styles.switchText}>{label}</span>
		{/if}
	</label>
</div>
