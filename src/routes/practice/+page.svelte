<script lang="ts">
	import styles from './page.module.scss';
	import { Motion } from 'svelte-motion';
	
	console.log('Motion component:', Motion);
</script>

<svelte:head>
	<title>Practice - Squire</title>
	<meta name="description" content="Design practice space" />
</svelte:head>

<div class={styles['practice-page']}>
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
</div>
