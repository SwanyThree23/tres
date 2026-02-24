// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Browse/Explore Page
// Discover live streams, filter by genre, search creators
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import useSWR from "swr";
import {
  Search,
  Filter,
  Eye,
  Users,
  Sparkles,
  Grid3X3,
  Clock,
  TrendingUp,
  Radio,
} from "lucide-react";

const genres = [
  "All",
  "Talk Show",
  "Music",
  "Gaming",
  "Lifestyle",
  "Education",
  "Sports",
  "Comedy",
  "Art",
  "Technology",
];

// Placeholder data — will be replaced with SWR fetch
const mockStreams = [
  {
    id: "1",
    title: "Late Night Culture Talk: Gen Z Edition",
    creator: {
      username: "NightOwlMedia",
      displayName: "Night Owl",
      tier: "STUDIO",
      verified: true,
    },
    viewers: 3241,
    panels: 4,
    genre: "Talk Show",
    isLive: true,
    thumbnailEmoji: "🌙",
  },
  {
    id: "2",
    title: "Studio Session: Neo Soul & R&B",
    creator: {
      username: "MelodicWaves",
      displayName: "Melodic Waves",
      tier: "PRO",
      verified: true,
    },
    viewers: 1872,
    panels: 2,
    genre: "Music",
    isLive: true,
    thumbnailEmoji: "🎵",
  },
  {
    id: "3",
    title: "AI & The Future of Content Creation",
    creator: {
      username: "FutureCast",
      displayName: "Future Cast",
      tier: "PRO",
      verified: false,
    },
    viewers: 984,
    panels: 6,
    genre: "Technology",
    isLive: true,
    thumbnailEmoji: "🤖",
  },
  {
    id: "4",
    title: "Open Mic: Freestyle Friday",
    creator: {
      username: "BeatDropper",
      displayName: "Beat Dropper",
      tier: "CREATOR",
      verified: true,
    },
    viewers: 2105,
    panels: 3,
    genre: "Music",
    isLive: true,
    thumbnailEmoji: "🎤",
  },
  {
    id: "5",
    title: "Morning Meditation & Mindfulness",
    creator: {
      username: "ZenMaster",
      displayName: "Zen Master",
      tier: "PRO",
      verified: true,
    },
    viewers: 456,
    panels: 1,
    genre: "Lifestyle",
    isLive: true,
    thumbnailEmoji: "🧘",
  },
  {
    id: "6",
    title: "Comedy Roast Night: No Filter",
    creator: {
      username: "LaughFactory",
      displayName: "Laugh Factory",
      tier: "STUDIO",
      verified: true,
    },
    viewers: 5012,
    panels: 9,
    genre: "Comedy",
    isLive: true,
    thumbnailEmoji: "😂",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

export default function BrowsePage() {
  const [activeGenre, setActiveGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"viewers" | "newest">("viewers");

  const filtered = mockStreams
    .filter((s) => (activeGenre === "All" ? true : s.genre === activeGenre))
    .filter((s) =>
      searchQuery
        ? s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.creator.username.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    )
    .sort((a, b) => (sortBy === "viewers" ? b.viewers - a.viewers : 0));

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Radio size={24} className="text-accent" />
              Global Grid
            </h1>
            <p className="text-text-muted text-xs mt-1">
              {filtered.length} live streams across the grid
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                size={15}
              />
              <input
                id="browse-search"
                type="text"
                placeholder="Search streams or creators..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() =>
                setSortBy(sortBy === "viewers" ? "newest" : "viewers")
              }
              className="btn-ghost p-3"
              aria-label="Toggle sort"
            >
              {sortBy === "viewers" ? (
                <TrendingUp size={16} />
              ) : (
                <Clock size={16} />
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Genre Filters ───────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex gap-2 overflow-x-auto no-scrollbar pb-2"
      >
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGenre(g)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeGenre === g
                ? "bg-accent text-white shadow-lg shadow-accent/25"
                : "bg-white/5 text-text-muted hover:bg-white/10 hover:text-white border border-border"
            }`}
          >
            {g}
          </button>
        ))}
      </motion.div>

      {/* ── Stream Grid ─────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {filtered.map((stream) => (
          <motion.div key={stream.id} variants={fadeUp}>
            <Link href={`/watch/${stream.id}`}>
              <div className="glass-panel overflow-hidden group hover:border-accent/30 hover:shadow-glow transition-all duration-300 cursor-pointer">
                {/* Thumbnail */}
                <div className="relative h-44 bg-gradient-to-br from-bg-card-high to-bg-card overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                    {stream.thumbnailEmoji}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Live + Viewer Count */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="badge-live">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-full">
                    <Eye size={10} className="text-white/80" />
                    <span className="text-[10px] font-bold text-white">
                      {stream.viewers.toLocaleString()}
                    </span>
                  </div>

                  {/* Panel Count */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-cyan/20 backdrop-blur-sm rounded-full border border-cyan/20">
                    <Grid3X3 size={10} className="text-cyan" />
                    <span className="text-[10px] font-bold text-cyan">
                      {stream.panels} panel{stream.panels > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Aura Indicator */}
                  {stream.creator.tier === "PRO" ||
                  stream.creator.tier === "STUDIO" ? (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-purple/20 backdrop-blur-sm rounded-full border border-purple/20">
                      <Sparkles size={10} className="text-purple" />
                      <span className="text-[10px] font-bold text-purple">
                        Aura
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-sm truncate group-hover:text-accent transition-colors">
                    {stream.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-cyan flex items-center justify-center text-[10px] font-bold text-white">
                        {stream.creator.displayName[0]}
                      </div>
                      <span className="text-text-muted text-xs font-medium">
                        @{stream.creator.username}
                      </span>
                      {stream.creator.verified && (
                        <span className="text-cyan text-[10px]">✓</span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-text-dim uppercase bg-white/5 px-2 py-0.5 rounded-full">
                      {stream.genre}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Radio className="mx-auto text-text-dim mb-4" size={48} />
          <h3 className="text-white font-bold text-lg mb-1">
            No streams found
          </h3>
          <p className="text-text-muted text-sm">
            Try a different genre or search term
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
