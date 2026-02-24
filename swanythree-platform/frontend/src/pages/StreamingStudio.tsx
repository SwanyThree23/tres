/**
 * SwanyThree Streaming Studio — The crown jewel. Complete streaming control center.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv, Video, VideoOff, Mic, MicOff, Radio, Square, Users, MessageSquare,
  Send, Settings, Share2, Flame, Star, MonitorPlay, Shield, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useStudioStore } from '@/stores/studioStore';
import { useWatchPartyStore } from '@/stores/watchPartyStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { useCreateStream, useGoLive, useEndStream, useGamificationProfile } from '@/hooks/queries';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useSocket } from '@/hooks/useSocket';
import { sendChatMessage, onChatMessage, offChatMessage, onViewerCount, offViewerCount } from '@/services/socket';
import type { ChatMessage } from '@/types';
import GuestPanel from '@/components/GuestPanel';
import WatchPartyBar from '@/components/WatchPartyBar';

type SidebarTab = 'chat' | 'guests' | 'destinations' | 'gamification';

export default function StreamingStudio() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const store = useStudioStore();
  const watchParty = useWatchPartyStore();
  const { profile } = useGamificationStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>('chat');
  const [chatInput, setChatInput] = useState('');
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const createStream = useCreateStream();
  const goLive = useGoLive();
  const endStream = useEndStream();
  const { data: gamData } = useGamificationProfile();

  const { stream: mediaStream, hasVideo, hasAudio, startStream, toggleVideo, toggleAudio } = useMediaStream();
  const streamId = store.stream?.id;
  const { isConnected } = useSocket({ streamId });

  // Attach media stream to video element
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Chat message handler
  const handleChatMessage = useCallback((msg: ChatMessage) => {
    store.addChatMessage(msg);
  }, [store]);

  const handleViewerCount = useCallback((data: { count: number }) => {
    store.setViewerCount(data.count);
  }, [store]);

  useEffect(() => {
    onChatMessage(handleChatMessage);
    onViewerCount(handleViewerCount);
    return () => {
      offChatMessage(handleChatMessage);
      offViewerCount(handleViewerCount);
    };
  }, [handleChatMessage, handleViewerCount]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [store.chatMessages]);

  const handleSetup = async () => {
    await startStream();
    store.setStatus('preview');
    const result = await createStream.mutateAsync({
      title: `${user?.display_name || user?.username}'s Stream`,
      mode: 'panel_video',
    });
    store.setStream(result.stream);
  };

  const handleGoLive = async () => {
    if (!store.stream) return;
    store.setStatus('live');
    await goLive.mutateAsync(store.stream.id);
  };

  const handleEndStream = async () => {
    if (!store.stream) return;
    store.setStatus('ending');
    await endStream.mutateAsync(store.stream.id);
    store.reset();
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !streamId) return;
    sendChatMessage(streamId, chatInput.trim(), user?.username ?? 'Anonymous');
    setChatInput('');
  };

  const gamProfile = gamData?.profile;

  return (
    <div className="h-screen flex flex-col bg-st3-dark overflow-hidden">
      {/* Top Bar */}
      <header className="h-12 border-b border-st3-burgundy/20 bg-st3-panel/80 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Tv className="w-5 h-5 text-st3-gold cursor-pointer" onClick={() => navigate('/')} />
          <span className="font-bold text-st3-gold text-sm">Studio</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {gamProfile && (
            <>
              <span className="text-orange-400 flex items-center gap-1">
                <Flame className="w-4 h-4" /> {gamProfile.current_streak}
              </span>
              <span className="text-st3-gold flex items-center gap-1">
                <Star className="w-4 h-4" /> Lv.{gamProfile.level}
              </span>
            </>
          )}
          {store.status === 'live' && (
            <span className="flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-white animate-live-dot" />
              LIVE — {store.viewerCount} viewers
            </span>
          )}
          <Settings className="w-4 h-4 text-st3-cream/50 cursor-pointer hover:text-st3-cream" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Area */}
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
          {/* Watch Party */}
          <WatchPartyBar />

          {/* Host Video */}
          <div className="relative aspect-video bg-st3-dark rounded-xl overflow-hidden border border-st3-burgundy/20">
            {store.status === 'idle' ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <Radio className="w-16 h-16 text-st3-cream/20" />
                <button onClick={handleSetup} className="btn-primary text-lg px-8 py-3">
                  Set Up Stream
                </button>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {!hasVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-st3-dark">
                    <VideoOff className="w-16 h-16 text-st3-cream/20" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Guest Panel */}
          {store.status !== 'idle' && (
            <GuestPanel
              guests={[]}
              expandedGuestId={expandedGuest}
              onExpandGuest={setExpandedGuest}
              onInviteGuest={() => setActiveTab('guests')}
            />
          )}

          {/* Bottom Controls */}
          {store.status !== 'idle' && (
            <div className="flex items-center justify-between bg-st3-panel rounded-xl p-3 border border-st3-burgundy/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded-lg transition-colors ${hasVideo ? 'bg-st3-dark text-st3-cream' : 'bg-red-600 text-white'}`}
                >
                  {hasVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-lg transition-colors ${hasAudio ? 'bg-st3-dark text-st3-cream' : 'bg-red-600 text-white'}`}
                >
                  {hasAudio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button className="p-2 rounded-lg bg-st3-dark text-st3-cream hover:text-st3-gold transition-colors">
                  <MonitorPlay className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg bg-st3-dark text-st3-cream hover:text-st3-gold transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {store.status === 'preview' && (
                  <button onClick={handleGoLive} className="btn-secondary flex items-center gap-2 px-6">
                    <Radio className="w-4 h-4" /> GO LIVE
                  </button>
                )}
                {store.status === 'live' && (
                  <button onClick={handleEndStream} className="bg-red-600 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
                    <Square className="w-4 h-4" /> End Stream
                  </button>
                )}
                <div className="text-right">
                  <p className="text-xs text-st3-cream/50">90/10 Split</p>
                  <p className="text-sm font-bold text-green-400">${store.stream?.total_revenue?.toFixed(2) ?? '0.00'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="w-80 border-l border-st3-burgundy/20 flex flex-col bg-st3-panel/30 shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-st3-burgundy/20 shrink-0">
            {([
              { key: 'chat', icon: MessageSquare, label: 'Chat' },
              { key: 'guests', icon: Users, label: '0/20' },
              { key: 'destinations', icon: Shield, label: 'RTMP' },
              { key: 'gamification', icon: Star, label: 'XP' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 text-xs font-medium flex flex-col items-center gap-0.5 transition-colors
                  ${activeTab === tab.key ? 'text-st3-gold border-b-2 border-st3-gold' : 'text-st3-cream/50 hover:text-st3-cream'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3">
            <AnimatePresence mode="wait">
              {activeTab === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                  <div className="flex-1 space-y-2 overflow-y-auto mb-3">
                    {store.chatMessages.length === 0 && (
                      <p className="text-sm text-st3-cream/30 text-center py-8">No messages yet</p>
                    )}
                    {store.chatMessages.map((msg, i) => (
                      <div key={msg.id || i} className={`text-sm ${msg.type === 'tip' ? 'bg-st3-gold/10 border border-st3-gold/20 rounded p-1.5' : ''}`}>
                        <span className="font-semibold text-st3-gold">{msg.username}</span>{' '}
                        <span className="text-st3-cream/80">{msg.content}</span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </motion.div>
              )}

              {activeTab === 'guests' && (
                <motion.div key="guests" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <p className="text-sm text-st3-cream/50 mb-3">0/20 guests connected</p>
                  <button className="btn-primary w-full text-sm">Invite Guest</button>
                </motion.div>
              )}

              {activeTab === 'destinations' && (
                <motion.div key="dest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  {['YouTube', 'Twitch', 'Kick', 'TikTok', 'Facebook'].map((platform) => (
                    <div key={platform} className="flex items-center justify-between p-2 bg-st3-dark rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-sm">{platform}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-500" />
                        <button className="text-xs text-st3-gold hover:text-st3-gold-dim">Add Key</button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'gamification' && (
                <motion.div key="gam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {gamProfile && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Lv.{gamProfile.level} {gamProfile.level_title}</span>
                          <span className="text-st3-cream/50">{gamProfile.progress_pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-st3-dark rounded-full overflow-hidden">
                          <div className="h-full bg-st3-gold rounded-full animate-xp-pulse" style={{ width: `${gamProfile.progress_pct}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <span>{gamProfile.current_streak} day streak</span>
                        {gamProfile.streak_multiplier > 1 && (
                          <span className="text-st3-gold text-xs">({gamProfile.streak_multiplier}x)</span>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat Input */}
          {activeTab === 'chat' && store.status !== 'idle' && (
            <div className="p-3 border-t border-st3-burgundy/20 shrink-0">
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
      </div>
    </div>
  );
}
