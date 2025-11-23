<script lang="ts">
	let { children } = $props();
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
		}
	</style>
</svelte:head>

{@render children()}
