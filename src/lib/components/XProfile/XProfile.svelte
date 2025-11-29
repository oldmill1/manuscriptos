<script lang="ts">
	import styles from './XProfile.module.scss';
	import { XHeader } from './XHeader';
	import { XBio, type BioTrait } from './XBio';

	interface Props {
		characterId: string;
		name?: string;
		traits?: BioTrait[];
	}

	let { characterId, name = 'Character Name', traits }: Props = $props();

	function handleNameChange(newName: string) {
		name = newName;
		// TODO: Save to database
		console.log('Name changed to:', newName);
	}

	function handleTraitChange(index: number, value: string) {
		// TODO: Save to database
		console.log('Trait changed at index', index, 'to:', value);
	}
</script>

<div class={styles.container}>
	<div class={styles.profileCard}>
		<XHeader 
			name={name}
			onNameChange={handleNameChange}
		/>
		<XBio {traits} onTraitChange={handleTraitChange} />
	</div>
</div>
