<script lang="ts">
	import styles from './Modal.module.scss';

	export let content: any = null;
	export let isOpen: boolean = false;
	export let dark: boolean = false;
	export let buttons: Array<{ text: string; callback: () => void; primary?: boolean }> = [];

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

	function handleButtonClick(callback: () => void) {
		callback();
	}
</script>

{#if isOpen}
	<div
		class={`${styles['modal-backdrop']} ${dark ? styles['dark'] : ''}`}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		on:click={handleBackdropClick}
		on:keydown={handleBackdropKeydown}
		tabindex="-1"
	>
		<div
			class={`${styles['modal-content']} ${dark ? styles['dark'] : ''}`}
			role="document"
			on:click={handleModalClick}
			on:keydown={handleModalKeydown}
			tabindex="0"
		>
			{@render content?.()}
			
			{#if buttons.length > 0}
				<div class={styles['modal-buttons']}>
					{#each buttons as button}
						<button 
							class={`${styles['modal-button']} ${button.primary ? styles['primary'] : ''} ${dark ? styles['dark'] : ''}`}
							on:click={() => handleButtonClick(button.callback)}
						>
							{button.text}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
