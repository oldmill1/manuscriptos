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
</script>

<div class={styles.bio}>
	<div class={styles.traitsGrid}>
		{#each traits as trait, index}
			<div class={styles.trait}>
				<span class={styles.traitLabel}>{trait.label}</span>
				<span class={styles.traitValue}>
					{trait.value || 'Click to edit'}
				</span>
			</div>
		{/each}
	</div>
</div>
