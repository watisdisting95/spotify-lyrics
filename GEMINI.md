# Spotify Dashboard - Project Overview & Mandates

This document provides context for AI agents and developers working on this project. It highlights architectural decisions and operational details that may not be immediately obvious from the source code.

## 🚀 Core Mandates & Engineering Standards
*   **No Backend Required:** This is a strictly frontend React + Vite (TypeScript) application. All logic, including authentication, resides in the browser.
*   **Official Spotify API Compliance:** All API interactions must follow the [Official Spotify Web API Guidelines](https://developer.spotify.com/documentation/web-api/).
    *   Use **127.0.0.1** instead of `localhost` for local development as per Spotify's latest redirect URI security policies.
    *   Respect the `Retry-After` header for 429 Rate Limit responses.
    *   Implement exponential backoff for 5xx server errors.
*   **Authentication Flow (PKCE):** We use the **OAuth 2.0 Authorization Code Flow with PKCE**.
    *   **NO Client Secret:** Do not attempt to add or use a Client Secret. The PKCE flow is designed to be secure without it on public clients (browsers).
    *   **Token Refresh Lock:** A semaphore (lock) is implemented in `src/SpotifyAPI.ts` to prevent race conditions during concurrent token refresh attempts.
*   **Visual Standard:** Maintain a high-quality, modern, Spotify-inspired dark theme using Tailwind-like CSS variables in `src/index.css`.
*   **PWA Support:** The application is a Progressive Web App (PWA) with a manifest and service worker, making it installable on mobile devices for a full-screen, app-like experience.

## 🛠 Architectural Highlights

### 1. GUI & Layout Engine (Phone Stand Optimized)
*   **Responsive Split Layout:** The UI adapts between portrait (Top/Bottom split) and landscape (Left/Right split) orientations.
*   **Interactive States (Collapsed/Expanded):** 
    *   Clicking the player section toggles between states.
    *   **Collapsed Mode:** Unified single-line track info (Song • Artist) at the top of the screen. Hides all playback controls and the header to maximize lyrics visibility.
    *   **Expanded Mode:** Full player controls, artwork, and progress bar are visible.
*   **Layout Constraints:** In landscape mode, the player section is height-constrained with responsive artwork scaling (`object-contain`) to ensure all controls remain visible without scrolling on mobile screens.

### 2. Playback Interpolation Engine
*   **Mechanism:** To stay within Spotify's rate limits while providing a "smooth" UI, we use a local 100ms ticker (`DashboardView` in `App.tsx`).
*   **Behavior:** The ticker optimistically increments the playback progress based on the last known `is_playing` state and `progress_ms` from the API.
*   **Configuration:** 
    *   `VITE_POLL_INTERVAL_MS`: Controls how often we sync with the real Spotify server (default 5000ms).
    *   `VITE_ENABLE_INTERPOLATION`: Toggles the smooth local updates.

### 3. Synchronized Lyrics (LRCLIB)
*   **Provider:** [LRCLIB](https://lrclib.net/) is used for public, open-access synced lyrics.
*   **Matching:** Lyrics are matched using `track_name`, `artist_name`, `album_name`, and `duration`. Note that LRCLIB requires a duration match within **±2 seconds** for high-confidence results.
*   **Caching:** Parsed `LyricLine` objects are cached in **IndexedDB** using `idb-keyval` to ensure instantaneous loading on subsequent track plays.
*   **Auto-Scroll:** The `LyricsView` component uses a `useEffect` and `scrollIntoView({ behavior: 'smooth', block: 'center' })` to keep the active lyric line centered.

### 4. State Management
*   **Local Storage:** Tokens (`spotify_tokens`) and the PKCE `verifier` are stored in `localStorage`.
*   **IndexedDB:** Lyrics and pre-processed data are stored in IndexedDB for persistence across sessions.

## 🌍 Deployment & CI/CD
*   **Hosting:** GitHub Pages (`https://watisdisting95.github.io/spotify-lyrics/`).
*   **CI/CD:** Automatic deployment via GitHub Actions (`.github/workflows/deploy.yml`).
*   **Routing:** Uses **`HashRouter`** to ensure SPA routing compatibility with GitHub Pages.
*   **OAuth Redirect Handling:** 
    *   Spotify does not support fragments (`#`) in Redirect URIs.
    *   Production Redirect URI: `https://watisdisting95.github.io/spotify-lyrics/`.
    *   The `LoginView` in `App.tsx` contains a `useEffect` to intercept the `?code=` query parameter from the main URL and redirect it to the hash-based callback route (`#/callback?code=...`).

## ⚠️ Known Limitations
*   **Spotify Premium Required:** Playback control commands (Seek, Play/Pause, Skip) are restricted to Spotify Premium users by the official API.
*   **Audio Output:** This app is a **controller only**. It does not output audio. An active Spotify session must be running on another device.

## 🔧 Environment Setup (`.env`)
Required variables:
*   `VITE_SPOTIFY_CLIENT_ID`: Your official Spotify Client ID. (In GitHub, this is stored as an **Actions Secret**).
*   `VITE_REDIRECT_URI`: 
    *   Local: `http://127.0.0.1:5173/callback`
    *   Production: `https://watisdisting95.github.io/spotify-lyrics/`
*   `VITE_POLL_INTERVAL_MS`: Recommended 5000.
*   `VITE_ENABLE_INTERPOLATION`: Recommended true.
