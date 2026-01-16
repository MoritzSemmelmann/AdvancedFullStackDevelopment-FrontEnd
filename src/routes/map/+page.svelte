<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import 'leaflet/dist/leaflet.css';
	import { onDestroy, onMount } from 'svelte';
	import type { Control, LatLngExpression, Map as LeafletMap, LayerGroup } from 'leaflet';
	import { loggedInUser, currentTrails, currentCollections, refreshTrails, getCollectionTrails } from '$lib/runes.svelte';

	const mapId = 'trails-map';
	const mapHeightVh = 55;
	const fallbackCenter: LatLngExpression = [53.2734, -7.7783203];
	const fallbackZoom = 6;

	let map: LeafletMap;
	let control: Control.Layers;
	let overlays: Control.LayersObject = {};
	let baseLayers: Record<string, any> = {};
	let markersLayer: LayerGroup | null = null;
	let leafletLib: any;

	let availableCategories: string[] = [];
	let selectedCategories: string[] = [];
	let selectedCollection = 'all';
	let displayTrails: typeof currentTrails.trails = [];

	const difficultyColors: Record<string, string> = {
		Easy: 'green',
		Moderate: 'orange',
		Hard: 'red'
	};

	function buildIcon(L: any, color: string) {
		const svg = encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?>
			<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
				<path d="M12.5 0C5.596 0 0 5.596 0 12.5 0 22.5 12.5 41 12.5 41S25 22.5 25 12.5C25 5.596 19.404 0 12.5 0z" fill="${color}" stroke="#1f2937" stroke-width="1.5"/>
				<circle cx="12.5" cy="12.5" r="5" fill="#ffffff" />
			</svg>`);
		return L.icon({
			iconUrl: `data:image/svg+xml,${svg}`,
			iconSize: [25, 41],
			iconAnchor: [12.5, 41],
			popupAnchor: [0, -34]
		});
	}

	function ensureAllCategoriesSelected(trails: typeof currentTrails.trails) {
		const categorySet = new Set<string>();
		trails.forEach((t) => t.categories?.forEach((c) => categorySet.add(c)));
		availableCategories = Array.from(categorySet).sort();
		if (!selectedCategories.length) {
			selectedCategories = [...availableCategories];
		}
	}

	function shouldShowTrail(categories?: string[]) {
		if (!categories || categories.length === 0) return false;
		if (selectedCategories.length === 0) return false;
		return categories.some((c) => selectedCategories.includes(c));
	}

	async function handleCollectionChange() {
		if (selectedCollection === 'all') {
			displayTrails = currentTrails.trails;
			ensureAllCategoriesSelected(displayTrails);
		} else {
			await loadCollectionTrails(selectedCollection);
		}
	}

	async function loadCollectionTrails(collectionId: string) {
		try {
			displayTrails = getCollectionTrails(collectionId);
			ensureAllCategoriesSelected(displayTrails);
		} catch (error) {
			console.error('Error loading collection trails:', error);
		}
	}

	function renderMarkers(L: any) {
		if (!map) return;
		markersLayer?.remove();
		const group = L.layerGroup();
		markersLayer = group;

		const trailsWithCoords = displayTrails.filter(
			(t) => typeof t.latitude === 'number' && typeof t.longitude === 'number'
		);

		const bounds = L.latLngBounds([]);
		trailsWithCoords.forEach((trail) => {
			if (!shouldShowTrail(trail.categories)) return;

			const color = difficultyColors[trail.difficulty ?? ''] ?? '#2563eb';
			const marker = L.marker([trail.latitude!, trail.longitude!], {
				icon: buildIcon(L, color)
			});
			const popupText = `
				<div>
					<strong>${trail.name}</strong><br>
					${trail.difficulty ?? 'Difficulty unknown'}<br>
					<a href="/trail/${trail._id}" class="has-text-link is-underlined mt-2 is-inline-block">
						View Details →
					</a>
				</div>
			`;
			marker.bindPopup(popupText).addTo(group);
			bounds.extend(marker.getLatLng());
		});

		group.addTo(map);

		if (group.getLayers().length) {
			map.fitBounds(bounds, { padding: [24, 24] });
		}
	}

	onMount(async () => {
		const { default: L } = await import('leaflet');
		leafletLib = L;

		if (!loggedInUser.token || !loggedInUser._id) {
			window.location.href = '/login';
			return;
		}
		if (!currentTrails.trails.length) {
			await refreshTrails(loggedInUser._id);
		}

		displayTrails = currentTrails.trails;
		ensureAllCategoriesSelected(displayTrails);

		baseLayers = {
			Terrain: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 17,
				attribution:
					'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}),
			Topo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
				maxZoom: 17,
				attribution:
					'Map data: © OpenStreetMap contributors, SRTM | Tiles © OpenTopoMap (CC-BY-SA)'
			}),
			Satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
				maxZoom: 19,
				attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics'
			})
		};

		const defaultLayer = baseLayers.Terrain;
		map = L.map(mapId, {
			center: fallbackCenter,
			zoom: fallbackZoom,
			minZoom: 4,
			layers: [defaultLayer]
		});

		control = L.control.layers(baseLayers, overlays).addTo(map);

		renderMarkers(L);
	});

	$: if (map && leafletLib && (selectedCategories.length >= 0 || displayTrails)) {
		renderMarkers(leafletLib);
	}

	onDestroy(() => {
		map?.remove();
	});
</script>

<div style="min-height: 100vh; display: flex; flex-direction: column;">
	<NavBar />

	<section class="section" style="flex: 1;">
		<div class="container">
			<div class="level">
				<div class="level-left">
					<div class="level-item">
						<h1 class="title is-3">Trails Map</h1>
					</div>
				</div>
				<div class="level-right">
					<div class="level-item">
						<div class="field">
							<div class="control">
								<div class="select is-primary">
									<select bind:value={selectedCollection} onchange={handleCollectionChange}>
										<option value="all">All Trails</option>
										{#each currentCollections.collections as collection}
											<option value={collection._id}>{collection.name}</option>
										{/each}
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div style="display: flex; gap: 20px; margin-top: 20px;">
			<!-- Map Container -->
			<div style="flex: 1; display: flex; flex-direction: column;">
				<div id={mapId} class="box" style={`height: ${mapHeightVh}vh`}></div>
			</div>

			<!-- Categories Panel -->
			{#if availableCategories.length}
				<div class="box" style="width: 280px; display: flex; flex-direction: column; padding: 0;">
					<div style="padding: 1rem; border-bottom: 1px solid #dbdbdb; font-weight: bold;">
						Categories
					</div>
					<div style="flex: 1; overflow-y: auto; padding: 1rem;">
						<div style="display: flex; flex-direction: column; gap: 0.5rem;">
							<label class="checkbox">
								<input 
									type="checkbox" 
									checked={selectedCategories.length === availableCategories.length}
									onchange={() => {
										if (selectedCategories.length === availableCategories.length) {
											selectedCategories = [];
										} else {
											selectedCategories = [...availableCategories];
										}
									}}
								/>
								<span style="margin-left: 0.5rem;">select all</span>
							</label>
							{#each availableCategories as category}
								<label class="checkbox">
									<input 
										type="checkbox" 
										checked={selectedCategories.includes(category)}
										onchange={(e) => {
											if (e.currentTarget.checked) {
												selectedCategories = [...selectedCategories, category];
											} else {
												selectedCategories = selectedCategories.filter(c => c !== category);
											}
										}}
									/>
									<span style="margin-left: 0.5rem;">{category}</span>
								</label>
							{/each}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<Footer />
</div>

