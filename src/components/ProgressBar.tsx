import React from 'react';
import { formatTime } from '../utils/formatTime';

interface ProgressBarProps {
  progressMs: number;
  durationMs: number;
  onSeek: (newPos: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progressMs,
  durationMs,
  onSeek,
}) => {
  return (
    <div className="progress-container">
      <input
        type="range"
        min="0"
        max={durationMs}
        value={progressMs}
        onChange={(e) => onSeek(parseInt(e.target.value))}
        className="progress-bar"
      />
      <div className="time-info">
        <span>{formatTime(progressMs)}</span>
        <span>{formatTime(durationMs)}</span>
      </div>
    </div>
  );
};
