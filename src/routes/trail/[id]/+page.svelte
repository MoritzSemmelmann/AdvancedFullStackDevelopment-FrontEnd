<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let trail: any = null;
	let isLoading = true;
	let errorMessage = '';
	let trailId = '';

	onMount(async () => {
		const pathParts = window.location.pathname.split('/');
		trailId = pathParts[pathParts.length - 1];
		await loadTrail();
	});

	async function loadTrail() {
		const token = localStorage.getItem('token');

		if (!token) {
			window.location.href = '/login';
			return;
		}

		isLoading = true;
		errorMessage = '';

		try {
			const response = await fetch(`http://localhost:3000/api/trails/getByTrailId/${trailId}`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (response.ok) {
				trail = await response.json();
			} else {
				errorMessage = 'Failed to load trail details';
			}
		} catch (error) {
			errorMessage = 'An error occurred while loading trail details';
			console.error('Error loading trail:', error);
		} finally {
			isLoading = false;
		}
	}

	async function deleteTrail() {
		if (!confirm('Delete this trail permanently?')) {
			return;
		}

		const token = localStorage.getItem('token');

		try {
			const response = await fetch(`http://localhost:3000/api/trails/delete/${trailId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (response.ok) {
				window.location.href = '/dashboard';
			} else {
				errorMessage = 'Failed to delete trail';
			}
		} catch (error) {
			errorMessage = 'An error occurred while deleting the trail';
			console.error('Error deleting trail:', error);
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
						{:else if trail}
							{#if trail.image}
								<div class="box p-0 mb-5">
									<figure class="image is-16by9">
										<img src={trail.image} alt={trail.name} />
									</figure>
								</div>
							{/if}

							<h1 class="title is-3">{trail.name}</h1>
							<p class="subtitle is-6 has-text-grey">Created: {new Date(trail.date).toLocaleDateString()}</p>

							<div class="content">
								<p>{trail.description}</p>
							</div>

							{#if trail.categories && trail.categories.length > 0}
								<div class="mb-4">
									<p class="heading">Categories</p>
									<div class="tags">
										{#each trail.categories as category}
											<span class="tag is-info is-light">
												<span>{category}</span>
											</span>
										{/each}
									</div>
								</div>
							{/if}

							<div class="columns is-variable is-4 mt-4">
								<div class="column">
									<div class="box has-background-light">
										<p class="heading">Length</p>
										<p class="title is-5">{trail.lengthInKm} km</p>
									</div>
								</div>
								<div class="column">
									<div class="box has-background-light">
										<p class="heading">Difficulty</p>
										<p class="title is-5">{trail.difficulty}</p>
									</div>
								</div>
								<div class="column">
									<div class="box has-background-light">
										<p class="heading">Coordinates</p>
										<p class="title is-6">{trail.latitude}, {trail.longitude}</p>
									</div>
								</div>
							</div>

							<div class="field is-grouped is-grouped-right mt-5">
								<p class="control">
									<a class="button" href="/dashboard">Back</a>
								</p>
								<p class="control">
									<button class="button is-danger" onclick={deleteTrail}>
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
