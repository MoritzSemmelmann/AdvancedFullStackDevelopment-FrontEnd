<script lang="ts">
  import { clearSession, loggedInUser } from '$lib/runes.svelte';

  let isMenuActive = false;

  function toggleMenu() {
    isMenuActive = !isMenuActive;
  }

  function handleLogout() {
    clearSession();
    window.location.href = '/';
  }

  function isActive(path: string): boolean {
    if (typeof window !== 'undefined') {
      return window.location.pathname === path || window.location.pathname.startsWith(path + '/');
    }
    return false;
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

<div class="tabs is-boxed">
  <div class="container">
    <ul>
      <li class:is-active={isActive('/dashboard')}>
        <a href="/dashboard" class:has-text-primary={isActive('/dashboard')}>
          <span class="icon is-small"><i class="fas fa-home"></i></span>
          <span>Dashboard</span>
        </a>
      </li>
      <li class:is-active={isActive('/statistics')}>
        <a href="/statistics" class:has-text-primary={isActive('/statistics')}>
          <span class="icon is-small"><i class="fas fa-chart-bar"></i></span>
          <span>Statistics</span>
        </a>
      </li>
      <li class:is-active={isActive('/map')}>
        <a href="/map" class:has-text-primary={isActive('/map')}>
          <span class="icon is-small"><i class="fas fa-map"></i></span>
          <span>Map</span>
        </a>
      </li>
      {#if loggedInUser.isAdmin}
        <li class:is-active={isActive('/admin/users')}>
          <a href="/admin/users" class:has-text-primary={isActive('/admin/users')}>
            <span class="icon is-small"><i class="fas fa-users"></i></span>
            <span>Users</span>
          </a>
        </li>
      {/if}
    </ul>
  </div>
</div>
