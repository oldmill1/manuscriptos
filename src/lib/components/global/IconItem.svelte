<script lang="ts">
	import styles from './IconItem.module.scss';

	interface Props {
		name: string;
		icon?: string;
		onClick?: (event: MouseEvent) => void;
	}

	let { name, icon = '/icons/folder.png', onClick }: Props = $props();

	function handleClick(event: MouseEvent) {
		onClick?.(event);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			// Create a synthetic MouseEvent for keyboard interactions
			const syntheticEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window
			});
			handleClick(syntheticEvent);
		}
	}
</script>

<div
	class={styles.iconItem}
	role="button"
	tabindex="0"
	onclick={handleClick}
	onkeydown={handleKeydown}
>
	<img src={icon} alt={name} class={styles.icon} />
	<span class={styles.label}>{name}</span>
</div>
