import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { LyricLine } from '../LyricsService';

interface LyricsViewProps {
  lyrics: LyricLine[] | null;
  lyricsLoading: boolean;
  currentLyricIndex: number;
  onLyricClick: (time: number) => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lyrics,
  lyricsLoading,
  currentLyricIndex,
  onLyricClick,
}) => {
  const activeLyricRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLyricIndex]);

  if (lyricsLoading) {
    return (
      <div className="lyrics-content flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="lyrics-content">
      {lyrics && lyrics.length > 0 ? (
        lyrics.map((line, index) => (
          <p
            key={index}
            ref={index === currentLyricIndex ? activeLyricRef : null}
            className={`lyric-line ${index === currentLyricIndex ? 'active' : ''} ${
              index > currentLyricIndex ? 'future' : ''
            }`}
            onClick={() => onLyricClick(line.time)}
          >
            {line.text}
          </p>
        ))
      ) : (
        <p className="no-lyrics">Lyrics not available for this song.</p>
      )}
    </div>
  );
};
