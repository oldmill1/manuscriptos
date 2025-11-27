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
					y: -4,
					boxShadow: "inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.4), inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7), inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.7), 0 3rem 3rem rgba(0, 0, 0, 0.3), 0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)"
				} : {}}
				whileTap={!item.disabled ? { 
					y: 4,
					boxShadow: "inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.5), inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.8), inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.4), 0 3rem 3rem rgba(0, 0, 0, 0.3), 0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)"
				} : {}}
				transition={{ 
					duration: 0.2, 
					ease: [0.4, 0, 0.2, 1] 
				}}
			>
				<button
					class="{styles.navButton} {item.active ? styles.active : ''} {item.disabled ? styles.disabled : ''}"
					onclick={item.onClick}
					disabled={item.disabled}
					use:motion
				>
					<div class={styles.wrap}>
						<Motion 
							let:motion
							initial={false}
							whileHover={!item.disabled ? { 
								y: -6
							} : {}}
							whileTap={!item.disabled ? { 
								y: 2
							} : {}}
							transition={{ 
								duration: 0.2, 
								ease: [0.4, 0, 0.2, 1] 
							}}
						>
							<div use:motion>
								<p>
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
									{item.label}
								</p>
							</div>
						</Motion>
					</div>
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
					y: -4,
					boxShadow: "inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.4), inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7), inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.7), 0 3rem 3rem rgba(0, 0, 0, 0.3), 0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)"
				} : {}}
				whileTap={!item.disabled ? { 
					y: 4,
					boxShadow: "inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.5), inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.8), inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.4), 0 3rem 3rem rgba(0, 0, 0, 0.3), 0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)"
				} : {}}
				transition={{ 
					duration: 0.2, 
					ease: [0.4, 0, 0.2, 1] 
				}}
			>
				<button
					class="{styles.navButton} {item.active ? styles.active : ''} {item.disabled ? styles.disabled : ''}"
					onclick={item.onClick}
					disabled={item.disabled}
					use:motion
				>
					<div class={styles.wrap}>
						<Motion 
							let:motion
							initial={false}
							whileHover={!item.disabled ? { 
								y: -6
							} : {}}
							whileTap={!item.disabled ? { 
								y: 2
							} : {}}
							transition={{ 
								duration: 0.2, 
								ease: [0.4, 0, 0.2, 1] 
							}}
						>
							<div use:motion>
								<p>
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
									{item.label}
								</p>
							</div>
						</Motion>
					</div>
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
					y: -4,
					boxShadow: "inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.4), inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7), inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.7), 0 3rem 3rem rgba(0, 0, 0, 0.3), 0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)"
				} : {}}
				whileTap={!item.disabled ? { 
					y: 4,
					boxShadow: "inset 0 0.3rem 0.5rem rgba(255, 255, 255, 0.5), inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.8), inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.4), 0 3rem 3rem rgba(0, 0, 0, 0.3), 0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)"
				} : {}}
				transition={{ 
					duration: 0.2, 
					ease: [0.4, 0, 0.2, 1] 
				}}
			>
				<button
					class="{styles.navButton} {item.active ? styles.active : ''} {item.disabled ? styles.disabled : ''}"
					onclick={item.onClick}
					disabled={item.disabled}
					use:motion
				>
					<div class={styles.wrap}>
						<Motion 
							let:motion
							initial={false}
							whileHover={!item.disabled ? { 
								y: -6
							} : {}}
							whileTap={!item.disabled ? { 
								y: 2
							} : {}}
							transition={{ 
								duration: 0.2, 
								ease: [0.4, 0, 0.2, 1] 
							}}
						>
							<div use:motion>
								<p>
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
									{item.label}
								</p>
							</div>
						</Motion>
					</div>
				</button>
			</Motion>
		{/each}
	{/if}
</nav>
