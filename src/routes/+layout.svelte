<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { browser } from '$app/environment';
	import { loggedInUser } from '$lib/auth.svelte';

	let { children } = $props();

	if (browser) {
		const savedToken = localStorage.getItem('token');
		const savedUserId = localStorage.getItem('userId');
		const savedUserName = localStorage.getItem('userName');

		if (savedToken && savedUserId) {
			loggedInUser.token = savedToken;
			loggedInUser._id = savedUserId;
			loggedInUser.name = savedUserName || '';
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
