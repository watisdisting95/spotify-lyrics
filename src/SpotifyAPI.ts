import { getSavedTokens, refreshAccessToken, saveTokens, logout } from './SpotifyAuth';

const BASE_URL = 'https://api.spotify.com/v1';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Semaphore to prevent multiple concurrent token refreshes
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
  let tokens = getSavedTokens();

  if (!tokens) {
    console.warn('No tokens found, redirecting to login.');
    window.location.href = '/';
    return;
  }

  // Check if token needs refresh (within 1 minute of expiration)
  if (Date.now() + 60000 >= tokens.expires_at) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken(tokens.refresh_token)
        .then((newTokens) => {
          if (!newTokens.refresh_token) {
            newTokens.refresh_token = tokens!.refresh_token;
          }
          saveTokens(newTokens);
          return newTokens;
        })
        .catch((error) => {
          console.error('Token refresh failed', error);
          logout();
          throw error;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
    }
    
    // Wait for the ongoing refresh if there is one
    if (refreshPromise) {
      tokens = await refreshPromise;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${tokens!.access_token}`,
    },
  });

  // Handle Rate Limiting (429)
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
    console.warn(`Rate limited. Retrying after ${waitTime}ms`);
    await sleep(waitTime);
    return fetchWithAuth(endpoint, options, retryCount);
  }

  // Handle Server Errors (5xx) with Exponential Backoff
  if (response.status >= 500 && retryCount < 3) {
    const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
    console.warn(`Server error ${response.status}. Retrying in ${Math.round(waitTime)}ms...`);
    await sleep(waitTime);
    return fetchWithAuth(endpoint, options, retryCount + 1);
  }

  // Only logout on 401 if it's truly an auth issue
  if (response.status === 401) {
    console.error('401 Unauthorized - Token might be invalid');
    logout();
    throw new Error('Unauthorized');
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error(`API Error: ${response.status}`, errorData);
    throw new Error(errorData.error?.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const getPlaybackState = async () => {
  return fetchWithAuth('/me/player');
};

export const seekPosition = async (positionMs: number) => {
  return fetchWithAuth(`/me/player/seek?position_ms=${positionMs}`, {
    method: 'PUT',
  });
};

export const togglePlayPause = async (isPlaying: boolean) => {
  const endpoint = isPlaying ? '/me/player/pause' : '/me/player/play';
  return fetchWithAuth(endpoint, {
    method: 'PUT',
  });
};

export const skipToNext = async () => {
  return fetchWithAuth('/me/player/next', {
    method: 'POST',
  });
};

export const skipToPrevious = async () => {
  return fetchWithAuth('/me/player/previous', {
    method: 'POST',
  });
};
