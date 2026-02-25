// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Browse / Global Grid
// Stream discovery with genre filtering
//
// TYPOGRAPHY:
//   Bebas Neue       → page title, section headers
//   Barlow Condensed → card titles, body, buttons
//   DM Mono          → genres, viewer count, panel count, badges
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { Avatar } from "@/components/primitives/Avatar";
import { SignalBars } from "@/components/primitives/SignalBars";
import {
  Compass,
  Eye,
  Users,
  Grid3X3,
  Sparkles,
  TrendingUp,
  Clock,
  Search,
} from "lucide-react";

const genres = [
  "All",
  "Music",
  "Talk Show",
  "Comedy",
  "Gaming",
  "Education",
  "Culture",
  "Sports",
  "Technology",
  "Art",
];

const mockStreams = [
  {
    id: "1",
    title: "Late Night Culture Panel: Black History & Beyond",
    creator: "NightOwlMedia",
    viewers: 3842,
    panels: 4,
    genre: "Talk Show",
    isLive: true,
    hasAura: true,
    verified: true,
    emoji: "🌙",
  },
  {
    id: "2",
    title: "Freestyle Friday Cypher — Open Mic",
    creator: "MelodicWaves",
    viewers: 2150,
    panels: 2,
    genre: "Music",
    isLive: true,
    hasAura: false,
    verified: true,
    emoji: "🎤",
  },
  {
    id: "3",
    title: "Web3 Builder Hour: Smart Contracts Deep Dive",
    creator: "CryptoSage",
    viewers: 985,
    panels: 6,
    genre: "Technology",
    isLive: true,
    hasAura: true,
    verified: true,
    emoji: "⛓️",
  },
  {
    id: "4",
    title: "Stand-Up Showcase: Fresh Voices",
    creator: "ComedyVault",
    viewers: 1632,
    panels: 1,
    genre: "Comedy",
    isLive: true,
    hasAura: false,
    verified: false,
    emoji: "😂",
  },
  {
    id: "5",
    title: "Digital Art Live: Portrait Series",
    creator: "PixelMaster",
    viewers: 764,
    panels: 3,
    genre: "Art",
    isLive: true,
    hasAura: false,
    verified: true,
    emoji: "🖌️",
  },
  {
    id: "6",
    title: "Morning Meditation & Mindfulness",
    creator: "ZenStream",
    viewers: 543,
    panels: 1,
    genre: "Education",
    isLive: true,
    hasAura: true,
    verified: false,
    emoji: "🧘",
  },
  {
    id: "7",
    title: "NBA Watch Party: Playoffs React",
    creator: "SportsGrid",
    viewers: 4201,
    panels: 9,
    genre: "Sports",
    isLive: true,
    hasAura: false,
    verified: true,
    emoji: "🏀",
  },
  {
    id: "8",
    title: "Sunset DJ Set: Afrobeats & Amapiano",
    creator: "BeatKontrol",
    viewers: 2890,
    panels: 2,
    genre: "Music",
    isLive: true,
    hasAura: false,
    verified: true,
    emoji: "🌅",
  },
  {
    id: "9",
    title: "Indie Game Dev Showcase",
    creator: "PixelFoundry",
    viewers: 412,
    panels: 4,
    genre: "Gaming",
    isLive: true,
    hasAura: true,
    verified: false,
    emoji: "🎮",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
const stagger = { animate: { transition: { staggerChildren: 0.04 } } };

export default function BrowsePage() {
  const [activeGenre, setActiveGenre] = useState("All");
  const [sortBy, setSortBy] = useState<"viewers" | "recent">("viewers");
  const [search, setSearch] = useState("");

  const filtered = mockStreams
    .filter((s) => activeGenre === "All" || s.genre === activeGenre)
    .filter((s) =>
      search
        ? s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.creator.toLowerCase().includes(search.toLowerCase())
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
      {/* ── Header Row ──────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div>
          {/* Page title — Bebas Neue 22px */}
          <h1 className="text-page-title text-white flex items-center gap-3">
            <Compass size={22} style={{ color: "var(--accent)" }} />
            Global Grid
          </h1>
          {/* DM Mono readout */}
          <p
            className="text-readout mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {filtered.length} streams broadcasting •{" "}
            {mockStreams.reduce((s, x) => s + x.viewers, 0).toLocaleString()}{" "}
            viewers online
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search — Barlow Condensed */}
          <div className="hidden md:flex relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={14}
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search streams..."
              className="input-field pl-9 w-52"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {/* Sort toggle — DM Mono */}
          <div
            className="flex rounded-xl p-1"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
            }}
          >
            {(["viewers", "recent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="text-readout-sm px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: sortBy === s ? "var(--accent)" : "transparent",
                  color: sortBy === s ? "white" : "var(--text-muted)",
                }}
              >
                {s === "viewers" ? "Popular" : "Recent"}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Genre Bar ───────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
      >
        {genres.map((genre) => (
          <button
            key={genre}
            onClick={() => setActiveGenre(genre)}
            className="text-readout-sm whitespace-nowrap px-4 py-2 rounded-xl transition-all shrink-0"
            style={{
              background:
                activeGenre === genre
                  ? "var(--accent)"
                  : "rgba(255,255,255,0.04)",
              color: activeGenre === genre ? "white" : "var(--text-muted)",
              border: `1px solid ${activeGenre === genre ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {genre}
          </button>
        ))}
      </motion.div>

      {/* ── Stream Grid ─────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
      >
        {filtered.map((stream) => (
          <motion.div key={stream.id} variants={fadeUp}>
            <BroadcastCard className="group cursor-pointer">
              {/* Thumbnail Area */}
              <div
                className="relative h-44 rounded-xl overflow-hidden mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, var(--bg-card-high), var(--bg-card))",
                }}
              >
                {/* Emoji placeholder */}
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">
                  {stream.emoji}
                </div>
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1), transparent)",
                  }}
                />

                {/* Top-left badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="badge-live">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-live-pulse" />
                    Live
                  </span>
                  {stream.hasAura && (
                    <span className="badge-pro flex items-center gap-1">
                      <Sparkles size={8} />
                      Aura
                    </span>
                  )}
                </div>

                {/* Top-right: panel count — DM Mono */}
                <div className="absolute top-3 right-3">
                  <span
                    className="text-readout-sm flex items-center gap-1 px-2.5 py-1 rounded-lg"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(8px)",
                      color: "white",
                    }}
                  >
                    <Grid3X3 size={9} />
                    {stream.panels}P
                  </span>
                </div>

                {/* Bottom stats — DM Mono */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className="text-readout-sm flex items-center gap-1"
                    style={{ color: "rgba(255,255,255,0.8)" }}
                  >
                    <Eye size={10} />
                    {stream.viewers.toLocaleString()}
                  </span>
                  <SignalBars size="sm" color="green" />
                </div>
              </div>

              {/* Card title — Barlow Condensed Bold */}
              <h3 className="text-card-title text-white truncate group-hover:text-[var(--accent)] transition-colors">
                {stream.title}
              </h3>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Avatar
                    size="xs"
                    emoji={stream.emoji}
                    alt={stream.creator}
                    verified={stream.verified}
                  />
                  {/* Barlow Condensed */}
                  <span
                    className="text-body-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    @{stream.creator}
                  </span>
                </div>
                {/* DM Mono genre label */}
                <span
                  className="text-readout-sm"
                  style={{ color: "var(--cyan)" }}
                >
                  {stream.genre}
                </span>
              </div>
            </BroadcastCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Empty State ─────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p
            className="text-section-header"
            style={{ color: "var(--text-dim)" }}
          >
            No streams found
          </p>
          <p
            className="text-body-sm mt-2"
            style={{ color: "var(--text-muted)" }}
          >
            Try a different genre or search term
          </p>
        </div>
      )}
    </motion.div>
  );
}
