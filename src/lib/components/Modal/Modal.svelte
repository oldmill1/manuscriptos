<script lang="ts">
	import { Motion } from 'svelte-motion';
	import AquaButton from '../Buttons/AquaButton/AquaButton.svelte';
	import styles from './Modal.module.scss';

	export let content: any = null;
	export let isOpen: boolean = false;
	export let dark: boolean = false;
	export let buttons: Array<{ text: string; callback: () => void; primary?: boolean; disabled?: boolean }> = [];

	let animationStage: 'closed' | 'opening' | 'settling' | 'open' = 'closed';

	// Trigger animation when modal opens
	$: if (isOpen && animationStage === 'closed') {
		animationStage = 'opening';
		// Move to settling stage (scale back to 100%)
		setTimeout(() => {
			animationStage = 'settling';
		}, 300);
		// Move to final open stage
		setTimeout(() => {
			animationStage = 'open';
		}, 500);
	} else if (!isOpen) {
		animationStage = 'closed';
	}

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
		<Motion
			let:motion
			animate={animationStage === 'closed' ? {
				scale: 0,
				opacity: 0
			} : animationStage === 'opening' ? {
				scale: 1.2,
				opacity: 1
			} : {
				scale: 1,
				opacity: 1
			}}
			transition={{
				duration: 0.3,
				ease: [0, 0, 0, 2.5]
			}}
		>
			<div
				class={`${styles['modal-content']} ${dark ? styles['dark'] : ''}`}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="0"
				onclick={handleModalClick}
				onkeydown={handleModalKeydown}
				use:motion
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
		</Motion>
	</div>
{/if}
