import { loggedInUser } from './runes.svelte';

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const token = loggedInUser.token;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    loggedInUser.token = '';
    loggedInUser._id = '';
    loggedInUser.name = '';
    loggedInUser.email = '';
    loggedInUser.username = '';
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  return response;
}
