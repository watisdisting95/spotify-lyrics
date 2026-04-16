const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

// Use the built-in BASE_URL from Vite to ensure we always point to the correct callback location.
// This works for both local development (/) and production (/spotify-lyrics/).
const REDIRECT_URI = new URL(import.meta.env.BASE_URL, window.location.origin).href;

console.log('SpotifyAuth: CLIENT_ID present:', !!CLIENT_ID);
console.log('SpotifyAuth: REDIRECT_URI:', REDIRECT_URI);



export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
}

export const generateCodeVerifier = (length: number): string => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const generateCodeChallenge = async (codeVerifier: string): Promise<string> => {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const redirectToAuthCodeFlow = async () => {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem('verifier', verifier);

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('response_type', 'code');
  params.append('redirect_uri', REDIRECT_URI);
  params.append('scope', 'user-read-playback-state user-modify-playback-state user-read-currently-playing');
  params.append('code_challenge_method', 'S256');
  params.append('code_challenge', challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getAccessToken = async (code: string): Promise<SpotifyTokens> => {
  const verifier = localStorage.getItem('verifier');
  console.log('getAccessToken: Using verifier:', !!verifier);

  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);
  params.append('code_verifier', verifier!);

  console.log('getAccessToken: Requesting token with redirect_uri:', REDIRECT_URI);

  const result = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!result.ok) {
    const errorBody = await result.json().catch(() => ({}));
    console.error('getAccessToken: Result not OK:', result.status, errorBody);
    throw new Error(errorBody.error_description || 'Failed to exchange code for token');
  }

  const tokens = await result.json();
  const expires_at = Date.now() + tokens.expires_in * 1000;
  return { ...tokens, expires_at };
};

export const refreshAccessToken = async (refreshToken: string): Promise<SpotifyTokens> => {
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const result = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!result.ok) {
    const error = await result.json();
    console.error('Failed to refresh access token', error);
    throw new Error(error.error_description || 'Failed to refresh token');
  }

  const tokens = await result.json();
  const expires_at = Date.now() + tokens.expires_in * 1000;
  return { ...tokens, expires_at };
};

export const saveTokens = (tokens: SpotifyTokens) => {
  localStorage.setItem('spotify_tokens', JSON.stringify(tokens));
};

export const getSavedTokens = (): SpotifyTokens | null => {
  const tokens = localStorage.getItem('spotify_tokens');
  try {
    return tokens ? JSON.parse(tokens) : null;
  } catch (e) {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('spotify_tokens');
  localStorage.removeItem('verifier');
  // Use relative path to base for logout redirection
  const base = import.meta.env.BASE_URL;
  window.location.href = base;
};
