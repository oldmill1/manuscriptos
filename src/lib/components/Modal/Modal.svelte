<script lang="ts">
	import styles from './Modal.module.scss';
	import NeumorphicButton from './NeumorphicButton.svelte';

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
		role="button"
		tabindex="-1"
		on:click={handleBackdropClick}
		on:keydown={handleBackdropKeydown}
	>
		<div
			class={`${styles['modal-content']} ${dark ? styles['dark'] : ''}`}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
			tabindex="0"
			on:click={handleModalClick}
			on:keydown={handleModalKeydown}
		>
			{@render content?.()}
			
			{#if buttons.length > 0}
				<div class={styles['modal-buttons']}>
					{#each buttons as button}
						<NeumorphicButton 
							text={button.text}
							onClick={() => handleButtonClick(button.callback)}
							primary={button.primary || false}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
