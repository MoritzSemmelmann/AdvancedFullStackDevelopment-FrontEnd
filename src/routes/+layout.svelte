<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { loggedInUser } from '$lib/runes.svelte';

	let { children } = $props();

	// tokens are kept only in runes state; no persistence in storage
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
