<script lang="ts">
	import AquaButton from '../Buttons/AquaButton/AquaButton.svelte';
	import styles from './Modal.module.scss';

	export let content: any = null;
	export let isOpen: boolean = false;
	export let dark: boolean = false;
	export let buttons: Array<{ text: string; callback: () => void; primary?: boolean; disabled?: boolean }> = [];

	function handleBackdropClick() {
		isOpen = false;
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}

	function handleModalClick(event: MouseEvent) {
		event.stopPropagation();
	}

	function handleModalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}
</script>

{#if isOpen}
	<div
		class={`${styles['modal-backdrop']} ${dark ? styles['dark'] : ''}`}
		role="button"
		tabindex="-1"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
	>
		<div
			class={`${styles['modal-content']} ${dark ? styles['dark'] : ''}`}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="0"
			onclick={handleModalClick}
			onkeydown={handleModalKeydown}
		>
			{@render content?.()}
			
			{#if buttons.length > 0}
				<div class={styles['modal-buttons']}>
					{#each buttons as button}
						<AquaButton 
							text={button.text}
							onClick={button.callback}
							primary={button.primary || false}
							dark={dark}
							disabled={button.disabled || false}
							type="button"
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
