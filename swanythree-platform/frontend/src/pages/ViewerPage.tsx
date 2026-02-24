/**
 * SwanyThree Viewer Page — Public stream viewer with chat and tipping.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Heart, Share2, DollarSign, MessageSquare, Send, Tv } from 'lucide-react';
import { useStream } from '@/hooks/queries';
import { useAuthStore } from '@/stores/authStore';
import { useSocket } from '@/hooks/useSocket';
import { sendChatMessage, onChatMessage, offChatMessage, onViewerCount, offViewerCount } from '@/services/socket';
import { usersApi } from '@/services/api';
import type { ChatMessage } from '@/types';
import TipModal from '@/components/TipModal';

export default function ViewerPage() {
  const { streamId } = useParams<{ streamId: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const { data } = useStream(streamId);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useSocket({ streamId });

  const handleChatMsg = useCallback((msg: ChatMessage) => {
    setChatMessages((prev) => [...prev.slice(-199), msg]);
  }, []);

  const handleViewerCount = useCallback((data: { count: number }) => {
    setViewerCount(data.count);
  }, []);

  useEffect(() => {
    onChatMessage(handleChatMsg);
    onViewerCount(handleViewerCount);
    return () => {
      offChatMessage(handleChatMsg);
      offViewerCount(handleViewerCount);
    };
  }, [handleChatMsg, handleViewerCount]);

  const handleSendChat = () => {
    if (!chatInput.trim() || !streamId) return;
    sendChatMessage(streamId, chatInput.trim(), user?.username ?? 'Anonymous');
    setChatInput('');
  };

  const handleFollow = async () => {
    if (!data?.stream?.user_id) return;
    try {
      if (isFollowing) {
        await usersApi.unfollow(data.stream.user_id);
        setIsFollowing(false);
      } else {
        await usersApi.follow(data.stream.user_id);
        setIsFollowing(true);
      }
    } catch {
      /* ignore */
    }
  };

  const stream = data?.stream;

  return (
    <div className="min-h-screen bg-st3-dark">
      {/* Header */}
      <header className="border-b border-st3-burgundy/20 bg-st3-panel/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Tv className="w-6 h-6 text-st3-gold" />
          <span className="font-bold text-st3-gold">SwanyThree</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 p-4">
        {/* Video + Info */}
        <div className="flex-1">
          {/* Video Player */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-st3-burgundy/20">
            <div className="absolute inset-0 flex items-center justify-center">
              {stream?.status === 'live' ? (
                <p className="text-st3-cream/50">HLS Player — {stream.hls_url || 'Connecting...'}</p>
              ) : (
                <p className="text-st3-cream/30">Stream is offline</p>
              )}
            </div>
            {stream?.status === 'live' && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-live-dot" /> LIVE
                </span>
                <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <Users className="w-3 h-3" /> {viewerCount}
                </span>
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="mt-4 space-y-3">
            <h1 className="text-xl font-bold">{stream?.title ?? 'Loading...'}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-st3-panel flex items-center justify-center text-sm font-bold text-st3-cream/50">
                  {stream?.host_username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-medium">{stream?.host_display_name ?? stream?.host_username}</p>
                  <p className="text-xs text-st3-cream/50">{stream?.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <>
                    <button
                      onClick={handleFollow}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${isFollowing ? 'bg-st3-panel text-st3-cream' : 'bg-st3-burgundy text-white hover:bg-st3-burgundy-light'}`}
                    >
                      <Heart className={`w-4 h-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button onClick={() => setShowTip(true)} className="btn-primary flex items-center gap-1 text-sm">
                      <DollarSign className="w-4 h-4" /> Tip
                    </button>
                  </>
                )}
                <button className="btn-ghost p-2">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {stream?.description && <p className="text-sm text-st3-cream/60">{stream.description}</p>}
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-full lg:w-80 bg-st3-panel rounded-xl border border-st3-burgundy/20 flex flex-col h-[500px] lg:h-[calc(100vh-120px)]">
          <div className="p-3 border-b border-st3-burgundy/20 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-st3-gold" />
            <span className="font-semibold text-sm">Live Chat</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, i) => (
              <div key={msg.id || i} className="text-sm">
                <span className="font-semibold text-st3-gold">{msg.username}</span>{' '}
                <span className="text-st3-cream/80">{msg.content}</span>
              </div>
            ))}
          </div>

          {isAuthenticated && (
            <div className="p-3 border-t border-st3-burgundy/20">
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Send a message..."
                  className="flex-1 text-sm"
                />
                <button onClick={handleSendChat} className="btn-primary p-2">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Tip Modal */}
      {streamId && <TipModal isOpen={showTip} onClose={() => setShowTip(false)} streamId={streamId} />}
    </div>
  );
}
