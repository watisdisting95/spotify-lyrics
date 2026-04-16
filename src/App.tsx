import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { redirectToAuthCodeFlow, getAccessToken, saveTokens, getSavedTokens } from './SpotifyAuth';
import { useSpotifyPlayback } from './hooks/useSpotifyPlayback';
import { Header } from './components/Header';
import { PlayerControls } from './components/PlayerControls';
import { ProgressBar } from './components/ProgressBar';
import { LyricsView } from './components/LyricsView';
import { NoPlaybackView } from './components/NoPlaybackView';
import './App.css';

function App() {
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
    if (code) {
      getAccessToken(code)
        .then((tokens) => {
          saveTokens(tokens);
          navigate('/dashboard');
        })
        .catch((err) => {
          console.error(err);
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
    currentLyricIndex,
    handleSeek,
    handleTogglePlay,
    handleSkip,
  } = useSpotifyPlayback();

  const [showLyrics, setShowLyrics] = useState(false);

  if (loading) return <div className="loading">Connecting to Spotify...</div>;

  if (!playback || !playback.item) {
    return <NoPlaybackView />;
  }

  const { item, is_playing } = playback;
  const { album, name, artists, duration_ms } = item;

  return (
    <div className={`dashboard-container ${showLyrics ? 'show-lyrics' : ''}`}>
      <Header />

      <div className="dashboard-content">
        <div className="player-section">
          <div className="player-card">
            <div className="artwork-container">
              <img src={album.images[0]?.url} alt={album.name} className="artwork" />
            </div>
            
            <div className="track-info">
              <h2 className="track-name">{name}</h2>
              <p className="artist-name">{artists.map((a: any) => a.name).join(', ')}</p>
            </div>

            <PlayerControls 
              isPlaying={is_playing} 
              onTogglePlay={handleTogglePlay} 
              onSkip={handleSkip} 
            />

            <ProgressBar 
              progressMs={displayProgress} 
              durationMs={duration_ms} 
              onSeek={handleSeek} 
            />
          </div>
          <p className="premium-note">Playback control requires Spotify Premium.</p>
          
          <button 
            className="lyrics-toggle" 
            onClick={() => setShowLyrics(!showLyrics)}
          >
            {showLyrics ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
          </button>
        </div>

        <LyricsView 
          lyrics={lyrics} 
          currentLyricIndex={currentLyricIndex} 
          onLyricClick={handleSeek}
        />
      </div>
    </div>
  );
}

export default App;

