<script lang="ts">
	import styles from './ExplorerNav.module.scss';
	import type { Snippet } from 'svelte';
	import { Motion } from 'svelte-motion';

	interface NavItem {
		id: string;
		label: string;
		icon?: string;
		onClick?: () => void;
		disabled?: boolean;
		active?: boolean;
	}

	interface Props {
		content?: NavItem[];
		leftContent?: NavItem[];
		rightContent?: NavItem[];
	}

	let { content = [], leftContent = [], rightContent = [] }: Props = $props();

	function applyMotion(node: any, motionAction: any) {
		return motionAction(node);
	}
</script>

<nav class={styles.explorerNav}>
	<!-- Left content group -->
	<div class={styles.leftGroup}>
		{#each leftContent as item}
			<Motion 
				let:motion
				initial={false}
				whileHover={!item.disabled ? { 
					scale: 1.05,
					y: -2
				} : {}}
				whileTap={!item.disabled ? { 
					scale: 0.95,
					y: 0
				} : {}}
				transition={{ 
					duration: 0.3, 
					ease: [0.4, 0, 0.2, 1] 
				}}
			>
				<button
					class="{styles.navButton} {item.active ? styles.active : ''} {item.disabled ? styles.disabled : ''}"
					onclick={item.onClick}
					disabled={item.disabled}
					use:motion
				>
					{#if item.icon}
						<Motion 
							let:motion
							initial={false}
							whileHover={!item.disabled ? { 
								scale: 1.2,
								rotate: 5
							} : {}}
							transition={{ 
								duration: 0.3, 
								ease: [0.4, 0, 0.2, 1] 
							}}
						>
							<span class={styles.icon} use:motion>{item.icon}</span>
						</Motion>
					{/if}
					<span class={styles.label}>{item.label}</span>
				</button>
			</Motion>
		{/each}
	</div>
	
	<!-- Spacer to push right content to the end -->
	<div class={styles.spacer}></div>
	
	<!-- Right content group -->
	<div class={styles.rightGroup}>
		{#each rightContent as item}
			<Motion 
				let:motion
				initial={false}
				whileHover={!item.disabled ? { 
					scale: 1.05,
					y: -2
				} : {}}
				whileTap={!item.disabled ? { 
					scale: 0.95,
					y: 0
				} : {}}
				transition={{ 
					duration: 0.3, 
					ease: [0.4, 0, 0.2, 1] 
				}}
			>
				<button
					class="{styles.navButton} {item.active ? styles.active : ''} {item.disabled ? styles.disabled : ''}"
					onclick={item.onClick}
					disabled={item.disabled}
					use:motion
				>
					{#if item.icon}
						<Motion 
							let:motion
							initial={false}
							whileHover={!item.disabled ? { 
								scale: 1.2,
								rotate: 5
							} : {}}
							transition={{ 
								duration: 0.3, 
								ease: [0.4, 0, 0.2, 1] 
							}}
						>
							<span class={styles.icon} use:motion>{item.icon}</span>
						</Motion>
					{/if}
					<span class={styles.label}>{item.label}</span>
				</button>
			</Motion>
		{/each}
	</div>
	
	<!-- Fallback for legacy content prop -->
	{#if content.length > 0}
		{#each content as item}
			<Motion 
				let:motion
				initial={false}
				whileHover={!item.disabled ? { 
					scale: 1.05,
					y: -2
				} : {}}
				whileTap={!item.disabled ? { 
					scale: 0.95,
					y: 0
				} : {}}
				transition={{ 
					duration: 0.3, 
					ease: [0.4, 0, 0.2, 1] 
				}}
			>
				<button
					class="{styles.navButton} {item.active ? styles.active : ''} {item.disabled ? styles.disabled : ''}"
					onclick={item.onClick}
					disabled={item.disabled}
					use:motion
				>
					{#if item.icon}
						<Motion 
							let:motion
							initial={false}
							whileHover={!item.disabled ? { 
								scale: 1.2,
								rotate: 5
							} : {}}
							transition={{ 
								duration: 0.3, 
								ease: [0.4, 0, 0.2, 1] 
							}}
						>
							<span class={styles.icon} use:motion>{item.icon}</span>
						</Motion>
					{/if}
					<span class={styles.label}>{item.label}</span>
				</button>
			</Motion>
		{/each}
	{/if}
</nav>
