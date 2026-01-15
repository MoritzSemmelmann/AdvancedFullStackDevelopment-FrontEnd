<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	// @ts-ignore
	import Chart from 'svelte-frappe-charts';
	import { onMount } from 'svelte';

	let trails: any[] = [];
	let collections: any[] = [];
	let isLoading = true;
	let chartData: any = null;
	let selectedCollection = 'all';

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

		try {
			const [trailsResponse, collectionsResponse] = await Promise.all([
				fetch(`http://localhost:3000/api/trails/getByUserId/${userId}`, {
					headers: { Authorization: `Bearer ${token}` }
				}),
				fetch(`http://localhost:3000/api/collections/getByUserId/${userId}`, {
					headers: { Authorization: `Bearer ${token}` }
				})
			]);

			if (trailsResponse.ok) {
				trails = await trailsResponse.json();
			}

			if (collectionsResponse.ok) {
				collections = await collectionsResponse.json();
			}

			generateChartData();
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	}

	async function handleCollectionChange() {
		if (selectedCollection === 'all') {
			generateChartData();
		} else {
			await loadCollectionTrails(selectedCollection);
		}
	}

	async function loadCollectionTrails(collectionId: string) {
		const token = localStorage.getItem('token');

		try {
			const response = await fetch(
				`http://localhost:3000/api/collections/getAllTrails/${collectionId}`,
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);

			if (response.ok) {
				const collectionTrails = await response.json();
				generateChartData(collectionTrails);
			}
		} catch (error) {
			console.error('Error loading collection trails:', error);
		}
	}

	function generateChartData(trailsToUse: any[] = trails) {
		const counts = {
			Easy: 0,
			Moderate: 0,
			Hard: 0
		};

		trailsToUse.forEach((trail) => {
			if (trail.difficulty in counts) {
				counts[trail.difficulty as keyof typeof counts]++;
			}
		});

		chartData = {
			labels: ['Easy', 'Moderate', 'Hard'],
			datasets: [
				{
					values: [counts.Easy, counts.Moderate, counts.Hard]
				}
			],
			totalTrails: trailsToUse.length
		};
	}
</script>

<div style="min-height: 100vh; display: flex; flex-direction: column;">
	<NavBar />

	<section class="section" style="flex: 1;">
		<div class="container">
			<div class="level">
				<div class="level-left">
					<div class="level-item">
						<h1 class="title is-3">Trail Statistics</h1>
					</div>
				</div>
				<div class="level-right">
					<div class="level-item">
						<div class="field">
							<div class="control">
								<div class="select is-primary">
									<select bind:value={selectedCollection} onchange={handleCollectionChange}>
										<option value="all">All Trails</option>
										{#each collections as collection}
											<option value={collection._id}>{collection.name}</option>
										{/each}
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{#if isLoading}
				<div class="has-text-centered">
					<p>Loading...</p>
				</div>
			{:else if chartData}
				<div class="columns is-centered">
					<div class="column is-8">
						<div class="box">
							<h2 class="title is-4 has-text-centered mb-4">Trails by Difficulty</h2>
							<Chart data={chartData} type="bar" colors={['#48c78e', '#ffe08a', '#f14668']} />
						</div>
					</div>
				</div>

				<div class="columns is-centered mt-4">
					<div class="column is-8">
						<div class="box">
							<h2 class="title is-4 has-text-centered mb-4">Total Trails</h2>
							<p class="title is-1 has-text-centered has-text-primary">{chartData.totalTrails}</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="notification is-info is-light">
					<p class="has-text-centered">No trails found. Create your first trail to see statistics!</p>
				</div>
			{/if}
		</div>
	</section>

	<Footer />
</div>

