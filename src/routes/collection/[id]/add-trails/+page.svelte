<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { onMount } from 'svelte';

	let collection: any = null;
	let availableTrails: any[] = [];
	let selectedTrailIds: string[] = [];
	let isLoading = true;
	let errorMessage = '';
	let collectionId = '';

	onMount(async () => {
		const pathParts = window.location.pathname.split('/');
		collectionId = pathParts[pathParts.length - 2];
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
			const collectionResponse = await fetch(
				`http://localhost:3000/api/collections/getById/${collectionId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (!collectionResponse.ok) {
				errorMessage = 'Failed to load collection';
				return;
			}

			collection = await collectionResponse.json();

			const trailsResponse = await fetch(
				`http://localhost:3000/api/trails/getByUserId/${userId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (trailsResponse.ok) {
				const userTrails = await trailsResponse.json();
				const existingIds = new Set(collection.walkingTrailIds || []);
				availableTrails = userTrails.filter((t: any) => !existingIds.has(t._id));
			}
		} catch (error) {
			errorMessage = 'An error occurred while loading data';
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	}

	function toggleTrail(trailId: string) {
		if (selectedTrailIds.includes(trailId)) {
			selectedTrailIds = selectedTrailIds.filter((id) => id !== trailId);
		} else {
			selectedTrailIds = [...selectedTrailIds, trailId];
		}
	}

	async function addSelectedTrails() {
		if (selectedTrailIds.length === 0) {
			errorMessage = 'Please select at least one trail';
			return;
		}

		const token = localStorage.getItem('token');
		errorMessage = '';

		try {
			for (const trailId of selectedTrailIds) {
				const response = await fetch(
					`http://localhost:3000/api/collections/addTrail/${collectionId}/${trailId}`,
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${token}`
						}
					}
				);

				if (!response.ok) {
					errorMessage = 'Failed to add some trails';
					return;
				}
			}

			window.location.href = `/collection/${collectionId}`;
		} catch (error) {
			errorMessage = 'An error occurred while adding trails';
			console.error('Error adding trails:', error);
		}
	}
</script>

<div style="min-height: 100vh; display: flex; flex-direction: column;">
	<NavBar />

	<section class="section" style="flex: 1;">
		<div class="container">
			<div class="columns is-centered">
				<div class="column is-10-desktop is-8-widescreen">
					<div class="box">
						{#if isLoading}
							<div class="has-text-centered">
								<p>Loading...</p>
							</div>
						{:else if collection}
							<h1 class="title is-3">Add Trails to {collection.name}</h1>

							{#if errorMessage}
								<div class="notification is-danger is-light">
									<button class="delete" onclick={() => (errorMessage = '')}></button>
									{errorMessage}
								</div>
							{/if}

							{#if availableTrails.length > 0}
								<div class="content">
									<p>Select the trails you want to add to this collection.</p>
								</div>

								<div class="box" style="max-height: 420px; overflow: auto;">
									{#each availableTrails as trail}
										<label class="checkbox is-block mb-2">
											<input
												type="checkbox"
												checked={selectedTrailIds.includes(trail._id)}
												onchange={() => toggleTrail(trail._id)}
											/>
											<span class="ml-2 has-text-weight-semibold">{trail.name}</span>
											<span class="ml-2 has-text-grey"
												>({trail.lengthInKm} km, {trail.difficulty})</span
											>
										</label>
									{/each}
								</div>

								<div class="field is-grouped is-grouped-right">
									<p class="control">
										<a class="button" href="/collection/{collection._id}">Cancel</a>
									</p>
									<p class="control">
										<button class="button is-primary" onclick={addSelectedTrails}>
											<span class="icon"><i class="fas fa-plus"></i></span>
											<span>Add Selected</span>
										</button>
									</p>
								</div>
							{:else}
								<p class="has-text-grey">All your trails are already in this collection.</p>
								<div class="field is-grouped is-grouped-right">
									<p class="control">
										<a class="button" href="/collection/{collection._id}">Back to Collection</a>
									</p>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<Footer />
</div>
