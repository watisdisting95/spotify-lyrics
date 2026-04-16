import React from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '../SpotifyAuth';

export const Header: React.FC = () => {
  return (
    <div className="header">
      <div className="attribution">Powered by Spotify</div>
      <button className="logout-icon-button" onClick={logout} title="Logout">
        <LogOut size={20} />
      </button>
    </div>
  );
};
