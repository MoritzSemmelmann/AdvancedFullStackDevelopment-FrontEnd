<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { onMount } from 'svelte';
	import { loggedInUser, refreshCollections } from '$lib/runes.svelte';

	let collection: any = null;
	let walkingTrails: any[] = [];
	let isLoading = true;
	let errorMessage = '';
	let collectionId = '';

	onMount(async () => {
		const pathParts = window.location.pathname.split('/');
		collectionId = pathParts[pathParts.length - 1];
		await loadCollection();
	});

	async function loadCollection() {
		const token = loggedInUser.token;

		if (!token) {
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

			if (collectionResponse.ok) {
				collection = await collectionResponse.json();
				const trailsResponse = await fetch(
					`http://localhost:3000/api/collections/getAllTrails/${collectionId}`,
					{
						headers: {
							Authorization: `Bearer ${token}`
						}
					}
				);

				if (trailsResponse.ok) {
					walkingTrails = await trailsResponse.json();
				}
			} else {
				errorMessage = 'Failed to load collection details';
			}
		} catch (error) {
			errorMessage = 'An error occurred while loading collection details';
			console.error('Error loading collection:', error);
		} finally {
			isLoading = false;
		}
	}

	async function removeTrailFromCollection(trailId: string) {
		if (!confirm('Remove this trail from the collection?')) {
			return;
		}

		const token = loggedInUser.token;

		try {
			const response = await fetch(
				`http://localhost:3000/api/collections/removeTrail/${collectionId}/${trailId}`,
				{
					method: 'DELETE',
					headers: {
						Authorization: `Bearer ${token}`
					}
				}
			);

			if (response.ok) {
				await loadCollection();
			} else {
				errorMessage = 'Failed to remove trail from collection';
			}
		} catch (error) {
			errorMessage = 'An error occurred while removing the trail';
			console.error('Error removing trail:', error);
		}
	}

	async function deleteCollection() {
		if (!confirm('Delete this collection permanently?')) {
			return;
		}

		const token = loggedInUser.token;

		try {
			const response = await fetch(`http://localhost:3000/api/collections/delete/${collectionId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (response.ok) {
				await refreshCollections(loggedInUser._id);
				window.location.href = '/dashboard';
			} else {
				errorMessage = 'Failed to delete collection';
			}
		} catch (error) {
			errorMessage = 'An error occurred while deleting the collection';
			console.error('Error deleting collection:', error);
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
						<div class="is-clearfix">
							<a href="/dashboard" class="button is-small is-light is-pulled-left">
								<span class="icon"><i class="fas fa-arrow-left"></i></span>
								<span>Back to Dashboard</span>
							</a>
						</div>
						{#if errorMessage}
							<div class="notification is-danger is-light">
								<button class="delete" onclick={() => (errorMessage = '')}></button>
								{errorMessage}
							</div>
						{/if}

						{#if isLoading}
							<div class="has-text-centered">
								<p>Loading...</p>
							</div>
						{:else if collection}
							<h1 class="title is-3">{collection.name}</h1>
							<p class="subtitle is-6 has-text-grey">
								Items: {collection.walkingTrailIds?.length || 0}
							</p>

							<div class="content">
								<p>{collection.description}</p>
							</div>

							<div class="box" style="max-height: 400px; overflow: auto;">
								{#if walkingTrails && walkingTrails.length > 0}
									<h2 class="title is-5">Trails in this collection</h2>
									<table class="table is-fullwidth is-striped is-hoverable">
										<thead>
											<tr>
												<th>Name</th>
												<th>Length (km)</th>
												<th>Difficulty</th>
												<th>Elevation (m)</th>
												<th>Duration (min)</th>
												<th>Coordinates</th>
												<th class="has-text-right">Actions</th>
											</tr>
										</thead>
										<tbody>
											{#each walkingTrails as trail}
												<tr>
													<td>{trail.name}</td>
													<td>{trail.lengthInKm}</td>
													<td>{trail.difficulty}</td>
													<td>{trail.elevationGainInM ?? '—'}</td>
													<td>{trail.estimatedDurationInMin ?? '—'}</td>
													<td>{trail.latitude}, {trail.longitude}</td>
													<td class="has-text-right">
													<div class="buttons is-right are-small mb-0">
															<a class="button is-small" href="/trail/{trail._id}">Details</a>
															<button
																class="button is-small is-danger is-light"
																onclick={() => removeTrailFromCollection(trail._id)}
															>
																<span class="icon"><i class="fas fa-times"></i></span>
																<span>Remove</span>
															</button>
														</div>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								{:else}
									<p class="has-text-grey">No trails in this collection yet.</p>
								{/if}
							</div>

							<div class="field is-grouped is-grouped-right mt-5">
								<p class="control">
									<a class="button is-primary" href="/collection/{collection._id}/add-trails">
										<span class="icon"><i class="fas fa-plus"></i></span>
										<span>Add Trails</span>
									</a>
								</p>
								<p class="control">
									<button class="button is-danger" onclick={deleteCollection}>
										<span class="icon"><i class="fas fa-trash"></i></span>
										<span>Delete</span>
									</button>
								</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</section>

	<Footer />
</div>
