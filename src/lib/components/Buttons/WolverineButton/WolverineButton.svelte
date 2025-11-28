<script lang="ts">
	import { Motion, M } from 'svelte-motion';
	import styles from './WolverineButton.module.scss';
	
	let {
		text = 'Create your first document',
		onclick = () => {},
		width = '190px',
		topDrawerText = 'expires in...',
		bottomDrawerText = '...8 hours'
	}: {
		text?: string;
		onclick: () => void;
		width?: string;
		topDrawerText?: string;
		bottomDrawerText?: string;
	} = $props();
	
	let isHovered = $state(false);
	let isActive = $state(false);
	
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
		style="max-width: {width};"
		onmouseenter={() => isHovered = true}
		onmouseleave={() => isHovered = false}
		onmousedown={() => isActive = true}
		onmouseup={() => isActive = false}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				isActive = true;
				isHovered = true;
			}
		}}
		onkeyup={(e) => {
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
				{topDrawerText}
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
				{bottomDrawerText}
			</div>
		</Motion>

		<button class={styles.btn} {onclick}>
			<span class={styles['btn-text']}>{text}</span>
		</button>

		<!-- Corner SVGs -->
		<Motion 
			let:motion
			isSVG={true}
			initial={false}
			animate={isHovered ? {
				x: -80,
				y: -40,
				rotate: 180
			} : {
				x: -70,
				y: -30,
				rotate: 180
			}}
			whileTap={{ 
				x: -40,
				y: -20,
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
			initial={false}
			animate={isHovered ? {
				x: 80,
				y: -40,
				rotate: 270
			} : {
				x: 70,
				y: -30,
				rotate: 270
			}}
			whileTap={{ 
				x: 40,
				y: -20,
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
			initial={false}
			animate={isHovered ? {
				x: 80,
				y: 40,
				rotate: 0
			} : {
				x: 70,
				y: 30,
				rotate: 0
			}}
			whileTap={{ 
				x: 40,
				y: 20,
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
			initial={false}
			animate={isHovered ? {
				x: -80,
				y: 40,
				rotate: 90
			} : {
				x: -70,
				y: 30,
				rotate: 90
			}}
			whileTap={{ 
				x: -40,
				y: 20,
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
