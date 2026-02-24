// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Marketplace (Video Posts)
// Paywalled and free video content from creators
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Clapperboard,
  Play,
  Lock,
  Eye,
  Clock,
  DollarSign,
  Upload,
  Filter,
  Heart,
  Share2,
} from "lucide-react";

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
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Clapperboard size={24} className="text-gold" />
            Content Market
          </h1>
          <p className="text-text-muted text-xs mt-1">
            {filtered.length} video posts from top creators
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 rounded-xl p-1 border border-border">
            {(["all", "free", "premium"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filter === f
                    ? "bg-accent text-white"
                    : "text-text-muted hover:text-white"
                }`}
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
            <div className="glass-panel overflow-hidden group hover:border-gold/30 transition-all duration-300 cursor-pointer">
              <div className="relative h-44 bg-gradient-to-br from-bg-card-high to-bg-card overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-30">
                  {post.emoji}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                    <Play size={24} className="text-white fill-white ml-1" />
                  </div>
                </div>

                {/* Paywall Badge */}
                {post.isPaywalled && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-gold/20 backdrop-blur-sm rounded-full border border-gold/20">
                    <Lock size={10} className="text-gold" />
                    <span className="text-[10px] font-bold text-gold">
                      ${(post.price / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Duration */}
                <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md">
                  <span className="text-[10px] font-mono font-bold text-white">
                    {post.duration}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-white font-bold text-sm truncate group-hover:text-gold transition-colors">
                  {post.title}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-text-muted text-xs">
                    @{post.creator}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-text-muted text-[10px]">
                      <Eye size={10} />
                      {post.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-text-muted text-[10px]">
                      <Heart size={10} />
                      {post.hearts.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
