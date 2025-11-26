<script lang="ts">
	import styles from './ExplorerNav.module.scss';
	import type { Snippet } from 'svelte';

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
	}

	let { content = [] }: Props = $props();
</script>

<nav class={styles.explorerNav}>
	{#each content as item}
		<button
			class="{styles.navButton} {item.active ? styles.active : ''} {item.disabled ? styles.disabled : ''}"
			onclick={item.onClick}
			disabled={item.disabled}
		>
			{#if item.icon}
				<span class={styles.icon}>{item.icon}</span>
			{/if}
			<span class={styles.label}>{item.label}</span>
		</button>
	{/each}
</nav>
