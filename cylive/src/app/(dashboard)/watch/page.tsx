// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Watch Page (Stream Viewer)
//
// Viewer-facing stream consumption page with chat, tips, and reactions
//
// TYPOGRAPHY:
//   Bebas Neue       → viewer count, stream title, stat values
//   Barlow Condensed → chat messages, buttons, creator name
//   DM Mono          → timestamps, badges, donate amounts
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState, useRef, useEffect } from "react";
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

const mockChat: ChatMessage[] = [
  {
    id: "1",
    user: "NightOwl",
    message: "Let's gooo! 🔥",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "2",
    user: "WaveRunner",
    message: "The lighting is amazing tonight",
    timestamp: new Date(Date.now() - 90000),
    badge: "pro",
  },
  {
    id: "3",
    user: "StarGazer",
    message: "",
    timestamp: new Date(Date.now() - 60000),
    isTip: true,
    tipAmount: 500,
  },
  {
    id: "4",
    user: "MoonChild",
    message: "Can you play that song again?",
    timestamp: new Date(Date.now() - 45000),
    badge: "sub",
  },
  {
    id: "5",
    user: "CloudNine",
    message: "First time here, this is insane!",
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: "6",
    user: "Aura AI",
    message: "Welcome to the stream, CloudNine! 🎉 Glad to have you here!",
    timestamp: new Date(Date.now() - 20000),
    badge: "mod",
  },
  {
    id: "7",
    user: "PixelKing",
    message: "How do I get that overlay?",
    timestamp: new Date(Date.now() - 10000),
    badge: "pro",
  },
];

const reactions = ["❤️", "🔥", "😂", "👏", "🎉", "💯"];

export default function WatchPage() {
  const [chat, setChat] = useState<ChatMessage[]>(mockChat);
  const [chatInput, setChatInput] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState("");
  const [following, setFollowing] = useState(false);
  const [viewerCount] = useState(1247);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setChat((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        user: "You",
        message: chatInput,
        timestamp: new Date(),
      },
    ]);
    setChatInput("");
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* ── Video Player ────────────────────────────────────────── */}
        <div className="space-y-4">
          <div
            className="relative aspect-video rounded-2xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, var(--bg-card-high), var(--bg-card))",
            }}
          >
            {/* Simulated video feed */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-30">📺</div>
                <p
                  className="text-body-sm"
                  style={{ color: "var(--text-dim)" }}
                >
                  Stream video feed
                </p>
              </div>
            </div>

            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.5), transparent 30%, transparent 80%, rgba(0,0,0,0.3))",
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
                  {viewerCount.toLocaleString()}
                </span>
              </div>
              <SignalBars size="sm" />
            </div>

            {/* Bottom bar */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <Avatar size="md" alt="FutureCast" />
              <div>
                <p className="text-card-title text-white text-shadow">
                  FutureCast
                </p>
                <p className="text-readout-sm text-white/70">
                  Multi-panel streaming showcase
                </p>
              </div>
            </div>

            {/* Reaction overlay zone */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
              {reactions.map((r) => (
                <button
                  key={r}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm hover:scale-125 transition-transform"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(8px)",
                  }}
                  aria-label={`React with ${r}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Stream Info Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-section-header-lg text-white">
                Multi-Panel Streaming Showcase — Night Session
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className="text-readout-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  🎬 Technology
                </span>
                <span
                  className="text-readout-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  ⏱ Started 2h 14m ago
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
              <button
                className="btn-ghost flex items-center gap-2"
                aria-label="Share stream"
              >
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
              {viewerCount.toLocaleString()} watching
            </span>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2.5"
              >
                <Avatar size="xs" alt={msg.user} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-body-sm font-bold"
                      style={{
                        color: msg.badge === "mod" ? "var(--cyan)" : "white",
                      }}
                    >
                      {msg.user}
                    </span>
                    {msg.badge && (
                      <span
                        className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            msg.badge === "pro"
                              ? "var(--gold)"
                              : msg.badge === "mod"
                                ? "var(--cyan)"
                                : "var(--accent)",
                          color: "#000",
                        }}
                      >
                        {msg.badge}
                      </span>
                    )}
                    <span className="text-timestamp">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  {msg.isTip ? (
                    <div
                      className="mt-1 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                      style={{
                        background: "rgba(255,184,0,0.1)",
                        border: "1px solid rgba(255,184,0,0.2)",
                      }}
                    >
                      <Gift size={12} style={{ color: "var(--gold)" }} />
                      <span
                        className="text-readout-sm"
                        style={{ color: "var(--gold)" }}
                      >
                        Tipped ${((msg.tipAmount || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <p
                      className="text-body-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {msg.message}
                    </p>
                  )}
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
                aria-label="Send message"
                className="p-2.5 rounded-xl transition-all disabled:opacity-30"
                style={{
                  background: chatInput.trim()
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.05)",
                }}
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
                  aria-label="Close tip modal"
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
                <Avatar size="sm" alt="FutureCast" />
                <div>
                  <p className="text-card-title text-white">FutureCast</p>
                  <p
                    className="text-readout-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    90% goes directly to the creator
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {["$1", "$5", "$10", "$25"].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTipAmount(amount.replace("$", ""))}
                    className="py-2.5 rounded-xl text-readout font-bold transition-all"
                    style={{
                      background:
                        tipAmount === amount.replace("$", "")
                          ? "rgba(255,184,0,0.2)"
                          : "rgba(255,255,255,0.04)",
                      color:
                        tipAmount === amount.replace("$", "")
                          ? "var(--gold)"
                          : "var(--text-muted)",
                      border: `1px solid ${tipAmount === amount.replace("$", "") ? "rgba(255,184,0,0.3)" : "var(--border)"}`,
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              <div className="relative mb-6">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-readout font-bold"
                  style={{ color: "var(--gold)" }}
                >
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="Custom amount"
                  className="input-field pl-8"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  aria-label="Tip amount in USD"
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
