<script lang="ts">
	import styles from './XProfile.module.scss';
	import { XHeader } from './XHeader';

	interface Props {
		characterId: string;
		name?: string;
	}

	let { characterId, name = 'Character Name' }: Props = $props();

	function handleNameChange(newName: string) {
		name = newName;
		// TODO: Save to database
		console.log('Name changed to:', newName);
	}
</script>

<div class={styles.container}>
	<div class={styles.profileCard}>
		<XHeader 
			name={name}
			onNameChange={handleNameChange}
		/>
	</div>
</div>
