import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlaybackState, seekPosition, togglePlayPause, skipToNext, skipToPrevious } from '../SpotifyAPI';
import { fetchLyrics, type LyricLine } from '../LyricsService';
import { getSavedTokens } from '../SpotifyAuth';

const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 5000;
const ENABLE_INTERPOLATION = import.meta.env.VITE_ENABLE_INTERPOLATION === 'true';

export function useSpotifyPlayback() {
  const [playback, setPlayback] = useState<any>(null);
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const navigate = useNavigate();
  
  const pollTimerRef = useRef<number | null>(null);
  const interpolationTimerRef = useRef<number | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);

  const fetchPlayback = async () => {
    try {
      const data = await getPlaybackState();
      setPlayback(data);
      if (data && data.progress_ms !== undefined) {
        setDisplayProgress(data.progress_ms);
      }
      setLoading(false);

      // Check for new track and fetch lyrics
      if (data?.item?.id && data.item.id !== currentTrackIdRef.current) {
        currentTrackIdRef.current = data.item.id;
        setLyrics(null);
        setLyricsLoading(true);
        try {
          const fetchedLyrics = await fetchLyrics(
            data.item.name,
            data.item.artists[0].name,
            data.item.album.name,
            Math.floor(data.item.duration_ms / 1000)
          );
          setLyrics(fetchedLyrics);
        } finally {
          setLyricsLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        navigate('/');
      }
    }
  };

  useEffect(() => {
    const tokens = getSavedTokens();
    if (!tokens) {
      navigate('/');
      return;
    }

    fetchPlayback();
    pollTimerRef.current = window.setInterval(fetchPlayback, POLL_INTERVAL);

    if (ENABLE_INTERPOLATION) {
      interpolationTimerRef.current = window.setInterval(() => {
        setPlayback((currentPlayback: any) => {
          if (currentPlayback && currentPlayback.is_playing && currentPlayback.item) {
            const nextProgress = currentPlayback.progress_ms + 100;
            if (nextProgress <= currentPlayback.item.duration_ms) {
              const updated = { ...currentPlayback, progress_ms: nextProgress };
              setDisplayProgress(nextProgress);
              return updated;
            }
          }
          return currentPlayback;
        });
      }, 100);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (interpolationTimerRef.current) clearInterval(interpolationTimerRef.current);
    };
  }, [navigate]);

  const currentLyricIndex = lyrics
    ? lyrics.findLastIndex((l) => l.time <= displayProgress)
    : -1;

  const handleSeek = async (newPos: number) => {
    setDisplayProgress(newPos);
    setPlayback((prev: any) => ({ ...prev, progress_ms: newPos }));
    try {
      await seekPosition(newPos);
      setTimeout(fetchPlayback, 500);
    } catch (err) {
      console.error('Seek failed', err);
    }
  };

  const handleTogglePlay = async () => {
    const isPlaying = playback?.is_playing;
    setPlayback((prev: any) => ({ ...prev, is_playing: !isPlaying }));
    try {
      await togglePlayPause(isPlaying);
      setTimeout(fetchPlayback, 500);
    } catch (err) {
      console.error('Toggle play failed', err);
    }
  };

  const handleSkip = async (direction: 'next' | 'prev') => {
    try {
      if (direction === 'next') await skipToNext();
      else await skipToPrevious();
      setTimeout(fetchPlayback, 500);
    } catch (err) {
      console.error(`Skip ${direction} failed`, err);
    }
  };

  return {
    playback,
    displayProgress,
    lyrics,
    loading,
    currentLyricIndex,
    handleSeek,
    handleTogglePlay,
    handleSkip,
    fetchPlayback,
    setDisplayProgress,
    lyricsLoading
  };
}
