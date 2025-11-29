<script lang="ts">
	import styles from './XBio.module.scss';

	export interface BioTrait {
		label: string;
		value: string;
	}

	interface Props {
		traits?: BioTrait[];
		onTraitChange?: (index: number, value: string) => void;
	}

	let { 
		traits = [
			{ label: 'Age', value: '25' },
			{ label: 'Occupation', value: 'Developer' },
			{ label: 'Location', value: 'San Francisco' },
			{ label: 'Status', value: 'Active' },
			{ label: 'Species', value: 'Human' },
			{ label: 'Background', value: 'Tech enthusiast' }
		],
		onTraitChange
	}: Props = $props();

	let editingIndex = $state<number | null>(null);
	let editingValue = $state('');

	function handleTraitClick(index: number) {
		editingIndex = index;
		editingValue = traits[index].value;
	}

	function handleTraitSubmit() {
		if (editingIndex !== null && editingValue.trim()) {
			onTraitChange?.(editingIndex, editingValue.trim());
		}
		editingIndex = null;
		editingValue = '';
	}

	function handleTraitKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleTraitSubmit();
		} else if (event.key === 'Escape') {
			editingIndex = null;
			editingValue = '';
		}
	}

	function handleTraitBlur() {
		handleTraitSubmit();
	}
</script>

<div class={styles.bio}>
	<div class={styles.traitsGrid}>
		{#each traits as trait, index}
			<div class={styles.trait}>
				<span class={styles.traitLabel}>{trait.label}</span>
				{#if editingIndex === index}
					<input
						bind:value={editingValue}
						class={styles.traitInput}
						onkeydown={handleTraitKeydown}
						onblur={handleTraitBlur}
						placeholder={`Enter ${trait.label.toLowerCase()}`}
					/>
				{:else}
					<span 
						class={styles.traitValue}
						role="button"
						tabindex="0"
						onclick={() => handleTraitClick(index)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleTraitClick(index);
							}
						}}
					>
						{trait.value || 'Click to edit'}
					</span>
				{/if}
			</div>
		{/each}
	</div>
</div>
