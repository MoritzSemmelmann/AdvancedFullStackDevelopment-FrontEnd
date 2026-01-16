<script lang="ts">
	import type { ScatterPoint } from '$lib/types/statistics';

	export let points: ScatterPoint[] = [];
	export let colors: Record<string, string> = {};
	export let xLabel = 'Length (km)';
	export let yLabel = 'Elevation Gain (m)';

	const width = 640;
	const height = 360;
	const margin = { top: 20, right: 24, bottom: 55, left: 65 };
	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	const defaultColor = '#485fc7';
	let minX = 0;
	let maxX = 1;
	let minY = 0;
	let maxY = 1;
	let xTicks: number[] = [];
	let yTicks: number[] = [];
	let legendItems: [string, string][] = [];

	$: validPoints = points.filter(
		(point) => Number.isFinite(point.length) && Number.isFinite(point.elevation)
	);

	function calculateDomain(values: number[]) {
		if (!values.length) {
			return [0, 1];
		}

		const maxValue = Math.max(0, ...values);
		const padding = maxValue === 0 ? 1 : maxValue * 0.1;
		return [0, maxValue + padding];
	}

	$: [minX, maxX] = calculateDomain(validPoints.map((point) => point.length));
	$: [minY, maxY] = calculateDomain(validPoints.map((point) => point.elevation));

	function scaleX(value: number) {
		const range = maxX - minX || 1;
		return margin.left + ((value - minX) / range) * innerWidth;
	}

	function scaleY(value: number) {
		const range = maxY - minY || 1;
		return height - margin.bottom - ((value - minY) / range) * innerHeight;
	}

	function generateTicks(min: number, max: number, segments = 4) {
		if (!Number.isFinite(min) || !Number.isFinite(max)) {
			return [];
		}

		const range = max - min;
		if (range === 0) {
			return [min];
		}

		const step = range / segments;
		return Array.from({ length: segments + 1 }, (_, index) => min + index * step);
	}

	function formatTick(value: number) {
		if (Math.abs(value) >= 1000) {
			return value.toFixed(0);
		}

		if (Math.abs(value) >= 100) {
			return value.toFixed(1);
		}

		return value.toFixed(2);
	}

	function getColor(difficulty?: string) {
		return (difficulty && colors[difficulty]) || defaultColor;
	}

	function mapLegendItems() {
		const seen = new Set<string>();
		const items: [string, string][] = [];

		Object.keys(colors).forEach((difficulty) => {
			if (validPoints.some((point) => (point.difficulty || 'Unknown') === difficulty)) {
				seen.add(difficulty);
				items.push([difficulty, colors[difficulty]]);
			}
		});

		validPoints.forEach((point) => {
			const key = point.difficulty || 'Other';
			if (!seen.has(key)) {
				seen.add(key);
				items.push([key, getColor(point.difficulty)]);
			}
		});

		return items;
	}

	$: xTicks = generateTicks(minX, maxX);
	$: yTicks = generateTicks(minY, maxY);
	$: legendItems = mapLegendItems();
</script>

<div class="is-flex is-flex-direction-column">
	<svg
		width="100%"
		height="360"
		viewBox={`0 0 ${width} ${height}`}
		role="img"
		aria-label={`${yLabel} plotted against ${xLabel}`}
	>
		<g>
			{#each yTicks as tick}
				<line
					x1={margin.left}
					x2={width - margin.right}
					y1={scaleY(tick)}
					y2={scaleY(tick)}
					stroke="#e5e5e5"
					stroke-width="1"
				/>
			{/each}
			{#each xTicks as tick}
				<line
					x1={scaleX(tick)}
					x2={scaleX(tick)}
					y1={margin.top}
					y2={height - margin.bottom}
					stroke="#e5e5e5"
					stroke-width="1"
				/>
			{/each}
		</g>

		<g>
			<line
				x1={margin.left}
				x2={width - margin.right}
				y1={height - margin.bottom}
				y2={height - margin.bottom}
				stroke="#4a4a4a"
				stroke-width="1.5"
			/>
			<line
				x1={margin.left}
				x2={margin.left}
				y1={margin.top}
				y2={height - margin.bottom}
				stroke="#4a4a4a"
				stroke-width="1.5"
			/>
		</g>

		<g>
			{#each xTicks as tick}
				<text
					x={scaleX(tick)}
					y={height - margin.bottom + 20}
					fill="#4a4a4a"
					font-size="12"
					text-anchor="middle"
				>
					{formatTick(tick)}
				</text>
			{/each}

			{#each yTicks as tick}
				<text
					x={margin.left - 10}
					y={scaleY(tick) + 4}
					fill="#4a4a4a"
					font-size="12"
					text-anchor="end"
				>
					{formatTick(tick)}
				</text>
			{/each}
		</g>

		<text
			x={margin.left + innerWidth / 2}
			y={height - 10}
			class="has-text-weight-semibold has-text-grey-dark"
			font-size="13"
			text-anchor="middle"
		>
			{xLabel}
		</text>
		<text
			x={20}
			y={margin.top + innerHeight / 2}
			transform={`rotate(-90 20 ${margin.top + innerHeight / 2})`}
			class="has-text-weight-semibold has-text-grey-dark"
			font-size="13"
			text-anchor="middle"
		>
			{yLabel}
		</text>

		<g>
			{#each validPoints as point, index}
				<circle
					cx={scaleX(point.length)}
					cy={scaleY(point.elevation)}
					r={6}
					fill={getColor(point.difficulty)}
					stroke="#ffffff"
					stroke-width="1.5"
					data-index={index}
				>
					<title>{`${point.name}\n${point.length} km | ${point.elevation} m`}</title>
				</circle>
			{/each}
		</g>
	</svg>

	{#if legendItems.length}
		<div class="is-flex is-flex-wrap-wrap is-align-items-center mt-3" aria-label="Difficulty legend">
			{#each legendItems as [difficulty, color]}
				<div class="is-flex is-align-items-center mr-4 mb-2 has-text-grey-dark">
					<svg viewBox="0 0 16 16" role="img" aria-hidden="true" class="mr-2">
						<circle cx="8" cy="8" r="6" fill={color} />
					</svg>
					<span>{difficulty}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
