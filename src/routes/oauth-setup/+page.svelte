<script lang="ts">
  import NavBarLanding from '$lib/components/nav-bar-landing.svelte';
  import Footer from '$lib/components/footer.svelte';
  import { onMount } from 'svelte';
  import { loggedInUser, saveUser } from '$lib/runes.svelte';
  import { apiFetch } from '$lib/api-interceptor';

  let username = '';
  let errorMessage = '';
  let isLoading = false;
  let successMessage = '';
  let token = '';
  let name = '';
  let email = '';
  let id = '';

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    token = urlParams.get('token') || '';
    name = urlParams.get('name') || '';
    email = urlParams.get('email') || '';
    id = urlParams.get('id') || '';

    if (!token) {
      window.location.href = '/login';
    }
  });

  async function handleSetUsername() {
    errorMessage = '';
    successMessage = '';
    
    if (!username || username.trim() === '') {
      errorMessage = 'Bitte gib einen Username ein';
      return;
    }

    isLoading = true;

    try {
      const response = await apiFetch('http://localhost:3000/api/users/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        const data = await response.json();
        successMessage = 'Username gespeichert!';
        loggedInUser.token = token;
        loggedInUser._id = id || '';
        loggedInUser.name = name || '';
        loggedInUser.username = username;
        loggedInUser.email = email || '';
        saveUser();

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        const data = await response.json();
        errorMessage = data.error || 'Fehler beim Speichern des Usernames';
      }
    } catch (error) {
      errorMessage = 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.';
      console.error('Error:', error);
    } finally {
      isLoading = false;
    }
  }

  function skipUsername() {
    loggedInUser.token = token || '';
    loggedInUser._id = id || '';
    loggedInUser.name = name || '';
    loggedInUser.username = email?.split('@')[0] || '';
    loggedInUser.email = email || '';
    saveUser();
    window.location.href = '/dashboard';
  }
</script>

<NavBarLanding />

<section class="hero is-fullheight-with-navbar">
  <div class="hero-body">
    <div class="container">
      <div class="columns is-centered">
        <div class="column is-5-tablet is-4-desktop">
          <div class="box">
            <h1 class="title has-text-centered">Welcome!</h1>
            <p class="subtitle has-text-centered has-text-grey">
              Choose your username
            </p>

            {#if errorMessage}
              <div class="notification is-danger is-light">
                <button class="delete" onclick={() => errorMessage = ''}></button>
                {errorMessage}
              </div>
            {/if}

            {#if successMessage}
              <div class="notification is-success is-light">
                {successMessage}
              </div>
            {/if}

            <form onsubmit={(e) => { e.preventDefault(); handleSetUsername(); }}>
              <div class="field">
                <label class="label" for="username">Username</label>
                <div class="control has-icons-left">
                  <input
                    id="username"
                    class="input"
                    type="text"
                    placeholder="z.B. abenteurer_21"
                    bind:value={username}
                    required
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-user"></i>
                  </span>
                </div>
                <p class="help">3-30 characters, letters, numbers, and ._- only</p>
              </div>

              <div class="field">
                <button
                  class="button is-primary is-fullwidth"
                  class:is-loading={isLoading}
                  type="submit"
                >
                  <strong>Save Username</strong>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<Footer />
