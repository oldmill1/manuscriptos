<script lang="ts">
	import { Motion } from 'svelte-motion';
	import styles from './WolverineButton.module.scss';
	
	let isHovered = false;
	let isActive = false;
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
			animate={isHovered ? {
				x: -36,
				y: -36
			} : {
				x: -24,
				y: -24
			}}
			whileTap={{ 
				x: -12,
				y: -12
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
				use:motion
			>
				<path
					d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
				></path>
			</svg>
		</Motion>

		<Motion 
			let:motion
			animate={isHovered ? {
				x: 36,
				y: -36
			} : {
				x: 24,
				y: -24
			}}
			whileTap={{ 
				x: 12,
				y: -12
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
				use:motion
			>
				<path
					d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
				></path>
			</svg>
		</Motion>

		<Motion 
			let:motion
			animate={isHovered ? {
				x: 36,
				y: 36
			} : {
				x: 24,
				y: 24
			}}
			whileTap={{ 
				x: 12,
				y: 12
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
				use:motion
			>
				<path
					d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
				></path>
			</svg>
		</Motion>

		<Motion 
			let:motion
			animate={isHovered ? {
				x: -36,
				y: 36
			} : {
				x: -24,
				y: 24
			}}
			whileTap={{ 
				x: -12,
				y: 12
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
				use:motion
			>
				<path
					d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"
				></path>
			</svg>
		</Motion>
	</div>
</Motion>
