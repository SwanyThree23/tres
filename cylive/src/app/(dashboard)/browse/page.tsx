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

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { Avatar } from "@/components/primitives/Avatar";
import { SignalBars } from "@/components/primitives/SignalBars";
import { Compass, Eye, Grid3X3, Sparkles, Search } from "lucide-react";

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

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
const stagger = { animate: { transition: { staggerChildren: 0.04 } } };

export default function BrowsePage() {
  const [streams, setStreams] = useState<any[]>([]);
  const [activeGenre, setActiveGenre] = useState("All");
  const [sortBy, setSortBy] = useState<"viewers" | "recent">("viewers");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreams() {
      try {
        const genreQuery =
          activeGenre !== "All"
            ? `&genre=${activeGenre.toUpperCase().replace(" ", "_")}`
            : "";
        const res = await fetch(`/api/streams?status=LIVE${genreQuery}`);
        const data = await res.json();
        setStreams(data.streams || []);
      } catch (err) {
        console.error("Browse fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStreams();
  }, [activeGenre]);

  const filtered = streams
    .filter((s) =>
      search
        ? s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.user.username.toLowerCase().includes(search.toLowerCase())
        : true,
    )
    .sort((a, b) => (sortBy === "viewers" ? b.peakViewers - a.peakViewers : 0));

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
            {streams.reduce((s, x) => s + x.peakViewers, 0).toLocaleString()}{" "}
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
            <Link href={`/watch/${stream.id}`}>
              <BroadcastCard className="group cursor-pointer">
                {/* Thumbnail Area */}
                <div
                  className="relative h-44 rounded-xl overflow-hidden mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--bg-card-high), var(--bg-card))",
                  }}
                >
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
                    {stream.auraMode && (
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
                      {stream.panelCount}P
                    </span>
                  </div>

                  {/* Bottom stats — DM Mono */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span
                      className="text-readout-sm flex items-center gap-1"
                      style={{ color: "rgba(255,255,255,0.8)" }}
                    >
                      <Eye size={10} />
                      {stream.peakViewers.toLocaleString()}
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
                      alt={stream.user.displayName || stream.user.username}
                      verified={stream.user.verified}
                    />
                    <span
                      className="text-body-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      @{stream.user.username}
                    </span>
                  </div>
                  <span
                    className="text-readout-sm"
                    style={{ color: "var(--cyan)" }}
                  >
                    {stream.genre.replace("_", " ")}
                  </span>
                </div>
              </BroadcastCard>
            </Link>
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
