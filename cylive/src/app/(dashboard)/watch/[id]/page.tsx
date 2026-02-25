// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Watch Page (Dynamic Stream Viewer)
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/primitives/Avatar";
import { SignalBars } from "@/components/primitives/SignalBars";
import { Badge } from "@/components/primitives/Badge";
import {
  Send,
  DollarSign,
  Users,
  Share2,
  Bell,
  MessageCircle,
  Gift,
  X,
  Loader2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isTip?: boolean;
  tipAmount?: number;
  badge?: "pro" | "mod" | "sub";
}

export default function WatchPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [following, setFollowing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStream() {
      try {
        const res = await fetch(`/api/streams/${params.id}`);
        const data = await res.json();
        setStream(data.stream);
      } catch (err) {
        console.error("Watch fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStream();
  }, [params.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      user: session?.user?.username || "Guest",
      message: chatInput,
      timestamp: new Date(),
    };
    setChat((prev) => [...prev, newMessage]);
    setChatInput("");
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={48} />
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="text-center py-20">
        <h2 className="text-hero-sm text-white">Stream Not Found</h2>
        <p className="text-text-muted mt-2">
          The stream you're looking for doesn't exist or has ended.
        </p>
      </div>
    );
  }

  const creator = stream.user;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* ── Video Player ────────────────────────────────────────── */}
        <div className="space-y-4">
          <div
            className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #0f172a, #020617)",
            }}
          >
            {/* Simulated video feed */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-30 animate-pulse">📡</div>
                <p className="text-readout text-accent">WAITING FOR SIGNAL</p>
              </div>
            </div>

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.6), transparent 30%, transparent 80%, rgba(0,0,0,0.4))",
              }}
            />

            {/* Top bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="live" size="sm">
                  LIVE
                </Badge>
                <span
                  className="px-2.5 py-1 rounded-full text-readout-sm text-white flex items-center gap-1.5"
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Users size={11} />
                  {stream.peakViewers.toLocaleString()}
                </span>
              </div>
              <SignalBars size="sm" />
            </div>

            {/* Bottom bar */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <Avatar
                size="md"
                alt={creator.displayName || creator.username}
                verified={creator.verified}
              />
              <div>
                <p className="text-card-title text-white text-shadow">
                  {creator.displayName || creator.username}
                </p>
                <p className="text-readout-sm text-white/70">
                  {stream.panelCount} Panel Setup •{" "}
                  {stream.genre.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Stream Info Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-section-header-lg text-white">
                {stream.title}
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className="text-readout-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  🎬 {stream.genre.replace("_", " ")}
                </span>
                <span
                  className="text-readout-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  ⏱ Broadcast ID: {stream.id.split("-")[0]}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFollowing(!following)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
                  following
                    ? "bg-white/5 border border-border text-white"
                    : "bg-[var(--accent)] text-white"
                }`}
              >
                <Bell size={14} />
                {following ? "Following" : "Follow"}
              </button>
              <button className="btn-ghost flex items-center gap-2">
                <Share2 size={14} />
                Share
              </button>
              <button
                onClick={() => setShowTipModal(true)}
                className="btn-gold flex items-center gap-2"
              >
                <DollarSign size={14} />
                Tip
              </button>
            </div>
          </div>
        </div>

        {/* ── Chat Panel ──────────────────────────────────────────── */}
        <div
          className="glass-panel flex flex-col"
          style={{ height: "calc(100vh - 220px)", maxHeight: "680px" }}
        >
          {/* Chat header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={16} style={{ color: "var(--cyan)" }} />
              <span className="text-card-title text-white">Live Chat</span>
            </div>
            <span
              className="text-readout-sm"
              style={{ color: "var(--text-muted)" }}
            >
              {stream.peakViewers.toLocaleString()} watching
            </span>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.length === 0 && (
              <p className="text-center text-text-dim text-sm italic py-4">
                Welcome to the chat!
              </p>
            )}
            {chat.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-body-sm font-bold text-white">
                      {msg.user}
                    </span>
                    <span className="text-timestamp">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <p className="text-body-sm text-text-muted">{msg.message}</p>
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div
            className="p-3 border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Send a message…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="input-field flex-1 text-sm py-2.5"
                aria-label="Chat message"
              />
              <button
                onClick={sendMessage}
                disabled={!chatInput.trim()}
                className="p-2.5 rounded-xl transition-all disabled:opacity-30 bg-accent"
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tip Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showTipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setShowTipModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-elevated p-8 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-section-header text-white flex items-center gap-2">
                  <Gift size={18} style={{ color: "var(--gold)" }} />
                  Send a Tip
                </h3>
                <button
                  onClick={() => setShowTipModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10"
                >
                  <X size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              <div
                className="flex items-center gap-3 mb-6 p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                }}
              >
                <Avatar size="sm" alt={creator.username} />
                <div>
                  <p className="text-card-title text-white">
                    {creator.displayName || creator.username}
                  </p>
                  <p className="text-readout-sm text-text-muted">
                    90% goes to the creator
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {["1", "5", "10", "25"].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTipAmount(amount)}
                    className="py-2.5 rounded-xl text-readout font-bold transition-all"
                    style={{
                      background:
                        tipAmount === amount
                          ? "rgba(255,184,0,0.2)"
                          : "rgba(255,255,255,0.04)",
                      color:
                        tipAmount === amount
                          ? "var(--gold)"
                          : "var(--text-muted)",
                      border: `1px solid ${tipAmount === amount ? "rgba(255,184,0,0.3)" : "var(--border)"}`,
                    }}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-readout font-bold text-gold">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Custom amount"
                  className="input-field pl-8"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                />
              </div>

              <button
                disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                className="btn-gold w-full flex items-center justify-center gap-2 py-3 disabled:opacity-40"
              >
                <DollarSign size={16} />
                Send ${tipAmount || "0"} Tip
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
