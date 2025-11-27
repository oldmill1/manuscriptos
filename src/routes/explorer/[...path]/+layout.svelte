<script lang="ts">
	interface LayoutProps {
		children: any;
	}
	
	let { children }: LayoutProps = $props();
	
	// No MenuBar here - it's handled by the parent layout
</script>

<div class="explorer-content">
	{@render children()}
</div>

<style>
	.explorer-content {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}
</style>
