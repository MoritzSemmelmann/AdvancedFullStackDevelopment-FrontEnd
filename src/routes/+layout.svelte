<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { loggedInUser } from '$lib/runes.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	onMount(() => {
		const originalFetch = window.fetch;

		window.fetch = async (input: string | URL | Request, init?: RequestInit) => {
			let url: string;
			if (typeof input === 'string') {
				url = input;
			} else if (input instanceof URL) {
				url = input.toString();
			} else {
				url = input.url;
			}

			if (url.includes('/api/')) {
				const baseHeaders = new Headers(
					init?.headers ?? (input instanceof Request ? input.headers : undefined)
				);
				const isFormData = init?.body instanceof FormData;

				if (!isFormData && !baseHeaders.has('Content-Type')) {
					baseHeaders.set('Content-Type', 'application/json');
				}

				if (loggedInUser.token && !baseHeaders.has('Authorization')) {
					baseHeaders.set('Authorization', `Bearer ${loggedInUser.token}`);
				}

				const response = await originalFetch(input, {
					...init,
					headers: baseHeaders,
				});

				if (response.status === 401 || response.status === 403) {
					loggedInUser.token = '';
					loggedInUser._id = '';
					loggedInUser.name = '';
					loggedInUser.email = '';
					loggedInUser.username = '';
					
					localStorage.removeItem('user');
					window.location.href = '/';
				}

				return response;
			}

			return originalFetch(input, init);
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
