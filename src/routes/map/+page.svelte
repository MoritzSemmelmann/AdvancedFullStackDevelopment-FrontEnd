<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import 'leaflet/dist/leaflet.css';
	import { onDestroy, onMount } from 'svelte';
	import type { Control, LatLngExpression, Map as LeafletMap } from 'leaflet';
	import { loggedInUser, currentTrails, refreshTrails } from '$lib/runes.svelte';

	const mapId = 'trails-map';
	const mapHeightVh = 55;
	const fallbackCenter: LatLngExpression = [53.2734, -7.7783203];
	const fallbackZoom = 6;

	let map: LeafletMap;
	let control: Control.Layers;
	let overlays: Control.LayersObject = {};
	let baseLayers: Record<string, any> = {};

	onMount(async () => {
		const { default: L } = await import('leaflet');

		if (!loggedInUser.token || !loggedInUser._id) {
			window.location.href = '/login';
			return;
		}
		if (!currentTrails.trails.length) {
			await refreshTrails(loggedInUser._id);
		}

		baseLayers = {
			Terrain: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				maxZoom: 17,
				attribution:
					'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

		const trailsWithCoords = currentTrails.trails.filter(
			(t) => typeof t.latitude === 'number' && typeof t.longitude === 'number'
		);

		if (trailsWithCoords.length) {
			const bounds = L.latLngBounds([]);
			trailsWithCoords.forEach((trail) => {
				const marker = L.marker([trail.latitude!, trail.longitude!]);
				const popupText = `<strong>${trail.name}</strong><br>${trail.difficulty ?? 'Difficulty unknown'}`;
				marker.bindPopup(popupText).addTo(map);
				bounds.extend(marker.getLatLng());
			});
			map.fitBounds(bounds, { padding: [24, 24] });
		}
	});

	onDestroy(() => {
		map?.remove();
	});
</script>

<div style="min-height: 100vh; display: flex; flex-direction: column;">
	<NavBar />

	<section class="section" style="flex: 1;">
		<div class="container">
			<h1 class="title is-3">Trails Map</h1>
			<p class="subtitle is-6 has-text-grey">All your trails plotted on the map.</p>

			<div id={mapId} class="box" style={`height: ${mapHeightVh}vh`}></div>
		</div>
	</section>

	<Footer />
</div>

