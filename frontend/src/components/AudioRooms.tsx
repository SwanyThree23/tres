import React, { useState } from "react";
import {
  Mic,
  Users,
  Plus,
  Radio,
  Headset,
  MessageSquare,
  Volume2,
  Search,
  X,
  ChevronRight,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AudioRooms: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");

  const rooms = [
    {
      id: "1",
      title: "Late Night Alpha Talk",
      host: "NeonVibe",
      listeners: 142,
      avatar: "🦊",
    },
    {
      id: "2",
      title: "Global Tech & AI News",
      host: "CyberPunker",
      listeners: 840,
      avatar: "🤖",
    },
    {
      id: "3",
      title: "Ambient Coding session",
      host: "GhostWalker",
      listeners: 56,
      avatar: "👻",
    },
    {
      id: "4",
      title: "Investor Pitch Practice",
      host: "TechnoMage",
      listeners: 230,
      avatar: "💎",
    },
    {
      id: "5",
      title: "Lofi & Chill Vibes",
      host: "Starlight",
      listeners: 120,
      avatar: "🌌",
    },
    {
      id: "6",
      title: "Web3 Security Audit",
      host: "BitMaster",
      listeners: 89,
      avatar: "🛡️",
    },
  ];

  const RoomCard = ({ room }: { room: any }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 flex items-center justify-between group hover:border-accent/40 hover:bg-white/5 transition-all"
    >
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-0.5 shadow-xl">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-3xl">
              {room.avatar}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-color-red px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-widest live-pulse border-2 border-bg-surface">
            Live
          </div>
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1 group-hover:text-accent transition-colors">
            {room.title}
          </h3>
          <div className="flex items-center gap-3">
            <p className="dim-dm-mono text-[10px]">HOST: {room.host}</p>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Users size={12} />
              <span className="text-[10px] font-bold">{room.listeners}</span>
            </div>
          </div>
        </div>
      </div>

      <button className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all">
        Join Room
      </button>
    </motion.div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="f-dot-stat text-3xl text-white tracking-widest uppercase leading-none mb-1">
            Audio Transmissions
          </h1>
          <p className="text-slate-500 text-sm">
            Real-time voice rooms and spatial audio discussions.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-accent px-8 py-4 rounded-2xl flex items-center gap-3 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} /> Initiate Room
        </button>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      {/* ── Create Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-panel w-full max-w-md p-8 relative z-10 border-white/10 bg-surface-dark shadow-[0_32px_128px_rgba(0,0,0,0.8)]"
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
                <Mic size={32} />
              </div>

              <h2 className="f-dot-stat text-2xl text-white tracking-widest mb-2">
                CREATE TRANSMISSION
              </h2>
              <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest font-black">
                Configure your spatial voice broadcast
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Room Title
                  </label>
                  <input
                    type="text"
                    value={roomTitle}
                    onChange={(e) => setRoomTitle(e.target.value)}
                    placeholder="E.g. The Future of Cybernetics..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-accent outline-none"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-color-purple/10 text-color-purple">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                      Aura Co-host
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Enable AI director for moderation
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-5 rounded-2xl bg-accent text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Establish Room
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudioRooms;
