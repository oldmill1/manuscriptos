<script lang="ts">
	import styles from './XHeader.module.scss';
	import { XBio } from './XBio';

	interface Props {
		name?: string;
		onNameChange?: (newName: string) => void;
		traits?: import('./XBio').BioTrait[];
		onTraitChange?: (index: number, value: string) => void;
	}

	let { 
		name = 'Character Name', 
		onNameChange,
		traits,
		onTraitChange
	}: Props = $props();
	
	let isEditingName = $state(false);
	let editingName = $state(name);
	let inputElement = $state<HTMLInputElement>();

	function handleNameClick() {
		isEditingName = true;
		editingName = name;
	}

	function handleNameSubmit() {
		if (editingName.trim() && editingName !== name) {
			onNameChange?.(editingName.trim());
		}
		isEditingName = false;
	}

	function handleNameKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleNameSubmit();
		} else if (event.key === 'Escape') {
			isEditingName = false;
			editingName = name;
		}
	}

	function handleNameButtonClick(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleNameClick();
		}
	}

	function handleNameBlur() {
		handleNameSubmit();
	}

	$effect(() => {
		if (isEditingName && inputElement) {
			inputElement.focus();
			inputElement.select();
		}
	});
</script>

<header class={styles.header}>
	<div class={styles.profileInfo}>
		<div class={styles.profileContent}>
			<div class={styles.nameSection}>
				{#if isEditingName}
					<input
						bind:this={inputElement}
						bind:value={editingName}
						class={styles.nameInput}
						onkeydown={handleNameKeydown}
						onblur={handleNameBlur}
						placeholder="Enter character name"
					/>
				{:else}
					<div class={styles.nameWithBadge}>
						<span class={styles.profileName}>
							{name}
						</span>
						<div class={styles.verifiedBadge}>✓</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
	<XBio {traits} onTraitChange={onTraitChange} />
</header>
