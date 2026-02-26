import React, { useState } from 'react';
import ReactPlayer from 'react-player';

const SUPPORTED_PLATFORMS = 'YouTube, Vimeo, Dailymotion, SoundCloud, or Twitch';

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
  const [urlError, setUrlError] = useState('');

  const handleStart = async () => {
    if (!inputUrl) return;
    setUrlError('');

    // Client-side validation before sending to server
    try {
      const res = await fetch('/api/watch-party/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
      });
      const result = await res.json();

      if (!result.valid) {
        setUrlError(result.reason);
        return;
      }

      onStart(inputUrl);
    } catch {
      // If validation endpoint is unreachable, still reject raw files
      setUrlError('Could not validate URL. Please use a supported platform link.');
    }
  };

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
        <div className="py-4 flex flex-col items-center justify-center gap-2">
          {role === 'host' && (
            <>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    setUrlError('');
                  }}
                  placeholder={`Paste a ${SUPPORTED_PLATFORMS} link...`}
                  className="bg-swany-panel text-swany-cream px-4 py-2 rounded-lg border border-swany-gold/30 w-96 focus:outline-none focus:border-swany-gold"
                />
                <button
                  onClick={handleStart}
                  className="text-swany-gold font-bold hover:text-white transition-colors"
                >
                  Start Watch Party
                </button>
              </div>
              {urlError && (
                <p className="text-red-400 text-xs max-w-lg text-center">{urlError}</p>
              )}
              <p className="text-gray-500 text-xs">
                Supported: {SUPPORTED_PLATFORMS}. Direct file uploads are not permitted.
              </p>
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
