<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { onMount } from 'svelte';

	let activeTab: 'trails' | 'collections' = 'trails';
	let trails: any[] = [];
	let collections: any[] = [];
	let isLoading = false;
	let errorMessage = '';

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		const token = localStorage.getItem('token');
		const userId = localStorage.getItem('userId');

		if (!token || !userId) {
			window.location.href = '/login';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const trailsResponse = await fetch(
				`http://localhost:3000/api/trails/getByUserId/${userId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			const collectionsResponse = await fetch(
				`http://localhost:3000/api/collections/getByUserId/${userId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (trailsResponse.ok) {
				trails = await trailsResponse.json();
			}

			if (collectionsResponse.ok) {
				collections = await collectionsResponse.json();
			}
		} catch (error) {
			errorMessage = 'Failed to load data';
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	}
</script>

<div style="min-height: 100vh; display: flex; flex-direction: column;">
	<NavBar />

	<section class="section" style="flex: 1;">
		<div class="container">
			<div class="level">
				<div class="level-left">
					<div class="level-item">
						<div>
							{#if activeTab === 'trails'}
								<span class="title is-3 has-text-primary">Your Trails</span>
								<span class="mx-2">|</span>
								<button
									class="button is-text subtitle is-5 has-text-grey"
									style="text-decoration: none;"
									onclick={() => (activeTab = 'collections')}
								>
									Your Collections
								</button>
							{:else}
								<button
									class="button is-text subtitle is-5 has-text-grey"
									style="text-decoration: none;"
									onclick={() => (activeTab = 'trails')}
								>
									Your Trails
								</button>
								<span class="mx-2">|</span>
								<span class="title is-3 has-text-primary">Your Collections</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="level-right">
					{#if activeTab === 'trails'}
						<a class="button is-primary" href="/trail/create">
							<span class="icon"><i class="fas fa-plus"></i></span>
							<span>Create Trail</span>
						</a>
					{:else}
						<a class="button is-primary" href="/collection/create">
							<span class="icon"><i class="fas fa-folder-plus"></i></span>
							<span>Create Collection</span>
						</a>
					{/if}
				</div>
			</div>

			{#if errorMessage}
				<div class="notification is-danger is-light">
					{errorMessage}
				</div>
			{/if}

			{#if isLoading}
				<div class="has-text-centered">
					<div class="is-loading"></div>
					<p>Loading...</p>
				</div>
			{:else if activeTab === 'trails'}
				<div class="box" style="max-height: 480px; overflow: auto;">
					{#if trails.length > 0}
						<table class="table is-fullwidth is-striped is-hoverable">
							<thead>
								<tr>
									<th>Name</th>
									<th>Length (km)</th>
									<th>Difficulty</th>
									<th>Coordinates</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each trails as trail}
									<tr>
										<td>{trail.name}</td>
										<td>{trail.lengthInKm}</td>
										<td>{trail.difficulty}</td>
										<td>{trail.latitude}, {trail.longitude}</td>
										<td class="has-text-right">
											<a class="button is-small" href="/trail/{trail._id}">Details</a>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<p class="has-text-grey">No trails yet. Create your first one.</p>
					{/if}
				</div>
			{:else}
				<div class="box" style="max-height: 480px; overflow: auto;">
					{#if collections.length > 0}
						<table class="table is-fullwidth is-striped is-hoverable">
							<thead>
								<tr>
									<th>Name</th>
									<th>Description</th>
									<th>Items</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each collections as collection}
									<tr>
										<td>{collection.name}</td>
										<td>{collection.description}</td>
										<td>{collection.walkingTrailIds?.length || 0}</td>
										<td class="has-text-right">
											<a class="button is-small" href="/collection/{collection._id}">Details</a>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<p class="has-text-grey">No collections yet. Create your first one.</p>
					{/if}
				</div>
			{/if}
		</div>
	</section>

	<Footer />
</div>

