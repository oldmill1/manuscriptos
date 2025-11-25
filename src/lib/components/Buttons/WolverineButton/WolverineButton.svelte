<script lang="ts">
	import { Motion, M } from 'svelte-motion';
	import styles from './WolverineButton.module.scss';
	
	let isHovered = false;
	let isActive = false;
	
	// Wrapper function to handle SVG type compatibility
	function applyMotion(node: any, motionAction: any) {
		return motionAction(node);
	}
</script>

<Motion 
	let:motion
	whileHover={{ 
		scale: 1.05
	}}
	whileTap={{ 
		scale: 0.95
	}}
	transition={{ 
		duration: 0.25,
		ease: [0, 0, 0, 2.5]
	}}
>
	<div 
		class={styles['btn-container']}
		use:motion
		role="button"
		tabindex="0"
		on:mouseenter={() => isHovered = true}
		on:mouseleave={() => isHovered = false}
		on:mousedown={() => isActive = true}
		on:mouseup={() => isActive = false}
		on:keydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				isActive = true;
				isHovered = true;
			}
		}}
		on:keyup={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				isActive = false;
				isHovered = false;
			}
		}}
	>
		<!-- Top Drawer -->
		<Motion 
			let:motion
			animate={isHovered ? {
				y: -24,
				rotate: 4,
				opacity: 1
			} : {
				y: 0,
				opacity: 0
			}}
			whileTap={{ 
				y: 0,
				scale: 0.5,
				opacity: 1
			}}
			transition={{ 
				duration: 0.125,
				ease: [0, 0, 0, 2.5]
			}}
		>
			<div class={`${styles['btn-drawer']} ${styles['transition-top']}`} use:motion>
				expires in...
			</div>
		</Motion>

		<!-- Bottom Drawer -->
		<Motion 
			let:motion
			animate={isHovered ? {
				y: 24,
				rotate: 4,
				opacity: 1
			} : {
				y: 0,
				opacity: 0
			}}
			whileTap={{ 
				y: 0,
				scale: 0.5,
				opacity: 1
			}}
			transition={{ 
				duration: 0.125,
				ease: [0, 0, 0, 2.5]
			}}
		>
			<div class={`${styles['btn-drawer']} ${styles['transition-bottom']}`} use:motion>
				...8 hours
			</div>
		</Motion>

		<button class={styles.btn}>
			<span class={styles['btn-text']}>Get Offer</span>
		</button>

		<!-- Corner SVGs -->
		<Motion 
			let:motion
			isSVG={true}
			animate={isHovered ? {
				x: -36,
				y: -36,
				rotate: 180
			} : {
				x: -24,
				y: -24,
				rotate: 180
			}}
			whileTap={{ 
				x: -12,
				y: -12,
				rotate: 180
			}}
			transition={{ 
				duration: 0.25,
				ease: [0, 0, 0, 2.5]
			}}
		>
			<svg
				class={styles['btn-corner']}
				xmlns="http://www.w3.org/2000/svg"
				viewBox="-1 1 32 32"
				use:applyMotion={motion}
			>
				<path
					d="M0,32C17.645,32,32,17.645,32,0h-0.985c0,17.102-13.913,31.015-31.015,31.015v0.985Z"
				></path>
			</svg>
		</Motion>

		<Motion 
			let:motion
			isSVG={true}
			animate={isHovered ? {
				x: 36,
				y: -36,
				rotate: 270
			} : {
				x: 24,
				y: -24,
				rotate: 270
			}}
			whileTap={{ 
				x: 12,
				y: -12,
				rotate: 270
			}}
			transition={{ 
				duration: 0.25,
				ease: [0, 0, 0, 2.5]
			}}
		>
			<svg
				class={styles['btn-corner']}
				xmlns="http://www.w3.org/2000/svg"
				viewBox="-1 1 32 32"
				use:applyMotion={motion}
			>
				<path
					d="M0,32C17.645,32,32,17.645,32,0h-0.985c0,17.102-13.913,31.015-31.015,31.015v0.985Z"
				></path>
			</svg>
		</Motion>

		<Motion 
			let:motion
			isSVG={true}
			animate={isHovered ? {
				x: 36,
				y: 36,
				rotate: 0
			} : {
				x: 24,
				y: 24,
				rotate: 0
			}}
			whileTap={{ 
				x: 12,
				y: 12,
				rotate: 0
			}}
			transition={{ 
				duration: 0.25,
				ease: [0, 0, 0, 2.5]
			}}
		>
			<svg
				class={styles['btn-corner']}
				xmlns="http://www.w3.org/2000/svg"
				viewBox="-1 1 32 32"
				use:applyMotion={motion}
			>
				<path
					d="M0,32C17.645,32,32,17.645,32,0h-0.985c0,17.102-13.913,31.015-31.015,31.015v0.985Z"
				></path>
			</svg>
		</Motion>

		<Motion 
			let:motion
			isSVG={true}
			animate={isHovered ? {
				x: -36,
				y: 36,
				rotate: 90
			} : {
				x: -24,
				y: 24,
				rotate: 90
			}}
			whileTap={{ 
				x: -12,
				y: 12,
				rotate: 90
			}}
			transition={{ 
				duration: 0.25,
				ease: [0, 0, 0, 2.5]
			}}
		>
			<svg
				class={styles['btn-corner']}
				xmlns="http://www.w3.org/2000/svg"
				viewBox="-1 1 32 32"
				use:applyMotion={motion}
			>
				<path
					d="M0,32C17.645,32,32,17.645,32,0h-0.985c0,17.102-13.913,31.015-31.015,31.015v0.985Z"
				></path>
			</svg>
		</Motion>
	</div>
</Motion>
