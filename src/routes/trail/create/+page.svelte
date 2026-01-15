<script lang="ts">
	import NavBar from '$lib/components/nav-bar.svelte';
	import Footer from '$lib/components/footer.svelte';
	import { onMount } from 'svelte';

	let name = '';
	let lengthInKm = '';
	let description = '';
	let difficulty = '';
	let latitude = '';
	let longitude = '';
	let selectedCategories: string[] = [];
	let imageFiles: FileList | null = null;
	let fileNames: string[] = [];
	let errorMessage = '';
	let isLoading = false;
	let categories: any[] = [];

	onMount(async () => {
		await loadCategories();
	});

	async function loadCategories() {
		try {
			const response = await fetch('http://localhost:3000/api/categories/all');
			if (response.ok) {
				categories = await response.json();
			} else {
				console.error('Failed to load categories');
			}
		} catch (error) {
			console.error('Error loading categories:', error);
		}
	}

	function toggleCategory(categoryValue: string) {
		if (selectedCategories.includes(categoryValue)) {
			selectedCategories = selectedCategories.filter((c) => c !== categoryValue);
		} else {
			selectedCategories = [...selectedCategories, categoryValue];
		}
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			imageFiles = target.files;
			fileNames = Array.from(target.files).map(file => file.name);
		} else {
			imageFiles = null;
			fileNames = [];
		}
	}

	async function uploadImages(): Promise<string[]> {
		if (!imageFiles || imageFiles.length === 0) {
			return [];
		}

		const token = localStorage.getItem('token');
		if (!token) {
			return [];
		}

		try {
			const formData = new FormData();
			for (let i = 0; i < imageFiles.length; i++) {
				formData.append(`image${i}`, imageFiles[i]);
			}

			const response = await fetch('http://localhost:3000/api/images/upload', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			if (response.ok) {
				const data = await response.json();
				return data.urls || [];
			} else {
				console.error('Failed to upload images');
				return [];
			}
		} catch (error) {
			console.error('Error uploading images:', error);
			return [];
		}
	}

	async function handleSubmit() {
		errorMessage = '';

		if (!name || !lengthInKm || !description || !difficulty || !latitude || !longitude) {
			errorMessage = 'Please fill in all required fields';
			return;
		}

		const token = localStorage.getItem('token');
		const userId = localStorage.getItem('userId');

		if (!token || !userId) {
			window.location.href = '/login';
			return;
		}

		isLoading = true;

		try {
			const imageUrls = await uploadImages();

			const response = await fetch(`http://localhost:3000/api/trails/create/${userId}`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name,
					lengthInKm: parseFloat(lengthInKm),
					description,
					difficulty,
					latitude: parseFloat(latitude),
					longitude: parseFloat(longitude),
					categories: selectedCategories,
					images: imageUrls
				})
			});

			if (response.ok) {
				window.location.href = '/dashboard';
			} else {
				const data = await response.json();
				errorMessage = data.message || 'Failed to create trail';
			}
		} catch (error) {
			errorMessage = 'An error occurred while creating the trail';
			console.error('Error creating trail:', error);
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
						<h1 class="title is-3 has-text-centered">Create Walking Trail</h1>
						<p class="subtitle is-6 has-text-centered mb-5">Add a new trail to your collection.</p>

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
											<span class="icon is-small is-left"><i class="fas fa-signature"></i></span>
										</div>
									</div>
								</div>
								<div class="column is-half">
									<div class="field">
										<label class="label" for="lengthInKm">Length (km)</label>
										<div class="control has-icons-left">
											<input
												class="input is-medium"
												id="lengthInKm"
												bind:value={lengthInKm}
												type="number"
												step="0.1"
												min="0"
												required
											/>
											<span class="icon is-small is-left"><i class="fas fa-ruler"></i></span>
										</div>
									</div>
								</div>
							</div>

							<div class="field">
								<label class="label">Categories</label>
								<div class="columns is-multiline is-variable is-2" style="max-height: 260px; overflow-y: auto;">
									{#each categories as category}
										<div class="column is-one-third is-flex">
											<label
												class="box is-flex is-flex-direction-column is-flex-grow-1 is-clickable {selectedCategories.includes(
													category.value
												)
													? 'has-background-primary has-text-white'
													: 'has-background-white has-text-grey-darker'}"
											>
												<div class="is-flex is-align-items-center mb-3">
													<span class="icon is-medium mr-3"><i class={category.icon}></i></span>
													<span class="is-size-6 has-text-weight-semibold">{category.title}</span>
												</div>
												<p class="is-size-7 has-text-left is-flex-grow-1">{category.description}</p>
												<div class="mt-3">
													<input
														type="checkbox"
														class="checkbox"
														checked={selectedCategories.includes(category.value)}
														onchange={() => toggleCategory(category.value)}
													/>
												</div>
											</label>
										</div>
									{/each}
								</div>
							</div>

							<div class="field">
								<label class="label" for="description">Description</label>
								<div class="control">
									<textarea
										class="textarea is-medium"
										id="description"
										bind:value={description}
										rows="3"
										placeholder="Short overview of the trail"
										required
									></textarea>
								</div>
							</div>

							<div class="columns is-variable is-4">
								<div class="column is-one-third">
									<div class="field">
										<label class="label" for="difficulty">Difficulty</label>
										<div class="control has-icons-left">
											<div class="select is-medium is-fullwidth">
												<select id="difficulty" bind:value={difficulty} required>
													<option value="" disabled selected>Select difficulty</option>
													<option>Easy</option>
													<option>Moderate</option>
													<option>Hard</option>
												</select>
											</div>
											<span class="icon is-small is-left"><i class="fas fa-mountain"></i></span>
										</div>
									</div>
								</div>
								<div class="column">
									<div class="field">
										<label class="label" for="latitude">Latitude</label>
										<div class="control has-icons-left">
											<input
												class="input is-medium"
												id="latitude"
												bind:value={latitude}
												type="number"
												step="0.000001"
												required
											/>
											<span class="icon is-small is-left"
												><i class="fas fa-location-arrow"></i></span
											>
										</div>
									</div>
								</div>
								<div class="column">
									<div class="field">
										<label class="label" for="longitude">Longitude</label>
										<div class="control has-icons-left">
											<input
												class="input is-medium"
												id="longitude"
												bind:value={longitude}
												type="number"
												step="0.000001"
												required
											/>
											<span class="icon is-small is-left"
												><i class="fas fa-location-arrow"></i></span
											>
										</div>
									</div>
								</div>
							</div>

							<div class="field">
								<label class="label">Trail Images (Optional)</label>
								<div class="file has-name is-fullwidth is-boxed">
									<label class="file-label">
										<input
											class="file-input"
											type="file"
											accept="image/*"
											multiple
											onchange={handleFileChange}
										/>
										<span class="file-cta">
											<span class="file-icon">
												<i class="fas fa-upload"></i>
											</span>
											<span class="file-label">Choose images…</span>
										</span>
										<span class="file-name">
											{#if fileNames.length > 0}
												{fileNames.length} file{fileNames.length > 1 ? 's' : ''} selected
											{:else}
												No files selected
											{/if}
										</span>
									</label>
								</div>
								{#if fileNames.length > 0}
									<div class="content mt-3">
										<p class="help has-text-grey">Selected files:</p>
										<div class="tags">
											{#each fileNames as name}
												<span class="tag is-info is-light">{name}</span>
											{/each}
										</div>
									</div>
								{/if}
							</div>

							<div class="field is-grouped is-grouped-right">
								<p class="control is-expanded">
									<button
										class="button is-primary is-fullwidth is-medium"
										class:is-loading={isLoading}
										type="submit"
									>
										<span class="icon"><i class="fas fa-plus"></i></span>
										<span>Create Trail</span>
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
