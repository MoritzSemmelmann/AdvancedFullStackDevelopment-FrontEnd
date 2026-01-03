<script lang="ts">
  let isMenuActive = false;

  function toggleMenu() {
    isMenuActive = !isMenuActive;
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = '/';
  }
</script>

<nav class="navbar is-white">
  <div class="navbar-brand">
    <div class="navbar-item">
      <strong class="has-text-primary title is-4">Trail Tracker</strong>
    </div>

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
        <button class="button is-light" onclick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  </div>
</nav>
