import { loggedInUser } from './runes.svelte';

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = loggedInUser.token;
  const init: RequestInit = { ...options };
  const headers = new Headers(init.headers as HeadersInit | undefined);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    loggedInUser.token = '';
    loggedInUser._id = '';
    loggedInUser.name = '';
    loggedInUser.email = '';
    loggedInUser.username = '';
    loggedInUser.isAdmin = false;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('loggedInUser');
      window.location.href = '/';
    }
  }

  return response;
}
