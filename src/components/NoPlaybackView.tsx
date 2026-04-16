import React from 'react';
import { Music, LogOut } from 'lucide-react';
import { logout } from '../SpotifyAuth';

export const NoPlaybackView: React.FC = () => {
  return (
    <div className="no-playback">
      <Music size={64} />
      <h2>No music playing</h2>
      <p>Start playing music on another device to see it here.</p>
      <button className="logout-button" onClick={logout}>
        <LogOut size={20} /> Logout
      </button>
    </div>
  );
};
