<script lang="ts">
  import NavBar from '$lib/components/nav-bar.svelte';
  import Footer from '$lib/components/footer.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { apiFetch } from '$lib/api-interceptor';
  import { loggedInUser } from '$lib/runes.svelte';

  type UserRow = {
    _id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    isAdmin?: boolean;
  };

  let users: UserRow[] = [];
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

  onMount(() => {
    if (!loggedInUser.token) {
      goto('/login');
      return;
    }

    if (!loggedInUser.isAdmin) {
      goto('/dashboard');
      return;
    }

    void loadUsers();
  });

  async function loadUsers() {
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    try {
      const response = await apiFetch('http://localhost:3000/api/users/all');
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload) {
        throw new Error((payload as { message?: string } | null)?.message || 'Failed to load users');
      }

      users = (payload as UserRow[]).filter((user) => !user.isAdmin);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to load users';
    } finally {
      isLoading = false;
    }
  }

  async function handleDelete(userId: string) {
    const target = users.find((user) => user._id === userId);
    const label = target?.username || target?.email || 'this user';

    if (!window.confirm(`Delete ${label}?`)) {
      return;
    }

    errorMessage = '';
    successMessage = '';

    try {
      const response = await apiFetch(`http://localhost:3000/api/users/delete/${userId}`, {
        method: 'DELETE',
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error((payload as { message?: string } | null)?.message || 'Failed to delete user');
      }

      users = users.filter((user) => user._id !== userId);
      successMessage = 'User deleted successfully';
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
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
            <div>
              <p class="title is-3 has-text-primary">Manage Users</p>
            </div>
          </div>
        </div>
        <div class="level-right">
          <div class="level-item">
            <button class="button is-light" onclick={loadUsers} disabled={isLoading}>
              <span class="icon"><i class="fas fa-sync"></i></span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {#if errorMessage}
        <div class="notification is-danger is-light">
          <button class="delete" onclick={() => (errorMessage = '')}></button>
          {errorMessage}
        </div>
      {/if}

      {#if successMessage}
        <div class="notification is-success is-light">
          <button class="delete" onclick={() => (successMessage = '')}></button>
          {successMessage}
        </div>
      {/if}

      <div class="box" style="overflow-x: auto;">
        {#if isLoading}
          <div class="has-text-centered py-6">
            <span class="icon is-large"><i class="fas fa-circle-notch fa-spin fa-2x"></i></span>
            <p class="has-text-grey mt-3">Loading users...</p>
          </div>
        {:else if users.length === 0}
          <div class="notification is-info is-light">
            No non-admin users found yet.
          </div>
        {:else}
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th>Username</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th class="has-text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr>
                  <td>{user.username || '—'}</td>
                  <td>{user.firstName || '—'}</td>
                  <td>{user.lastName || '—'}</td>
                  <td>{user.email || '—'}</td>
                  <td class="has-text-right">
                    <button class="button is-danger is-small" onclick={() => handleDelete(user._id)}>
                      <span class="icon is-small"><i class="fas fa-trash"></i></span>
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  </section>

  <Footer />
</div>
