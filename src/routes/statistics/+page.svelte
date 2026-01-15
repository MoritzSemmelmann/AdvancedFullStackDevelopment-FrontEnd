<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	// @ts-ignore
	import Chart from 'svelte-frappe-charts';
	import { onMount } from 'svelte';

	let trails: any[] = [];
	let collections: any[] = [];
	let isLoading = true;
	let difficultyChartData: any = null;
	let lengthChartData: any = null;
	let timelineChartData: any = null;
	let categoryChartData: any = null;
	let totalTrails = 0;
	let selectedCollection = 'all';
	let activeTab: 'timeline' | 'difficulty' | 'categories' = 'timeline';

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
		totalTrails = trailsToUse.length;

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

		difficultyChartData = {
			labels: ['Easy', 'Moderate', 'Hard'],
			datasets: [
				{
					values: [counts.Easy, counts.Moderate, counts.Hard]
				}
			]
		};

		const lengthSums = { Easy: 0, Moderate: 0, Hard: 0 };
		const difficultyCounts = { Easy: 0, Moderate: 0, Hard: 0 };

		trailsToUse.forEach((trail) => {
			if (trail.difficulty in lengthSums && trail.lengthInKm) {
				lengthSums[trail.difficulty as keyof typeof lengthSums] += trail.lengthInKm;
				difficultyCounts[trail.difficulty as keyof typeof difficultyCounts]++;
			}
		});

		const avgLengths = {
			Easy: difficultyCounts.Easy > 0 ? lengthSums.Easy / difficultyCounts.Easy : 0,
			Moderate: difficultyCounts.Moderate > 0 ? lengthSums.Moderate / difficultyCounts.Moderate : 0,
			Hard: difficultyCounts.Hard > 0 ? lengthSums.Hard / difficultyCounts.Hard : 0
		};

		lengthChartData = {
			labels: ['Easy', 'Moderate', 'Hard'],
			datasets: [
				{
					name: 'Average Length (km)',
					values: [
						Math.round(avgLengths.Easy * 10) / 10,
						Math.round(avgLengths.Moderate * 10) / 10,
						Math.round(avgLengths.Hard * 10) / 10
					]
				}
			]
		};

		if (trailsToUse.length > 0) {
			const trailsByMonth = new Map();

			trailsToUse.forEach((trail) => {
				if (trail.date) {
					const date = new Date(trail.date);
					const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
					trailsByMonth.set(monthKey, (trailsByMonth.get(monthKey) || 0) + 1);
				}
			});

			const sortedMonths = Array.from(trailsByMonth.keys()).sort();
			const labels = sortedMonths.map((key) => {
				const [year, month] = key.split('-');
				const date = new Date(parseInt(year), parseInt(month) - 1);
				return date.toLocaleDateString('de-DE', { year: 'numeric', month: 'short' });
			});
			const values = sortedMonths.map((key) => trailsByMonth.get(key));

			timelineChartData = {
				labels,
				datasets: [
					{
						name: 'Trails Created',
						values
					}
				]
			};
		} else {
			timelineChartData = null;
		}

		const categoryCounts = new Map();
		trailsToUse.forEach((trail) => {
			if (trail.categories && Array.isArray(trail.categories)) {
				trail.categories.forEach((category: any) => {
					const categoryName = typeof category === 'string' ? category : category.name || 'Unknown';
					categoryCounts.set(categoryName, (categoryCounts.get(categoryName) || 0) + 1);
				});
			}
		});

		if (categoryCounts.size > 0) {
			const sortedCategories = Array.from(categoryCounts.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 10);

			categoryChartData = {
				labels: sortedCategories.map((entry) => entry[0]),
				datasets: [
					{
						name: 'Trails per Category',
						values: sortedCategories.map((entry) => entry[1])
					}
				]
			};
		} else {
			categoryChartData = null;
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
			{:else if difficultyChartData}
				<!-- Tabs -->
				<div class="tabs is-boxed mb-5">
					<ul>
						<li class={activeTab === 'timeline' ? 'is-active' : ''}>
							<a
								onclick={() => (activeTab = 'timeline')}
								onkeydown={(e) => e.key === 'Enter' && (activeTab = 'timeline')}
								class={activeTab === 'timeline' ? 'has-text-primary' : ''}
								role="button"
								tabindex="0"
							>
								<span class="icon is-small"><i class="fas fa-chart-line" aria-hidden="true"></i></span>
								<span>Timeline</span>
							</a>
						</li>
						<li class={activeTab === 'difficulty' ? 'is-active' : ''}>
							<a
								onclick={() => (activeTab = 'difficulty')}
								onkeydown={(e) => e.key === 'Enter' && (activeTab = 'difficulty')}
								class={activeTab === 'difficulty' ? 'has-text-primary' : ''}
								role="button"
								tabindex="0"
							>
								<span class="icon is-small"><i class="fas fa-signal" aria-hidden="true"></i></span>
								<span>Difficulty</span>
							</a>
						</li>
						<li class={activeTab === 'categories' ? 'is-active' : ''}>
							<a
								onclick={() => (activeTab = 'categories')}
								onkeydown={(e) => e.key === 'Enter' && (activeTab = 'categories')}
								class={activeTab === 'categories' ? 'has-text-primary' : ''}
								role="button"
								tabindex="0"
							>
								<span class="icon is-small"><i class="fas fa-tags" aria-hidden="true"></i></span>
								<span>Categories</span>
							</a>
						</li>
					</ul>
				</div>

				<!-- Timeline Tab -->
				{#if activeTab === 'timeline'}
					<div class="columns is-centered mb-5">
						<div class="column is-4">
							<div class="box">
								<h2 class="title is-4 has-text-centered mb-4">Total Trails</h2>
								<p class="title is-1 has-text-centered has-text-primary">{totalTrails}</p>
							</div>
						</div>
					</div>

					{#if timelineChartData}
						<div class="columns is-centered">
							<div class="column is-12">
								<div class="box">
									<h2 class="title is-4 has-text-centered mb-4">Trails Created Over Time</h2>
									<Chart
										data={timelineChartData}
										type="line"
										colors={['#485fc7']}
										lineOptions={{ regionFill: 1, hideDots: 0 }}
									/>
								</div>
							</div>
						</div>
					{:else}
						<div class="notification is-info is-light">
							<p class="has-text-centered">No timeline data available.</p>
						</div>
					{/if}
				{/if}

				<!-- Difficulty Tab -->
				{#if activeTab === 'difficulty'}
					<div class="columns mb-5">
						<div class="column is-6">
							<div class="box">
								<h2 class="title is-5 has-text-centered mb-4">Difficulty Distribution</h2>
								<Chart
									data={difficultyChartData}
									type="pie"
									colors={['#48c78e', '#ffe08a', '#f14668']}
								/>
							</div>
						</div>

						<div class="column is-6">
							<div class="box">
								<h2 class="title is-5 has-text-centered mb-4">Average Length by Difficulty</h2>
								<Chart data={lengthChartData} type="bar" colors={['#48c78e', '#ffe08a', '#f14668']} />
							</div>
						</div>
					</div>
				{/if}

				<!-- Categories Tab -->
				{#if activeTab === 'categories'}
					{#if categoryChartData}
						<div class="columns is-centered">
							<div class="column is-10">
								<div class="box">
									<h2 class="title is-4 has-text-centered mb-4">Top Categories</h2>
									<Chart
										data={categoryChartData}
										type="bar"
										colors={['#485fc7']}
										height={300}
									/>
								</div>
							</div>
						</div>
					{:else}
						<div class="notification is-info is-light">
							<p class="has-text-centered">No category data available.</p>
						</div>
					{/if}
				{/if}
			{:else}
				<div class="notification is-info is-light">
					<p class="has-text-centered">No trails found. Create your first trail to see statistics!</p>
				</div>
			{/if}
		</div>
	</section>

	<Footer />
</div>

