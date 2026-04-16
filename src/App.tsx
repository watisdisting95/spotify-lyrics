import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { redirectToAuthCodeFlow, getAccessToken, saveTokens, getSavedTokens } from './SpotifyAuth';
import { useSpotifyPlayback } from './hooks/useSpotifyPlayback';
import { useAlbumColor } from './hooks/useAlbumColor';
import { Header } from './components/Header';
import { PlayerControls } from './components/PlayerControls';
import { ProgressBar } from './components/ProgressBar';
import { LyricsView } from './components/LyricsView';
import { NoPlaybackView } from './components/NoPlaybackView';

function App() {
// ... (rest of App component)
  return (
    <Routes>
      <Route path="/" element={<LoginView />} />
      <Route path="/callback" element={<CallbackView />} />
      <Route path="/dashboard" element={<DashboardView />} />
    </Routes>
  );
}

function LoginView() {
  const tokens = getSavedTokens();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for Spotify auth code in the main window URL (before the #)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('LoginView: Found code in URL, redirecting to callback hash route');
      // Clean up the URL and move the code to the hash route, but reset the path to root
      window.history.replaceState({}, document.title, import.meta.env.BASE_URL);
      navigate(`/callback?code=${code}`);
      return;
    }

    if (tokens) {
      navigate('/dashboard');
    }
  }, [tokens, navigate]);

  return (
    <div className="login-container">
      <h1>Spotify Dashboard</h1>
      <p>Control your music from anywhere.</p>
      <button className="login-button" onClick={redirectToAuthCodeFlow}>
        Log in with Spotify
      </button>
    </div>
  );
}

function CallbackView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('CallbackView: Code present:', !!code);
    if (code) {
      getAccessToken(code)
        .then((tokens) => {
          console.log('CallbackView: Token exchange success');
          saveTokens(tokens);
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error('CallbackView: Token exchange error:', err);
          setError('Failed to login. Please try again.');
        });
    }
  }, [code, navigate]);

  if (error) return <div className="error">{error}</div>;
  return <div className="loading">Logging you in...</div>;
}

function DashboardView() {
  const {
    playback,
    displayProgress,
    lyrics,
    loading,
    lyricsLoading,
    currentLyricIndex,
    handleSeek,
    handleTogglePlay,
    handleSkip,
  } = useSpotifyPlayback();

  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [isArtworkExpanded, setIsArtworkExpanded] = useState(false);

  const albumImageUrl = playback?.item?.album?.images[0]?.url;
  const { dominant, light } = useAlbumColor(albumImageUrl);

  if (loading) return <div className="loading">Connecting to Spotify...</div>;

  if (!playback || !playback.item) {
    return <NoPlaybackView />;
  }

  const { item, is_playing } = playback;
  const { album, name, artists, duration_ms } = item;

  const toggleCollapse = (e: React.MouseEvent) => {
    // Prevent collapsing if clicking on the artwork itself
    if ((e.target as HTMLElement).closest('.artwork-container')) return;
    setIsPlayerMinimized(!isPlayerMinimized);
  };

  const toggleArtwork = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsArtworkExpanded(!isArtworkExpanded);
  };

  return (
    <div 
      className={`dashboard-container ${isPlayerMinimized ? 'player-minimized' : ''}`}
      style={{ 
        '--album-rgb': `${dominant[0]}, ${dominant[1]}, ${dominant[2]}`,
        '--accent-rgb': `${light[0]}, ${light[1]}, ${light[2]}`
      } as React.CSSProperties}
    >
      {!isPlayerMinimized && <Header />}
      
      <div className="dashboard-layout">
        <div 
          className="player-section" 
          onClick={toggleCollapse}
          style={{ cursor: 'pointer' }}
        >
          {!isPlayerMinimized && (
            <div className="artwork-container" onClick={toggleArtwork}>
              <img src={album.images[0]?.url} alt={album.name} className="artwork" />
            </div>
          )}
          
          <div className="track-info">
            <h2 className="track-name">{name}</h2>
            <p className="artist-name">
              <span className="min-separator"> • </span>
              {artists.map((a: any) => a.name).join(', ')}
            </p>
          </div>

          <div className="player-controls-wrapper" onClick={(e) => e.stopPropagation()}>
            <PlayerControls 
              isPlaying={is_playing} 
              onTogglePlay={handleTogglePlay} 
              onSkip={handleSkip}
              hideNavigation={isPlayerMinimized}
              hidePlayPause={isPlayerMinimized}
            />

            <ProgressBar 
              progressMs={displayProgress} 
              durationMs={duration_ms} 
              onSeek={handleSeek} 
            />
          </div>
        </div>

        <div className="lyrics-section">
          <LyricsView 
            lyrics={lyrics} 
            lyricsLoading={lyricsLoading}
            currentLyricIndex={currentLyricIndex} 
            onLyricClick={handleSeek}
          />
        </div>
      </div>

      {isArtworkExpanded && (
        <div className="artwork-modal" onClick={() => setIsArtworkExpanded(false)}>
          <div className="artwork-modal-content">
            <img src={album.images[0]?.url} alt={album.name} />
            <div className="artwork-modal-info">
              <h2 className="modal-track-name">{name}</h2>
              <p className="modal-artist-name">{artists.map((a: any) => a.name).join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

