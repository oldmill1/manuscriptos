<script lang="ts">
	import { Motion } from 'svelte-motion';
	import styles from './Modal.module.scss';

	export let text: string = '';
	export let onClick: () => void = () => {};
	export let primary: boolean = false;
	export let isHovered: boolean = false;

	// SVG compatibility wrapper
	function applyMotion(node: any, motionAction: any) {
		return motionAction(node);
	}
</script>

<!-- Main button container with neumorphic effect -->
<Motion 
	let:motion
	whileHover={{ 
		scale: 1.05,
		boxShadow: "-2px -8px 10px #ffffff, -2px -5px 6px #ffffff, -5px 0px 10px #ffffff, 3px 8px 8px rgba(0, 0, 0, 0.15)"
	}}
	whileTap={{ 
		scale: 0.95,
		boxShadow: "none"
	}}
	transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
>
	<button 
		class={`${styles['neumorphic-button']} ${primary ? styles['primary'] : ''}`}
		use:motion
		on:click={onClick}
		on:mouseenter={() => isHovered = true}
		on:mouseleave={() => isHovered = false}
	>
		<!-- Inner content area with grid layout -->
		<div class={styles['neumorphic-content']}>
			<!-- Text area (centered) -->
			<Motion 
				let:motion
				animate={isHovered ? {
					y: -5
				} : {
					y: -2
				}}
				transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
			>
				<div class={styles['neumorphic-text']} use:motion>
					{text}
				</div>
			</Motion>
		</div>
	</button>
</Motion>
