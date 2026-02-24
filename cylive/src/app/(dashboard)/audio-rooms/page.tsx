// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Audio Rooms (Voice Nodes)
// WebRTC-based voice rooms with speaker management
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Users,
  Plus,
  X,
  Headphones,
  Sparkles,
  Radio,
  Volume2,
} from "lucide-react";

interface AudioRoom {
  id: string;
  title: string;
  host: { name: string; avatar: string };
  listeners: number;
  speakers: string[];
  isActive: boolean;
  hasAura: boolean;
}

const mockRooms: AudioRoom[] = [
  {
    id: "1",
    title: "Culture & Community Talk",
    host: { name: "VoiceOfReason", avatar: "🎙️" },
    listeners: 342,
    speakers: ["DJ_Smooth", "CultureQueen", "MindfulMike"],
    isActive: true,
    hasAura: true,
  },
  {
    id: "2",
    title: "Late Night Freestyle Cypher",
    host: { name: "BeatsMaster", avatar: "🎵" },
    listeners: 891,
    speakers: ["LyricalGenius", "FlowState"],
    isActive: true,
    hasAura: false,
  },
  {
    id: "3",
    title: "Tech Talk: Web3 & Beyond",
    host: { name: "CryptoSage", avatar: "💻" },
    listeners: 156,
    speakers: ["DevDreams", "BlockchainBoss", "AIExplorer", "CodeNinja"],
    isActive: true,
    hasAura: true,
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function AudioRoomsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [enableAura, setEnableAura] = useState(false);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Headphones size={24} className="text-cyan" />
            Voice Nodes
          </h1>
          <p className="text-text-muted text-xs mt-1">
            {mockRooms.length} active audio rooms
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Start Room
        </button>
      </motion.div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mockRooms.map((room) => (
          <motion.div key={room.id} variants={fadeUp}>
            <div className="glass-panel p-6 hover:border-cyan/30 hover:shadow-glow-cyan transition-all duration-300 cursor-pointer group">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan/10 flex items-center justify-center text-2xl border border-cyan/20">
                    {room.host.avatar}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm group-hover:text-cyan transition-colors">
                      {room.title}
                    </h3>
                    <p className="text-text-muted text-xs">
                      Hosted by @{room.host.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green rounded-full animate-live-pulse" />
                  <span className="text-[9px] font-bold text-green uppercase">
                    Live
                  </span>
                </div>
              </div>

              {/* Speakers */}
              <div className="mb-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-2">
                  Speaking ({room.speakers.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {room.speakers.map((speaker) => (
                    <span
                      key={speaker}
                      className="px-2.5 py-1 bg-white/5 border border-border rounded-lg text-[10px] font-bold text-text-primary flex items-center gap-1"
                    >
                      <Volume2 size={9} className="text-green" />
                      {speaker}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-text-muted text-xs">
                    <Users size={12} />
                    {room.listeners.toLocaleString()} listening
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {room.hasAura && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-purple/10 border border-purple/20 rounded-full">
                      <Sparkles size={9} className="text-purple" />
                      <span className="text-[9px] font-bold text-purple">
                        Aura
                      </span>
                    </span>
                  )}
                  <button className="btn-ghost btn-sm">Join</button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Create Room Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-elevated p-8 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white">
                  Start Audio Room
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  aria-label="Close"
                  className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X size={16} className="text-text-muted" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="room-title" className="input-label">
                    Room Title
                  </label>
                  <input
                    id="room-title"
                    type="text"
                    placeholder="What's the topic?"
                    className="input-field"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-white/3 rounded-xl border border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        Aura Co-Host
                      </p>
                      <p className="text-[10px] text-text-muted">
                        AI-powered room companion
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnableAura(!enableAura)}
                    aria-label={enableAura ? "Disable Aura" : "Enable Aura"}
                    className="toggle-track"
                    data-active={enableAura}
                  >
                    <div className="toggle-knob" data-active={enableAura} />
                  </button>
                </div>

                <button
                  disabled={!newTitle.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Mic size={16} />
                  Go Live
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
