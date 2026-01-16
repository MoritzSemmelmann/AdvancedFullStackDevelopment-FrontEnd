<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { onMount } from 'svelte';
	import { loggedInUser, refreshCollections } from '$lib/runes.svelte';

	let name = '';
	let description = '';
	let availableTrails: any[] = [];
	let selectedTrailIds: string[] = [];
	let errorMessage = '';
	let isLoading = false;
	let isLoadingTrails = true;

	onMount(async () => {
		await loadTrails();
	});

	async function loadTrails() {
		const token = loggedInUser.token;
		const userId = loggedInUser._id;

		if (!token || !userId) {
			window.location.href = '/login';
			return;
		}

		isLoadingTrails = true;

		try {
			const response = await fetch(`http://localhost:3000/api/trails/getByUserId/${userId}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (response.ok) {
				availableTrails = await response.json();
			}
		} catch (error) {
			console.error('Error loading trails:', error);
		} finally {
			isLoadingTrails = false;
		}
	}

	function toggleTrail(trailId: string) {
		if (selectedTrailIds.includes(trailId)) {
			selectedTrailIds = selectedTrailIds.filter((id) => id !== trailId);
		} else {
			selectedTrailIds = [...selectedTrailIds, trailId];
		}
	}

	async function handleSubmit() {
		errorMessage = '';

		if (!name || !description) {
			errorMessage = 'Please fill in all required fields';
			return;
		}

		const token = loggedInUser.token;
		const userId = loggedInUser._id;

		if (!token || !userId) {
			window.location.href = '/login';
			return;
		}

		isLoading = true;

		try {
			const response = await fetch(`http://localhost:3000/api/collections/create/${userId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					name,
					description
				})
			});

			if (response.ok) {
				const collection = await response.json();
				if (selectedTrailIds.length > 0) {
					for (const trailId of selectedTrailIds) {
						await fetch(
							`http://localhost:3000/api/collections/addTrail/${collection._id}/${trailId}`,
							{
								method: 'POST',
								headers: {
									Authorization: `Bearer ${token}`
								}
							}
						);
					}
				}

				await refreshCollections(userId);
				window.location.href = '/dashboard';
			} else {
				const data = await response.json();
				errorMessage = data.message || 'Failed to create collection';
			}
		} catch (error) {
			errorMessage = 'An error occurred while creating the collection';
			console.error('Error creating collection:', error);
		} finally {
			isLoading = false;
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

						<h1 class="title is-3 has-text-centered">Create Collection</h1>
						<p class="subtitle is-6 has-text-centered mb-5">Group your favorite trails.</p>

						{#if errorMessage}
							<div class="notification is-danger is-light">
								<button class="delete" onclick={() => (errorMessage = '')}></button>
								{errorMessage}
							</div>
						{/if}

						<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
							<div class="columns is-variable is-4">
								<div class="column is-half">
									<div class="field">
										<label class="label" for="name">Name</label>
										<div class="control has-icons-left">
											<input
												class="input is-medium"
												id="name"
												bind:value={name}
												type="text"
												required
											/>
											<span class="icon is-small is-left"><i class="fas fa-folder"></i></span>
										</div>
									</div>
								</div>
								<div class="column is-half">
									<div class="field">
										<label class="label" for="description">Description</label>
										<div class="control has-icons-left">
											<input
												class="input is-medium"
												id="description"
												bind:value={description}
												type="text"
												required
											/>
											<span class="icon is-small is-left"><i class="fas fa-align-left"></i></span>
										</div>
									</div>
								</div>
							</div>

							<div class="field">
								<label class="label">Add Trails (optional)</label>
								{#if isLoadingTrails}
									<p class="has-text-grey">Loading trails...</p>
								{:else if availableTrails.length > 0}
									<div class="box" style="max-height: 300px; overflow: auto;">
										{#each availableTrails as trail}
											<label class="checkbox is-block mb-2">
												<input
													type="checkbox"
													checked={selectedTrailIds.includes(trail._id)}
													onchange={() => toggleTrail(trail._id)}
												/>
												<span class="ml-2 has-text-weight-medium">{trail.name}</span>
												<span class="ml-2 has-text-grey is-size-7"
													>({trail.lengthInKm} km, {trail.difficulty})</span
												>
											</label>
										{/each}
									</div>
								{:else}
									<p class="has-text-grey">You have no trails yet. Create a trail first.</p>
								{/if}
							</div>

							<div class="field is-grouped is-grouped-right">
								<p class="control is-expanded">
									<button
										class="button is-primary is-fullwidth is-medium"
										class:is-loading={isLoading}
										type="submit"
									>
										<span class="icon"><i class="fas fa-folder-plus"></i></span>
										<span>Create Collection</span>
									</button>
								</p>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	</section>

	<Footer />
</div>
