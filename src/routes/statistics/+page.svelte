<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	// @ts-ignore
	import Chart from 'svelte-frappe-charts';
	import { onMount } from 'svelte';

	import TrailScatterChart from '$lib/components/trail-scatter-chart.svelte';
	import CategoryNetworkGraph from '$lib/components/category-network-graph.svelte';
	import type { ScatterPoint } from '$lib/types/statistics';
	import { loggedInUser, currentTrails, currentCollections } from '$lib/runes.svelte';
	import { apiFetch } from '$lib/api-interceptor';

	const difficultyPalette = ['#48c78e', '#ffe08a', '#f14668'];
	const difficultyColors: Record<string, string> = {
		Easy: difficultyPalette[0],
		Moderate: difficultyPalette[1],
		Hard: difficultyPalette[2],
		Unknown: '#7a7a7a'
	};

	let trails: any[] = [];
	let collections: any[] = [];
	let isLoading = true;
	let difficultyChartData: any = null;
	let lengthChartData: any = null;
	let timelineChartData: any = null;
	let categoryChartData: any = null;
	let elevationChartData: any = null;
	let durationChartData: any = null;
	let scatterPoints: ScatterPoint[] = [];
	let durationScatterPoints: ScatterPoint[] = [];
	let displayedTrails: any[] = [];
	let totalTrails = 0;
	let selectedCollection = 'all';
	let activeTab: 'timeline' | 'walking' | 'categories' = 'timeline';

	function toNumeric(value: unknown): number | null {
		if (value === null || value === undefined || value === '') {
			return null;
		}

		const numeric = typeof value === 'number' ? value : Number(value);
		return Number.isFinite(numeric) ? numeric : null;
	}

	onMount(async () => {
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

		try {
			trails = currentTrails.trails;
			collections = currentCollections.collections;

			if (trails.length === 0) {
				console.warn('No trails data available');
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
		try {
			const response = await apiFetch(
				`http://localhost:3000/api/collections/getAllTrails/${collectionId}`,
				{
					headers: { Authorization: `Bearer ${loggedInUser.token}` }
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
		displayedTrails = trailsToUse;

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
		const elevationSums = { Easy: 0, Moderate: 0, Hard: 0 };
		const durationSums = { Easy: 0, Moderate: 0, Hard: 0 };
		const difficultyCounts = { Easy: 0, Moderate: 0, Hard: 0 };
		scatterPoints = [];
		durationScatterPoints = [];

		trailsToUse.forEach((trail) => {
			const lengthValue = toNumeric(trail.lengthInKm);
			const elevationValue = toNumeric(trail.elevationGainInM);
			const durationValue = toNumeric(trail.estimatedDurationInMin);

			if (
				trail.difficulty in lengthSums &&
				lengthValue !== null &&
				lengthValue >= 0
			) {
				lengthSums[trail.difficulty as keyof typeof lengthSums] += lengthValue;
				difficultyCounts[trail.difficulty as keyof typeof difficultyCounts]++;
			}

			if (
				trail.difficulty in elevationSums &&
				elevationValue !== null &&
				elevationValue >= 0
			) {
				elevationSums[trail.difficulty as keyof typeof elevationSums] += elevationValue;
			}

			if (
				trail.difficulty in durationSums &&
				durationValue !== null &&
				durationValue >= 0
			) {
				durationSums[trail.difficulty as keyof typeof durationSums] += durationValue;
			}

			if (
				lengthValue !== null &&
				elevationValue !== null &&
				lengthValue >= 0 &&
				elevationValue >= 0
			) {
				scatterPoints.push({
					x: Math.round(lengthValue * 100) / 100,
					y: Math.round(elevationValue * 10) / 10,
					difficulty: trail.difficulty || 'Unknown',
					name: trail.name || 'Unbenannter Trail'
				});
			}

			if (
				lengthValue !== null &&
				durationValue !== null &&
				lengthValue >= 0 &&
				durationValue >= 0
			) {
				durationScatterPoints.push({
					x: Math.round(lengthValue * 100) / 100,
					y: Math.round(durationValue * 10) / 10,
					difficulty: trail.difficulty || 'Unknown',
					name: trail.name || 'Unbenannter Trail'
				});
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

		const avgElevation = {
			Easy: difficultyCounts.Easy ? elevationSums.Easy / difficultyCounts.Easy : 0,
			Moderate: difficultyCounts.Moderate ? elevationSums.Moderate / difficultyCounts.Moderate : 0,
			Hard: difficultyCounts.Hard ? elevationSums.Hard / difficultyCounts.Hard : 0
		};

		elevationChartData = {
			labels: ['Easy', 'Moderate', 'Hard'],
			datasets: [
				{
					name: 'Average Elevation Gain (m)',
					values: [
						Math.round(avgElevation.Easy),
						Math.round(avgElevation.Moderate),
						Math.round(avgElevation.Hard)
					]
				}
			]
		};

		const avgDuration = {
			Easy: difficultyCounts.Easy ? durationSums.Easy / difficultyCounts.Easy : 0,
			Moderate: difficultyCounts.Moderate ? durationSums.Moderate / difficultyCounts.Moderate : 0,
			Hard: difficultyCounts.Hard ? durationSums.Hard / difficultyCounts.Hard : 0
		};

		durationChartData = {
			labels: ['Easy', 'Moderate', 'Hard'],
			datasets: [
				{
					name: 'Average Duration (min)',
					values: [
						Math.round(avgDuration.Easy),
						Math.round(avgDuration.Moderate),
						Math.round(avgDuration.Hard)
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
						<li class={activeTab === 'walking' ? 'is-active' : ''}>
							<a
								onclick={() => (activeTab = 'walking')}
								onkeydown={(e) => e.key === 'Enter' && (activeTab = 'walking')}
								class={activeTab === 'walking' ? 'has-text-primary' : ''}
								role="button"
								tabindex="0"
							>
								<span class="icon is-small"><i class="fas fa-signal" aria-hidden="true"></i></span>
								<span>Walking Trails</span>
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

				<!-- Walking Trails Tab -->
				{#if activeTab === 'walking'}
					<div class="columns mb-5">
						<div class="column is-6">
							<div class="box">
								<h2 class="title is-5 has-text-centered mb-4">Difficulty Distribution</h2>
								<Chart
									data={difficultyChartData}
									type="pie"
									colors={difficultyPalette}
								/>
							</div>
						</div>

						<div class="column is-6">
							<div class="box">
								<h2 class="title is-5 has-text-centered mb-4">Average Length by Difficulty</h2>
								<Chart data={lengthChartData} type="bar" colors={difficultyPalette} />
							</div>
						</div>
					</div>

					<div class="columns">
						<div class="column">
							<div class="box">
								<h2 class="title is-5 has-text-centered mb-4">Length vs Elevation Gain</h2>
								{#if scatterPoints.length}
									<TrailScatterChart
										points={scatterPoints}
										colors={difficultyColors}
										xLabel="Length (km)"
										yLabel="Elevation Gain (m)"
										formatXValue={(value) => `${value} km`}
										formatYValue={(value) => `${value} m`}
									/>
								{:else}
									<p class="has-text-centered has-text-grey">No elevation data available yet.</p>
								{/if}
							</div>
						</div>
					</div>

					<div class="columns">
						<div class="column">
							<div class="box">
								<h2 class="title is-5 has-text-centered mb-4">Length vs Duration</h2>
								{#if durationScatterPoints.length}
									<TrailScatterChart
										points={durationScatterPoints}
										colors={difficultyColors}
										xLabel="Length (km)"
										yLabel="Duration (min)"
										formatXValue={(value) => `${value} km`}
										formatYValue={(value) => `${value} min`}
									/>
								{:else}
									<p class="has-text-centered has-text-grey">No duration data available yet.</p>
								{/if}
							</div>
						</div>
					</div>

					<div class="columns">
						<div class="column is-6">
							<div class="box">
								<h2 class="title is-5 has-text-centered mb-4">Average Elevation Gain by Difficulty</h2>
								{#if elevationChartData}
									<Chart data={elevationChartData} type="bar" colors={difficultyPalette} />
								{:else}
									<p class="has-text-centered has-text-grey">No elevation data available.</p>
								{/if}
							</div>
						</div>
						<div class="column is-6">
							<div class="box">
								<h2 class="title is-5 has-text-centered mb-4">Average Duration by Difficulty</h2>
								{#if durationChartData}
									<Chart data={durationChartData} type="bar" colors={difficultyPalette} />
								{:else}
									<p class="has-text-centered has-text-grey">No duration data available.</p>
								{/if}
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
								<div class="box mt-5">
									<h2 class="title is-4 has-text-centered mb-4">Category Network</h2>
									<CategoryNetworkGraph trails={displayedTrails} />
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

