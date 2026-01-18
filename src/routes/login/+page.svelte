<script lang="ts">
  import NavBarLanding from '$lib/components/nav-bar-landing.svelte';
  import Footer from '$lib/components/footer.svelte';
  import { loggedInUser, saveUser } from '$lib/runes.svelte';
  import { apiFetch } from '$lib/api-interceptor';

  let username = '';
  let password = '';
  let errorMessage = '';
  let isLoading = false;

  async function handleLogin() {
    errorMessage = '';
    
    if (!username || !password) {
      errorMessage = 'Please enter both username and password';
      return;
    }

    isLoading = true;

    try {
      const response = await apiFetch('http://localhost:3000/api/users/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        loggedInUser.token = data.token;
        loggedInUser._id = data._id;
        loggedInUser.name = data.name;
        loggedInUser.username = data.username || '';
        loggedInUser.email = data.email || '';
        loggedInUser.isAdmin = Boolean(data.isAdmin);
        
        saveUser();
        window.location.href = '/dashboard';
      } else {
        const data = await response.json();
        errorMessage = data.message || 'Invalid username or password';
      }
    } catch (error) {
      errorMessage = 'An error occurred. Please try again later.';
      console.error('Login error:', error);
    } finally {
      isLoading = false;
    }
  }
</script>

<NavBarLanding />

<section class="hero is-fullheight-with-navbar">
  <div class="hero-body">
    <div class="container">
      <div class="columns is-centered">
        <div class="column is-5-tablet is-4-desktop">
          <div class="box">
            <h1 class="title has-text-centered">Login</h1>
            <p class="subtitle has-text-centered has-text-grey">
              Welcome back to Trail Tracker
            </p>

            {#if errorMessage}
              <div class="notification is-danger is-light">
                <button class="delete" onclick={() => errorMessage = ''}></button>
                {errorMessage}
              </div>
            {/if}

            <form onsubmit={(e) => { e.preventDefault(); handleLogin(); }}>
              <div class="field">
                <label class="label" for="username">Username</label>
                <div class="control has-icons-left">
                  <input
                    id="username"
                    class="input"
                    type="text"
                    placeholder="username"
                    bind:value={username}
                    required
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-user"></i>
                  </span>
                </div>
              </div>

              <div class="field">
                <label class="label" for="password">Password</label>
                <div class="control has-icons-left">
                  <input
                    id="password"
                    class="input"
                    type="password"
                    placeholder="********"
                    bind:value={password}
                    required
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-lock"></i>
                  </span>
                </div>
              </div>

              <div class="field">
                <button
                  class="button is-primary is-fullwidth"
                  class:is-loading={isLoading}
                  type="submit"
                >
                  <strong>Log in</strong>
                </button>
              </div>
            </form>

            <div class="has-text-centered my-3">
              <span class="has-text-grey">or</span>
            </div>

            <div class="field">
              <a
                href="http://localhost:3000/oauth/google"
                class="button is-fullwidth"
                style="background-color: white; border: 1px solid #dadce0; color: #3c4043;"
              >
                <span class="icon">
                  <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fill-rule="evenodd">
                      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </g>
                  </svg>
                </span>
                <span style="margin-left: 10px;">Sign in with Google</span>
              </a>
            </div>

            <hr />

            <div class="has-text-centered">
              <p>
                Don't have an account? <a href="/signup"><strong>Sign up</strong></a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<Footer />
