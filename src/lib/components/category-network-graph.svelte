<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	export let trails: any[] = [];

	let svgElement: SVGSVGElement;
	let selectedCategories: Set<string> = new Set();
	let allCategories: string[] = [];
	let showAllCategories = true;

	interface Node extends d3.SimulationNodeDatum {
		id: string;
		count: number;
		radius: number;
	}

	interface Link extends d3.SimulationLinkDatum<Node> {
		source: string | Node;
		target: string | Node;
		value: number;
	}

	function getAllCategories() {
		const categories = new Set<string>();
		trails.forEach((trail) => {
			if (trail.categories && Array.isArray(trail.categories)) {
				trail.categories.forEach((cat: any) => {
					const categoryName = typeof cat === 'string' ? cat : cat.name || 'Unknown';
					categories.add(categoryName);
				});
			}
		});
		return Array.from(categories).sort();
	}

	function toggleCategory(category: string) {
		if (selectedCategories.has(category)) {
			selectedCategories.delete(category);
		} else {
			selectedCategories.add(category);
		}
		selectedCategories = selectedCategories;
		showAllCategories = selectedCategories.size === 0;
		createGraph();
	}

	function selectAll() {
		selectedCategories.clear();
		showAllCategories = true;
		selectedCategories = selectedCategories;
		createGraph();
	}

	function buildNetworkData() {
		const categoryCount = new Map<string, number>();
		const connections = new Map<string, number>();

		const categoriesToShow = showAllCategories ? new Set(allCategories) : selectedCategories;

		trails.forEach((trail) => {
			if (trail.categories && Array.isArray(trail.categories)) {
				const categoryNames = trail.categories
					.map((cat: any) => (typeof cat === 'string' ? cat : cat.name || 'Unknown'))
					.filter((cat: string) => categoriesToShow.has(cat))
					.sort();

				if (categoryNames.length === 0) return;

				categoryNames.forEach((cat: string) => {
					categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
				});

				for (let i = 0; i < categoryNames.length; i++) {
					for (let j = i + 1; j < categoryNames.length; j++) {
						const key = [categoryNames[i], categoryNames[j]].sort().join('|');
						connections.set(key, (connections.get(key) || 0) + 1);
					}
				}
			}
		});

		const nodes: Node[] = Array.from(categoryCount.entries()).map(([id, count]) => ({
			id,
			count,
			radius: Math.max(10, Math.min(30, count * 5))
		}));

		const links: Link[] = [];
		connections.forEach((value, key) => {
			const [source, target] = key.split('|');
			links.push({ source, target, value });
		});

		return { nodes, links };
	}

	function createGraph() {
		if (!svgElement || trails.length === 0) return;

		const { nodes, links } = buildNetworkData();
		if (nodes.length === 0) return;

		d3.select(svgElement).selectAll('*').remove();

		const width = svgElement.clientWidth || 800;
		const height = 600;

		const svg = d3
			.select(svgElement)
			.attr('width', width)
			.attr('height', height)
			.attr('viewBox', [0, 0, width, height]);

		const simulation = d3
			.forceSimulation<Node>(nodes)
			.force(
				'link',
				d3
					.forceLink<Node, Link>(links)
					.id((d) => d.id)
					.distance(100)
					.strength((d) => d.value * 0.1)
			)
			.force('charge', d3.forceManyBody().strength(-300))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collision', d3.forceCollide().radius((d: any) => d.radius + 10));

		const link = svg
			.append('g')
			.selectAll('line')
			.data(links)
			.join('line')
			.attr('stroke', '#999')
			.attr('stroke-opacity', 0.6)
			.attr('stroke-width', (d) => Math.sqrt(d.value) * 2);

		const node = svg
			.append('g')
			.selectAll('circle')
			.data(nodes)
			.join('circle')
			.attr('r', (d) => d.radius)
			.attr('fill', (d) => (selectedCategories.has(d.id) ? '#48c78e' : '#485fc7'))
			.attr('stroke', '#fff')
			.attr('stroke-width', 2);

		const label = svg
			.append('g')
			.selectAll('text')
			.data(nodes)
			.join('text')
			.text((d) => d.id)
			.attr('font-size', 12)
			.attr('font-weight', 'bold')
			.attr('fill', '#363636')
			.attr('text-anchor', 'middle')
			.attr('dy', (d) => d.radius + 15)
			.style('pointer-events', 'none');

		const countLabel = svg
			.append('g')
			.selectAll('text')
			.data(nodes)
			.join('text')
			.text((d) => d.count)
			.attr('font-size', 10)
			.attr('fill', '#fff')
			.attr('text-anchor', 'middle')
			.attr('dy', 4)
			.style('pointer-events', 'none');

		simulation.on('tick', () => {
			link
				.attr('x1', (d: any) => d.source.x)
				.attr('y1', (d: any) => d.source.y)
				.attr('x2', (d: any) => d.target.x)
				.attr('y2', (d: any) => d.target.y);

			node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!);

			label.attr('x', (d) => d.x!).attr('y', (d) => d.y!);

			countLabel.attr('x', (d) => d.x!).attr('y', (d) => d.y!);
		});
	}

	onMount(() => {
		allCategories = getAllCategories();
		createGraph();
	});

	$: if (svgElement && trails) {
		allCategories = getAllCategories();
		createGraph();
	}
</script>

<div class="block">
	<div class="field mb-4">
		<label class="label">Select Categories to Display</label>
		<div class="control">
			<div class="dropdown is-hoverable is-fullwidth">
				<div class="dropdown-trigger is-fullwidth">
					<button
						class="button is-fullwidth is-flex is-justify-content-space-between"
						aria-haspopup="true"
						aria-controls="dropdown-menu"
					>
						<span>
							{#if showAllCategories}
								All Categories ({allCategories.length})
							{:else}
								{selectedCategories.size} Selected
							{/if}
						</span>
						<span class="icon is-small">
							<i class="fas fa-angle-down" aria-hidden="true"></i>
						</span>
					</button>
				</div>
				<div class="dropdown-menu is-fullwidth" id="dropdown-menu" role="menu">
					<div class="dropdown-content" style="max-height: 300px; overflow-y: auto;">
						<a href="#all" class="dropdown-item" onclick={(e) => { e.preventDefault(); selectAll(); }}>
							<span class="icon-text">
								<span class="icon">
									{#if showAllCategories}
										<i class="fas fa-check has-text-primary"></i>
									{/if}
								</span>
								<span><strong>All Categories</strong></span>
							</span>
						</a>
						<hr class="dropdown-divider" />
						{#each allCategories as category}
							<a
								href="#{category}"
								class="dropdown-item"
								onclick={(e) => { e.preventDefault(); toggleCategory(category); }}
							>
								<span class="icon-text">
									<span class="icon">
										{#if selectedCategories.has(category) || showAllCategories}
											<i class="fas fa-check has-text-primary"></i>
										{/if}
									</span>
									<span>{category}</span>
								</span>
							</a>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="box has-background-light p-0">
		<svg bind:this={svgElement} style="width: 100%; height: 600px;"></svg>
	</div>
</div>
