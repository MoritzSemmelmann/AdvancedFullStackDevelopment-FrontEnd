<script lang="ts">
  import NavBarLanding from '$lib/components/nav-bar-landing.svelte';
  import Footer from '$lib/components/footer.svelte';
  import { loggedInUser } from '$lib/auth.svelte';

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
      const response = await fetch('http://localhost:3000/api/users/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data._id);
        localStorage.setItem('userName', data.name);
        
        loggedInUser.token = data.token;
        loggedInUser._id = data._id;
        loggedInUser.name = data.name;
        
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
