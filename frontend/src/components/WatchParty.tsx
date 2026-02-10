import React, { useState } from 'react';
import ReactPlayer from 'react-player';

interface WatchPartyProps {
  active: boolean;
  url: string;
  playing: boolean;
  role: 'host' | 'guest';
  playerRef: React.RefObject<ReactPlayer>;
  onPlay: () => void;
  onPause: () => void;
  onSeek: () => void;
  onStart: (url: string) => void;
}

export default function WatchParty({
  active,
  url,
  playing,
  role,
  playerRef,
  onPlay,
  onPause,
  onSeek,
  onStart,
}: WatchPartyProps) {
  const [inputUrl, setInputUrl] = useState('');

  return (
    <div className="w-full bg-black relative border-b-4 border-swany-gold">
      {active ? (
        <div className="aspect-video w-full max-w-6xl mx-auto relative">
          <ReactPlayer
            ref={playerRef}
            url={url}
            playing={playing}
            width="100%"
            height="100%"
            controls={role === 'host'}
            onPlay={onPlay}
            onPause={onPause}
            onSeek={onSeek}
          />
          <div className="absolute top-4 right-4 bg-swany-burgundy px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            LIVE WATCH PARTY
          </div>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center gap-4">
          {role === 'host' && (
            <>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter media URL..."
                className="bg-swany-panel text-swany-cream px-4 py-2 rounded-lg border border-swany-gold/30 w-96 focus:outline-none focus:border-swany-gold"
              />
              <button
                onClick={() => inputUrl && onStart(inputUrl)}
                className="text-swany-gold font-bold hover:text-white transition-colors"
              >
                Start Watch Party
              </button>
            </>
          )}
          {role === 'guest' && (
            <span className="text-gray-500">Waiting for host to start watch party...</span>
          )}
        </div>
      )}
    </div>
  );
}
