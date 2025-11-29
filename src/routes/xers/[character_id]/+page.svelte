<script lang="ts">
	import type { PageProps } from './$types';
	import { XProfile } from '$lib/components/XProfile';

	let { data }: PageProps = $props();
</script>

<main>
	<XProfile characterId={data.id} />
</main>
