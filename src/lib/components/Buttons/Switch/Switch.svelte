<script lang="ts">
    import { Motion } from 'svelte-motion';
    
    let checked: boolean = false;
    let isHovered: boolean = false;
    
    function handleChange(event: Event) {
        const target = event.target as HTMLInputElement;
        checked = target.checked;
    }
</script>

<Motion 
    let:motion
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    transition={{ 
        duration: 0.2, 
        ease: [0.4, 0, 0.2, 1] 
    }}
>
    <label 
        class="switch" 
        use:motion
        onmouseenter={() => isHovered = true}
        onmouseleave={() => isHovered = false}
    >
        <input type="checkbox" {checked} onchange={handleChange}>
        
        <Motion 
            let:motion
            animate={checked ? {
                boxShadow: "rgba(0, 0, 0, 0.62) 0px 0px 5px inset, #22cc3f 0px 0px 0px 2px inset, #22cc3f 0px 0px 0px 24px inset, rgba(224, 224, 224, 0.45) 0px 1px 0px 0px"
            } : {
                boxShadow: "rgba(0, 0, 0, 0.62) 0px 0px 5px inset, rgba(0, 0, 0, 0.21) 0px 0px 0px 24px inset, #22cc3f 0px 0px 0px 0px inset, rgba(224, 224, 224, 0.45) 0px 1px 0px 0px"
            }}
            transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1] 
            }}
        >
            <span class="slider" use:motion>
                <Motion 
                    let:motion
                    animate={checked ? {
                        x: 22,
                        backgroundColor: "#22cc3f"
                    } : {
                        x: 0,
                        backgroundColor: "#e3e3e3"
                    }}
                    whileHover={{
                        backgroundColor: checked ? "#22cc3f" : "#f0f0f0"
                    }}
                    transition={{ 
                        duration: 0.3, 
                        ease: [0.4, 0, 0.2, 1] 
                    }}
                >
                    <span class="slider-thumb" use:motion></span>
                </Motion>
            </span>
        </Motion>
    </label>
</Motion>

<style>
    .switch {
        position: relative;
        display: inline-block;
        width: 51px;
        height: 29px;
        cursor: pointer;
        margin: 10px;
    }

    .switch input {
        display: none;
    }

    .slider {
        background-color: #ffffff2b;
        border-radius: 100px;
        padding: 1px;
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        box-shadow: rgba(0, 0, 0, 0.62) 0px 0px 5px inset, rgba(0, 0, 0, 0.21) 0px 0px 0px 24px inset,
                    #22cc3f 0px 0px 0px 0px inset, rgba(224, 224, 224, 0.45) 0px 1px 0px 0px;
    }

    .slider-thumb {
        display: flex;
        top: 2.3px;
        left: 2px;
        width: 26px;
        height: 26px;
        background-color: #e3e3e3;
        border-radius: 200px;
        position: absolute;
        box-shadow: transparent 0px 0px 0px 2px, rgba(0, 0, 0, 0.3) 0px 6px 6px;
    }
</style>
