<script lang="ts">
	import { Motion } from 'svelte-motion';
	import styles from './AquaButton.module.scss';

	interface Props {
		text: string;
		onClick: () => void;
		primary?: boolean;
		dark?: boolean;
		slate?: boolean;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
		size?: 'small' | 'medium' | 'large';
		variant?: 'solid' | 'outline' | 'ghost';
		customClass?: string;
		fullWidth?: boolean;
	}

	let {
		text = '',
		onClick = () => {},
		primary = false,
		dark = false,
		slate = false,
		disabled = false,
		type = 'button',
		size = 'medium',
		variant = 'solid',
		customClass = '',
		fullWidth = false
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
		class={`
			${styles['aqua-button']} 
			${primary ? styles['primary'] : ''} 
			${dark ? styles['dark'] : ''} 
			${slate ? styles['slate'] : ''} 
			${variant ? styles[variant] : ''} 
			${size ? styles[size] : ''} 
			${fullWidth ? styles['full-width'] : ''} 
			${customClass}
			${disabled ? styles['disabled'] : ''}
		`.trim()}
		use:motion
		{type}
		{disabled}
		onclick={handleClick}
	>
		{text}
	</button>
</Motion>
