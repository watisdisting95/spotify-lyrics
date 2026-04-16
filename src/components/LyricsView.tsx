import React, { useEffect, useRef } from 'react';
import type { LyricLine } from '../LyricsService';

interface LyricsViewProps {
  lyrics: LyricLine[] | null;
  currentLyricIndex: number;
  onLyricClick: (time: number) => void;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  lyrics,
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

  return (
    <div className="lyrics-section">
      <div className="lyrics-content">
        {lyrics ? (
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
    </div>
  );
};
