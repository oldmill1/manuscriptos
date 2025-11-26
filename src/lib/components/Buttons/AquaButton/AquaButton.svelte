<script lang="ts">
	import { Motion } from 'svelte-motion';
	import styles from './AquaButton.module.scss';

	interface Props {
		text: string;
		onClick: () => void;
		primary: boolean;
		dark: boolean;
		disabled: boolean;
		type: 'button' | 'submit' | 'reset';
	}

	let {
		text = '',
		onClick = () => {},
		primary = false,
		dark = false,
		disabled = false,
		type = 'button'
	}: Props = $props();

	function handleClick() {
		if (!disabled) {
			onClick();
		}
	}
</script>

<Motion 
	let:motion
	whileHover={{ 
		scale: disabled ? 1 : 1.02,
		y: disabled ? 0 : -1
	}}
	whileTap={{ 
		scale: disabled ? 1 : 0.98,
		y: 0
	}}
	transition={{ 
		duration: 0.15, 
		ease: [0.4, 0, 0.2, 1] 
	}}
>
	<button 
		class={`${styles['aqua-button']} ${primary ? styles['primary'] : ''} ${dark ? styles['dark'] : ''} ${disabled ? styles['disabled'] : ''}`}
		use:motion
		{type}
		{disabled}
		onclick={handleClick}
	>
		{text}
	</button>
</Motion>
