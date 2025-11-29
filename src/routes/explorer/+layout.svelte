<script lang="ts">
	import MenuBar from '$lib/components/MenuBar/MenuBar.svelte';
	
	interface LayoutProps {
		children: any;
		title?: string;
	}
	
	let { children, title = "manuscriptOS" }: LayoutProps = $props();
</script>

<svelte:head>
	<style>
		:global(body, html) {
			background-color: #1a1a1a;
			color: #ffffff;
			margin: 0;
			padding: 0;
			width: 100%;
			height: 100%;
			overflow: hidden;
		}
	</style>
</svelte:head>

<div class="page-container">
	<MenuBar title={title} hideLeftButton={true} />
	<div class="explorer-content">
		{@render children()}
	</div>
</div>

<style>
	.page-container {
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: rgb(16, 20, 23);
		color: #ffffff;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
	}

	.explorer-content {
		width: 100%;
		flex: 1;
		display: flex;
		flex-direction: column;
		background-color: rgb(16, 20, 23);
		color: #ffffff;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
		overflow: hidden;
		position: relative;
	}
</style>
