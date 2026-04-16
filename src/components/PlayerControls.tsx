import React from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSkip: (direction: 'next' | 'prev') => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onSkip,
}) => {
  return (
    <div className="controls">
      <button onClick={() => onSkip('prev')} className="control-button">
        <SkipBack size={32} />
      </button>
      <button onClick={onTogglePlay} className="control-button play-pause">
        {isPlaying ? (
          <Pause size={48} fill="currentColor" />
        ) : (
          <Play size={48} fill="currentColor" />
        )}
      </button>
      <button onClick={() => onSkip('next')} className="control-button">
        <SkipForward size={32} />
      </button>
    </div>
  );
};
