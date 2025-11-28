<script lang="ts">
	import { Motion } from 'svelte-motion';
	import AquaButton from '../Buttons/AquaButton/AquaButton.svelte';
	import styles from './Modal.module.scss';

	let {
		children,
		isOpen = false,
		dark = false,
		buttons = []
	}: {
		children?: any;
		isOpen?: boolean;
		dark?: boolean;
		buttons?: Array<{ text: string; callback: () => void; primary?: boolean; disabled?: boolean }>;
	} = $props();

	// Use $state for reactive variables
	let animationStage = $state<'closed' | 'opening' | 'settling' | 'open'>('closed');

	// Use $effect instead of $:
	$effect(() => {
		if (isOpen && animationStage === 'closed') {
			animationStage = 'opening';
			// Move to settling stage (scale back to 100%)
			setTimeout(() => {
				animationStage = 'settling';
			}, 200);
			// Move to final open stage
			setTimeout(() => {
				animationStage = 'open';
			}, 400);
		} else if (!isOpen) {
			animationStage = 'closed';
		}
	});

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
				scale: 1.05,
				opacity: 1
			} : {
				scale: 1,
				opacity: 1
			}}
			transition={{
				duration: 0.25,
				ease: [0.25, 0.1, 0.25, 1]
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
				{@render children()}
				
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
