/**
 * SwanyThree Frontend Application (Main Component)
 * Features: 20-Grid Panel, Watch Party Player, Direct Payments, Embeds
 *
 * COMPLIANCE: Transparent fee disclosure, error handling for URL validation,
 * multistreaming acknowledgment flow surfaced in UI.
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { DollarSign, Share2, Info } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import WatchParty from './WatchParty';
import GuestPanel from './GuestPanel';
import EmbedModal from './EmbedModal';
import ChatPanel from './ChatPanel';
import FeeDisclosure from './FeeDisclosure';

interface Guest {
  id: string;
  name: string;
  destinations?: Array<{ platform: string }>;
}

export default function SwanyThreeStudio() {
  const [role, setRole] = useState<'host' | 'guest'>('host');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showFeeInfo, setShowFeeInfo] = useState(false);
  const [watchParty, setWatchParty] = useState({
    url: '',
    playing: false,
    active: false,
  });
  const [earnings, setEarnings] = useState(0);

  const socketRef = useSocket();
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('watch-party-sync', (data) => {
      if (role === 'guest') {
        setWatchParty((prev) => ({
          ...prev,
          active: true,
          url: data.mediaUrl,
          playing: data.action === 'play',
        }));
        if (data.action === 'seek' && playerRef.current) {
          playerRef.current.seekTo(data.timestamp);
        }
      }
    });

    socket.on('panel-update', (data) => {
      console.log('Panel guest count:', data.count);
    });

    socket.on('payment_received', (data) => {
      setEarnings((prev) => prev + data.amount);
    });

    socket.on('error', (data) => {
      console.error('Server error:', data.message);
    });

    return () => {
      socket.off('watch-party-sync');
      socket.off('panel-update');
      socket.off('payment_received');
      socket.off('error');
    };
  }, [role, socketRef]);

  const handleHostMediaControl = (action: string) => {
    if (role !== 'host') return;
    const timestamp = playerRef.current ? playerRef.current.getCurrentTime() : 0;

    socketRef.current?.emit('watch-party-action', {
      roomId: 'current-room',
      action,
      timestamp,
      mediaUrl: watchParty.url,
    });
  };

  const startWatchParty = (url: string) => {
    setWatchParty({ url, playing: true, active: true });
    socketRef.current?.emit('watch-party-action', {
      roomId: 'current-room',
      action: 'load',
      timestamp: 0,
      mediaUrl: url,
    });
  };

  return (
    <div className="bg-swany-dark min-h-screen text-swany-cream font-sans pb-20">
      {/* Watch Party System (Top) */}
      <WatchParty
        active={watchParty.active}
        url={watchParty.url}
        playing={watchParty.playing}
        role={role}
        playerRef={playerRef}
        onPlay={() => handleHostMediaControl('play')}
        onPause={() => handleHostMediaControl('pause')}
        onSeek={() => handleHostMediaControl('seek')}
        onStart={startWatchParty}
      />

      {/* 20 Guest Expandable Panel */}
      <GuestPanel
        guests={guests}
        expandedGuestId={expandedGuestId}
        onToggleExpand={(id) =>
          setExpandedGuestId(expandedGuestId === id ? null : id)
        }
      />

      {/* Chat Panel */}
      <ChatPanel socketRef={socketRef} roomId="current-room" />

      {/* Bottom Control Bar — COMPLIANCE: Transparent fee disclosure */}
      <div className="fixed bottom-0 w-full bg-swany-panel border-t border-swany-gold p-4 flex justify-between items-center z-50">
        <div className="flex gap-4">
          <button className="bg-swany-burgundy text-white px-6 py-2 rounded-lg font-bold hover:bg-[#a00028] transition-colors">
            Go Live
          </button>

          <button
            onClick={() => setShowEmbedModal(true)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600 transition-colors"
          >
            <Share2 size={16} /> Embed Player
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1">
              <p className="text-xs text-gray-400">PLATFORM EARNINGS (90%)</p>
              <button
                onClick={() => setShowFeeInfo(!showFeeInfo)}
                className="text-gray-500 hover:text-swany-gold transition-colors"
                title="Fee details"
              >
                <Info size={12} />
              </button>
            </div>
            <p className="text-xl font-bold text-swany-gold">
              ${(earnings / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-gray-500">10% service fee on platform transactions. Direct tips are fee-free.</p>
          </div>
          <button className="bg-green-600 px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-500 transition-colors">
            <DollarSign size={18} /> Cash Out
          </button>
        </div>
      </div>

      {/* Embed Modal */}
      {showEmbedModal && (
        <EmbedModal onClose={() => setShowEmbedModal(false)} />
      )}

      {/* Fee Disclosure Modal */}
      {showFeeInfo && (
        <FeeDisclosure onClose={() => setShowFeeInfo(false)} />
      )}
    </div>
  );
}
