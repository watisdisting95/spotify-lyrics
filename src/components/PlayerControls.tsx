import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkip: (direction: 'next' | 'prev') => void;
  hideNavigation?: boolean;
  hidePlayPause?: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onSkip,
  hideNavigation = false,
  hidePlayPause = false,
}) => {
  return (
    <div className="controls">
      {!hideNavigation && (
        <button onClick={() => onSkip('prev')} className="control-button">
          <SkipBack size={24} />
        </button>
      )}
      {!hidePlayPause && (
        <button onClick={onTogglePlay} className="control-button play-pause">
          {isPlaying ? (
            <Pause size={32} fill="currentColor" />
          ) : (
            <Play size={32} fill="currentColor" />
          )}
        </button>
      )}
      {!hideNavigation && (
        <button onClick={() => onSkip('next')} className="control-button">
          <SkipForward size={24} />
        </button>
      )}
    </div>
  );
};
