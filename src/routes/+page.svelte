<script lang="ts">
  import NavBarLanding from '$lib/components/nav-bar-landing.svelte';
  import Footer from '$lib/components/footer.svelte';
</script>

<NavBarLanding />

<!-- Hero Section -->
<section class="hero is-primary is-medium">
  <div class="hero-body">
    <div class="container has-text-centered">
      <h1 class="title is-1">
        Trail Tracker
      </h1>
      <h2 class="subtitle is-3">
        Discover, explore, and organize your favorite walking trails
      </h2>
      <div class="buttons is-centered mt-5">
        <a href="/signup" class="button is-light is-large">
          <strong>Get Started</strong>
        </a>
      </div>
    </div>
  </div>
</section>

<!-- Features Section -->
<section class="section">
  <div class="container">
    <h2 class="title has-text-centered is-2 mb-6">Features</h2>
    <div class="columns">
      <div class="column">
        <div class="card">
          <div class="card-content has-text-centered">
            <div class="mb-4">
              <span class="icon is-large has-text-primary">
                <i class="fas fa-3x fa-map-marked-alt"></i>
              </span>
            </div>
            <h3 class="title is-4">Discover Trails</h3>
            <p>Explore a vast collection of walking trails from around the world with detailed information and reviews.</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="card">
          <div class="card-content has-text-centered">
            <div class="mb-4">
              <span class="icon is-large has-text-primary">
                <i class="fas fa-3x fa-layer-group"></i>
              </span>
            </div>
            <h3 class="title is-4">Organize Collections</h3>
            <p>Create custom collections to organize your favorite trails by location, difficulty, or personal preference.</p>
          </div>
        </div>
      </div>
      <div class="column">
        <div class="card">
          <div class="card-content has-text-centered">
            <div class="mb-4">
              <span class="icon is-large has-text-primary">
                <i class="fas fa-3x fa-share-alt"></i>
              </span>
            </div>
            <h3 class="title is-4">Share & Connect</h3>
            <p>Share your trail experiences and connect with other hiking enthusiasts in the community.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Call to Action Section -->
<section class="hero is-light">
  <div class="hero-body">
    <div class="container has-text-centered">
      <h2 class="title is-2">Ready to Start Your Adventure?</h2>
      <p class="subtitle is-4 mb-5">Join thousands of trail enthusiasts today</p>
      <a href="/signup" class="button is-primary is-large">
        <strong>Sign Up Now</strong>
      </a>
    </div>
  </div>
</section>

<Footer />
