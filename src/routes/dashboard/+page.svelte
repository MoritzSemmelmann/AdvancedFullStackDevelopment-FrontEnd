<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { onMount } from 'svelte';
	import { loggedInUser, currentTrails, currentCollections, refreshTrails, refreshCollections, dashboardState, saveUser } from '$lib/runes.svelte';

	let trails: any[] = [];
	let collections: any[] = [];
	let isLoading = false;
	let errorMessage = '';

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');
		const name = urlParams.get('name');
		const email = urlParams.get('email');
		const id = urlParams.get('id');

		if (token && name && email && id) {
			loggedInUser.token = token;
			loggedInUser._id = id;
			loggedInUser.name = name;
			loggedInUser.email = email;
			loggedInUser.username = email.split('@')[0];
			saveUser();

			window.history.replaceState({}, document.title, '/dashboard');
		}

		await loadData();
	});

	async function loadData() {
		const token = loggedInUser.token;
		const userId = loggedInUser._id;

		if (!token || !userId) {
			window.location.href = '/login';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			if (!currentTrails.trails.length) {
				await refreshTrails(userId);
			}
			if (!currentCollections.collections.length) {
				await refreshCollections(userId);
			}

			trails = currentTrails.trails;
			collections = currentCollections.collections;
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
						{#if dashboardState.activeTab === 'trails'}
							<span class="title is-3 has-text-primary">Your Trails</span>
							<span class="mx-2">|</span>
							<button
								class="button is-text subtitle is-5 has-text-grey"
								style="text-decoration: none;"
								onclick={() => (dashboardState.activeTab = 'collections')}
							>
								Your Collections
							</button>
							{:else}
								<button
									class="button is-text subtitle is-5 has-text-grey"
									style="text-decoration: none;"
									onclick={() => (dashboardState.activeTab = 'trails')}
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
				{#if dashboardState.activeTab === 'trails'}
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
			{:else if dashboardState.activeTab === 'trails'}
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

