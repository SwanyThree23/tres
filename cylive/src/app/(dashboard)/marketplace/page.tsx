// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Marketplace (Content Market)
//
// TYPOGRAPHY:
//   Bebas Neue       → page title, section headers
//   Barlow Condensed → card titles, body, button text, descriptions
//   DM Mono          → price badges, view/heart counts, duration, filter labels
//
// BroadcastCard corner brackets on all video post cards
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { Clapperboard, Play, Lock, Eye, Upload, Heart } from "lucide-react";

const mockPosts = [
  {
    id: "1",
    title: "Behind the Scenes: Studio Tour 2025",
    creator: "NightOwlMedia",
    views: 12400,
    duration: "14:23",
    isPaywalled: false,
    price: 0,
    emoji: "🎬",
    hearts: 892,
  },
  {
    id: "2",
    title: "Exclusive: Unreleased Music Session",
    creator: "MelodicWaves",
    views: 3200,
    duration: "42:11",
    isPaywalled: true,
    price: 499,
    emoji: "🎵",
    hearts: 1243,
  },
  {
    id: "3",
    title: "The Art of Multi-Panel Streaming",
    creator: "FutureCast",
    views: 8700,
    duration: "28:45",
    isPaywalled: false,
    price: 0,
    emoji: "📺",
    hearts: 634,
  },
  {
    id: "4",
    title: "Premium: Creator Monetization Masterclass",
    creator: "GrowthHacker",
    views: 1800,
    duration: "1:02:15",
    isPaywalled: true,
    price: 999,
    emoji: "💰",
    hearts: 2105,
  },
  {
    id: "5",
    title: "Live Highlights: Best Moments This Week",
    creator: "CultureQueen",
    views: 6300,
    duration: "8:30",
    isPaywalled: false,
    price: 0,
    emoji: "⚡",
    hearts: 456,
  },
  {
    id: "6",
    title: "Exclusive Interview: Industry Insider",
    creator: "InsiderAccess",
    views: 4100,
    duration: "35:20",
    isPaywalled: true,
    price: 799,
    emoji: "🎤",
    hearts: 789,
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
const stagger = { animate: { transition: { staggerChildren: 0.04 } } };

export default function MarketplacePage() {
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");

  const filtered = mockPosts.filter((p) =>
    filter === "all"
      ? true
      : filter === "free"
        ? !p.isPaywalled
        : p.isPaywalled,
  );

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-7xl mx-auto"
    >
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between"
      >
        <div>
          {/* Bebas Neue page title */}
          <h1 className="text-page-title text-white flex items-center gap-3">
            <Clapperboard size={22} style={{ color: "var(--gold)" }} />
            Content Market
          </h1>
          {/* DM Mono readout */}
          <p
            className="text-readout mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {filtered.length} video posts from top creators
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* DM Mono filter toggle */}
          <div
            className="flex rounded-xl p-1"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
            }}
          >
            {(["all", "free", "premium"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-readout px-4 py-1.5 rounded-lg transition-all"
                style={{
                  background: filter === f ? "var(--accent)" : "transparent",
                  color: filter === f ? "white" : "var(--text-muted)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="btn-gold flex items-center gap-2">
            <Upload size={14} />
            Upload
          </button>
        </div>
      </motion.div>

      <motion.div
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {filtered.map((post) => (
          <motion.div key={post.id} variants={fadeUp}>
            <BroadcastCard className="group cursor-pointer">
              {/* Thumbnail */}
              <div
                className="relative h-44 rounded-xl overflow-hidden mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, var(--bg-card-high), var(--bg-card))",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">
                  {post.emoji}
                </div>
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.15), transparent)",
                  }}
                />

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <Play size={24} className="text-white fill-white ml-1" />
                  </div>
                </div>

                {/* Paywall badge — DM Mono */}
                {post.isPaywalled && (
                  <div
                    className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
                    style={{
                      background: "rgba(255,184,0,0.2)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,184,0,0.15)",
                    }}
                  >
                    <Lock size={10} style={{ color: "var(--gold)" }} />
                    <span
                      className="text-readout-sm"
                      style={{ color: "var(--gold)" }}
                    >
                      ${(post.price / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Duration — DM Mono */}
                <div
                  className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <span className="text-readout-sm text-white">
                    {post.duration}
                  </span>
                </div>
              </div>

              {/* Card title — Barlow Condensed Bold */}
              <h3 className="text-card-title text-white truncate group-hover:text-[var(--gold)] transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center justify-between mt-3">
                {/* Barlow Condensed */}
                <span
                  className="text-body-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  @{post.creator}
                </span>
                <div className="flex items-center gap-3">
                  {/* DM Mono view/heart counts */}
                  <span
                    className="text-readout-sm flex items-center gap-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Eye size={10} />
                    {post.views.toLocaleString()}
                  </span>
                  <span
                    className="text-readout-sm flex items-center gap-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Heart size={10} />
                    {post.hearts.toLocaleString()}
                  </span>
                </div>
              </div>
            </BroadcastCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
