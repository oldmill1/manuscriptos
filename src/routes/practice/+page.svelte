<script lang="ts">
	import styles from './page.module.scss';
	import { Motion } from 'svelte-motion';
	import WolverineButton from '$lib/components/Buttons/WolverineButton/WolverineButton.svelte';
	import Switch from '$lib/components/Buttons/Switch/Switch.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import SwitchMini from '$lib/components/SwitchMini/SwitchMini.svelte';

	console.log('Motion component:', Motion);
	
	let showModal = false;
	let inputValue = '';
	let switchState = false;
	let switchMiniState = false;
	
	function openModal() {
		showModal = true;
	}
	
	function closeModal() {
		showModal = false;
	}
	
	function handleSwitchChange(checked: boolean) {
		switchState = checked;
		console.log('Switch changed to:', checked);
	}
	
	function handleSwitchMiniChange() {
		switchMiniState = !switchMiniState;
		console.log('SwitchMini changed to:', switchMiniState);
	}
	
	function handleSwitchMiniClick(e: MouseEvent) {
		console.log('SwitchMini clicked');
	}
</script>

<svelte:head>
	<title>Practice - Squire</title>
	<meta name="description" content="Design practice space" />
</svelte:head>

<div class={styles['practice-page']}>
    <div class={styles['input-section']}>
        <SwitchMini 
            label="Switch Mini" 
            onchange={handleSwitchMiniChange}
            onclick={handleSwitchMiniClick}
        />
    </div>
    
    <div class={styles['button-stack']}>
        <Motion 
            let:motion
            whileHover={{ 
                scale: 1.2
            }}
            transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 10
            }}
        >
            <button class={styles.practiceButton} use:motion>
                BUTTON
            </button>
        </Motion>
        <Motion 
            let:motion
            whileHover={{ 
                y: -4,
                background: "#ffe9e9",
                boxShadow: "0 0 0 2px #b18597, 0 0.5em 0 0 #ffe3e2"
            }}
            whileTap={{ 
                y: 12,
                background: "#ffe9e9",
                boxShadow: "0 0 0 2px #b18597, 0 0 #ffe3e2"
            }}
            transition={{ 
                type: "tween",
                duration: 0.15,
                ease: [0, 0, 0.58, 1]
            }}
            initial={{
                y: 0,
                background: "#fff0f0",
                boxShadow: "0 0 0 2px #b18597, 0 0.625em 0 0 #ffe3e2"
            }}
        >
            <button class={styles.catfish} use:motion>
                Catfish
            </button>
        </Motion>
        
        <WolverineButton onclick={() => console.log('WolverineButton clicked!')} />
        <Switch onchange={handleSwitchChange} />
        <button class={styles.practiceButton} on:click={openModal}>
            Open Modal
        </button>
    </div>
    
    <!-- Conditional modal -->
    {#if showModal}
        <Modal 
            isOpen={true} 
            dark={true}
            buttons={[
                { text: 'Cancel', callback: closeModal, primary: false },
                { text: 'Delete', callback: closeModal, primary: true }
            ]}
        >
            <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 600; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Confirm Deletion</h2>
        </Modal>
    {/if}
</div>
