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
			<!-- Icon area (top right) -->
			<Motion 
				let:motion
				animate={isHovered ? {
					y: -8
				} : {
					y: -2
				}}
				transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
			>
				<div class={styles['neumorphic-icon']} use:motion>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
						{#if primary}
							<!-- Check icon for confirm -->
							<path d="M13.5 4.5L6 12L2.5 8.5" stroke="#aaaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						{:else}
							<!-- X icon for cancel -->
							<path d="M12 4L4 12M4 4L12 12" stroke="#aaaaaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						{/if}
					</svg>
				</div>
			</Motion>
			
			<!-- Text area (bottom) -->
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
