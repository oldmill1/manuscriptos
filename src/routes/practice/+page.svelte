<script lang="ts">
	import styles from './page.module.scss';
	import { Motion } from 'svelte-motion';
	import WolverineButton from '$lib/components/Buttons/WolverineButton/WolverineButton.svelte';
	import Switch from '$lib/components/Buttons/Switch/Switch.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	
	console.log('Motion component:', Motion);
</script>

<svelte:head>
	<title>Practice - Squire</title>
	<meta name="description" content="Design practice space" />
</svelte:head>

<div class={styles['practice-page']}>
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
        
        <WolverineButton />
        <Switch />
    </div>
    
    <!-- Always visible modal for practice -->
    <Modal 
        isOpen={true} 
        dark={true}
        buttons={[
            { text: 'Cancel', callback: () => {}, primary: false },
            { text: 'Confirm', callback: () => {}, primary: true }
        ]}
    >
        {#snippet content()}
            <h2 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 600; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Confirm Deletion</h2>
        {/snippet}
    </Modal>
</div>
