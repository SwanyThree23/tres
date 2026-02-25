// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Audio Rooms (Voice Nodes)
//
// TYPOGRAPHY:
//   Bebas Neue       → page title, section header
//   Barlow Condensed → card titles, body, buttons
//   DM Mono          → room stats, readouts, speaker count labels
//
// BroadcastCard on all room cards, SignalBars not needed (in layout header)
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { Avatar } from "@/components/primitives/Avatar";
import { SignalBars } from "@/components/primitives/SignalBars";
import {
  Mic,
  Users,
  Plus,
  X,
  Headphones,
  Sparkles,
  Volume2,
  Loader2,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};


interface AudioRoom {
  id: string;
  title: string;
  host: { name: string; emoji: string };
  listeners: number;
  speakers: string[];
  hasAura: boolean;
}

export default function AudioRoomsPage() {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [enableAura, setEnableAura] = useState(true);


  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("/api/audio-rooms");
        const data = await res.json();
        setRooms(data.rooms || []);
      } catch (err) {
        console.error("Audio rooms fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!newTitle.trim() || isStarting) return;
    setIsStarting(true);
    try {
      const res = await fetch("/api/audio-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (data.room) {
        setRooms((prev) => [data.room, ...prev]);
        setShowCreate(false);
        setNewTitle("");
      }
    } catch (err) {
      console.error("Create room error:", err);
    } finally {
      setIsStarting(false);
    }
  };

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
          {/* Bebas Neue page title */}
          <h1 className="text-page-title text-white flex items-center gap-3">
            <Headphones size={22} style={{ color: "var(--cyan)" }} />
            Voice Nodes
          </h1>
          {/* DM Mono readout */}
          <p
            className="text-readout mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {rooms.length} active audio rooms
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
        {rooms.map((room) => (
          <motion.div key={room.id} variants={fadeUp}>
            <BroadcastCard className="group cursor-pointer">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    size="md"
                    emoji={room.host.avatarEmoji}
                    alt={room.host.displayName || room.host.username}
                    speaking
                  />
                  <div>
                    {/* Card title — Barlow Condensed Bold */}
                    <h3 className="text-card-title text-white group-hover:text-[var(--cyan)] transition-colors">
                      {room.title}
                    </h3>
                    {/* Body — Barlow Condensed */}
                    <p
                      className="text-body-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Hosted by @{room.host.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SignalBars size="sm" color="green" />
                  {/* DM Mono badge */}
                  <span
                    className="text-readout-sm"
                    style={{ color: "var(--green)" }}
                  >
                    Live
                  </span>
                </div>
              </div>

              {/* Speakers */}
              <div className="mb-4">
                {/* DM Mono section label */}
                <p
                  className="text-readout-sm mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Speaking (1)
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="text-readout-sm flex items-center gap-1 px-2.5 py-1 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <Volume2 size={9} style={{ color: "var(--green)" }} />
                    {room.host.username}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  {/* DM Mono listener count */}
                  <span
                    className="text-readout flex items-center gap-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Users size={12} />
                    {room.listenerCount.toLocaleString()} listening
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost btn-sm">Join</button>
                </div>
              </div>
            </BroadcastCard>
          </motion.div>
        ))}
      </div>

      {/* ── Create Room Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
            }}
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
                {/* Bebas Neue */}
                <h3 className="text-section-header-lg text-white">
                  Start Audio Room
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  aria-label="Close"
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <X size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  {/* DM Mono label */}
                  <label htmlFor="room-title" className="input-label">
                    Room Title
                  </label>
                  {/* Barlow Condensed input */}
                  <input
                    id="room-title"
                    type="text"
                    placeholder="What's the topic?"
                    className="input-field"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} style={{ color: "var(--purple)" }} />
                    <div>
                      {/* Barlow Condensed */}
                      <p className="text-card-title text-white">Aura Co-Host</p>
                      {/* DM Mono sub-label */}
                      <p
                        className="text-readout-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
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
                  onClick={handleCreateRoom}
                  disabled={!newTitle.trim() || isStarting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isStarting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Mic size={16} />
                  )}
                  {isStarting ? "Initializing..." : "Go Live"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
