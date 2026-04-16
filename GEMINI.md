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
*   **Dynamic Visual Standard:** The application features a fully adaptive, high-contrast theme that automatically generates colors from the current album artwork.
*   **PWA Support:** The application is a Progressive Web App (PWA) with a manifest and service worker, making it installable on mobile devices for a full-screen, app-like experience. (Note: Service worker registration is restricted to production mode to avoid development server conflicts).

## 🛠 Architectural Highlights

### 1. GUI & Layout Engine (Phone Stand Optimized)
*   **Responsive Split Layout:** The UI adapts between portrait (Top/Bottom split) and landscape (Left/Right split) orientations.
*   **Interactive States (Collapsed/Expanded):** 
    *   Clicking the player section toggles between states.
    *   **Collapsed Mode:** Unified single-line track info (Song • Artist) at the top of the screen. Hides all playback controls and the header to maximize lyrics visibility.
*   **Adaptive Theming (HSL Color Theory):** 
    *   Dominant color extraction using `fast-average-color`.
    *   Monochromatic contrast derivation: Converts RGB to HSL and generates light/dark tints or shades for text and UI elements based on the background's luminosity.
    *   Ensures 100% legibility across all album artwork types.
*   **Artwork Modal:** High-resolution expanded view of the album artwork accessible via tap, featuring integrated song information.

### 2. Playback Interpolation Engine
*   **Mechanism:** To stay within Spotify's rate limits while providing a "smooth" UI, we use a local 100ms ticker (`DashboardView` in `App.tsx`).
*   **Behavior:** The ticker optimistically increments the playback progress based on the last known `is_playing` state and `progress_ms` from the API.

### 3. Synchronized Lyrics (LRCLIB)
*   **Provider:** [LRCLIB](https://lrclib.net/) is used for public, open-access synced lyrics.
*   **Matching:** Lyrics are matched using `track_name`, `artist_name`, `album_name`, and `duration`. Note that LRCLIB requires a duration match within **±2 seconds** for high-confidence results.
*   **Compact Display:** Optimized line spacing and opacity-based focus (current line at 100% opacity, inactive lines at 30% opacity) for enhanced readability.
*   **Loading Feedback:** Integrated loading spinner (`Loader2`) for visual feedback during lyric fetching.

### 4. State Management
*   **Local Storage:** Tokens (`spotify_tokens`) and the PKCE `verifier` are stored in `localStorage`.
*   **IndexedDB:** Lyrics and pre-processed data are stored in IndexedDB for persistence across sessions.

## 🌍 Deployment & CI/CD
*   **Hosting:** GitHub Pages (`https://watisdisting95.github.io/spotify-lyrics/`).
*   **CI/CD:** Automatic deployment via GitHub Actions (`.github/workflows/deploy.yml`).
*   **Routing:** Uses **`HashRouter`** to ensure SPA routing compatibility with GitHub Pages.

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
