<script lang="ts">
  let isMenuActive = false;

  function toggleMenu() {
    isMenuActive = !isMenuActive;
  }
</script>

<nav class="navbar is-white" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <a class="navbar-item" href="/">
      <strong class="has-text-primary title is-4">Trail Tracker</strong>
    </a>

    <button
      class="navbar-burger"
      class:is-active={isMenuActive}
      aria-label="menu"
      aria-expanded={isMenuActive}
      onclick={toggleMenu}
    >
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </button>
  </div>

  <div class="navbar-menu" class:is-active={isMenuActive}>
    
    <div class="navbar-end">
      <div class="navbar-item">
        <div class="buttons">
          <a class="button is-light" href="/signup">
            <strong>Sign up</strong>
          </a>
          <a class="button is-primary" href="/login">
            Log in
          </a>
        </div>
      </div>
    </div>
  </div>
</nav>
