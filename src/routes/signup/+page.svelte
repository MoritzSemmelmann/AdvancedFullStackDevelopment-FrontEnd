<script lang="ts">
  import NavBarLanding from '$lib/components/nav-bar-landing.svelte';
  import Footer from '$lib/components/footer.svelte';
  import { loggedInUser, saveUser } from '$lib/runes.svelte';

  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let firstName = '';
  let lastName = '';
  let errorMessage = '';
  let isLoading = false;

  async function handleSignup() {
    errorMessage = '';
    
    if (!username || !email || !password || !confirmPassword || !firstName || !lastName) {
      errorMessage = 'Please fill in all fields';
      return;
    }

    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match';
      return;
    }

    isLoading = true;

    try {
      const response = await fetch('http://localhost:3000/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          firstName,
          lastName,
          isAdmin: false
        }),
      });

      if (response.ok) {
        const loginResponse = await fetch('http://localhost:3000/api/users/authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        if (loginResponse.ok) {
          const data = await loginResponse.json();
          loggedInUser.token = data.token;
          loggedInUser._id = data._id;
          loggedInUser.name = data.name;
          loggedInUser.username = data.username || username;
          loggedInUser.email = data.email || email;
          
          saveUser();
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/login';
        }
      } else {
        const data = await response.json();
        errorMessage = data.message || 'Registration failed. Please try again.';
      }
    } catch (error) {
      errorMessage = 'An error occurred. Please try again later.';
      console.error('Signup error:', error);
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
            <h1 class="title has-text-centered">Sign Up</h1>
            <p class="subtitle has-text-centered has-text-grey">
              Create your Trail Tracker account
            </p>

            {#if errorMessage}
              <div class="notification is-danger is-light">
                <button class="delete" onclick={() => errorMessage = ''}></button>
                {errorMessage}
              </div>
            {/if}

            <form onsubmit={(e) => { e.preventDefault(); handleSignup(); }}>
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
                <label class="label" for="email">Email</label>
                <div class="control has-icons-left">
                  <input
                    id="email"
                    class="input"
                    type="email"
                    placeholder="your@email.com"
                    bind:value={email}
                    required
                  />
                  <span class="icon is-small is-left">
                    <i class="fas fa-envelope"></i>
                  </span>
                </div>
              </div>

              <div class="columns">
                <div class="column">
                  <div class="field">
                    <label class="label" for="firstName">First Name</label>
                    <div class="control">
                      <input
                        id="firstName"
                        class="input"
                        type="text"
                        placeholder="First Name"
                        bind:value={firstName}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div class="column">
                  <div class="field">
                    <label class="label" for="lastName">Last Name</label>
                    <div class="control">
                      <input
                        id="lastName"
                        class="input"
                        type="text"
                        placeholder="Last Name"
                        bind:value={lastName}
                        required
                      />
                    </div>
                  </div>
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
                <label class="label" for="confirmPassword">Confirm Password</label>
                <div class="control has-icons-left">
                  <input
                    id="confirmPassword"
                    class="input"
                    type="password"
                    placeholder="********"
                    bind:value={confirmPassword}
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
                  <strong>Sign Up</strong>
                </button>
              </div>
            </form>

            <hr />

            <div class="has-text-centered">
              <p>
                Already have an account? <a href="/login"><strong>Log in</strong></a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<Footer />
