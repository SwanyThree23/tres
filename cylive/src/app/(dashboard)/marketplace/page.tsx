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

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { Clapperboard, Lock, Eye, Upload } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
const stagger = { animate: { transition: { staggerChildren: 0.04 } } };

export default function MarketplacePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    isPaywalled: false,
    paywallAmount: "4.99",
    videoUrl: "",
  });

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`/api/marketplace?filter=${filter}`);
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Marketplace fetch error:", err);
      }
    }
    fetchPosts();
  }, [filter]);

  const filtered = posts;

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
          <button 
            onClick={() => setShowUpload(true)}
            className="btn-gold flex items-center gap-2"
          >
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
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.15), transparent)",
                  }}
                />

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
                      ${((post.paywallAmount || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Duration — DM Mono */}
                {post.duration && (
                  <div
                    className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <span className="text-readout-sm text-white">
                      {Math.floor(post.duration / 60)}:
                      {(post.duration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>

              {/* Card title — Barlow Condensed Bold */}
              <h3 className="text-card-title text-white truncate group-hover:text-[var(--gold)] transition-colors">
                {post.title}
              </h3>
              <div className="flex items-center justify-between mt-3">
                <span
                  className="text-body-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  @{post.user.username}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="text-readout-sm flex items-center gap-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Eye size={10} />
                    {post.viewCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </BroadcastCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Upload Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel w-full max-w-lg p-6 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <h2 className="text-section-header text-white">Broadcast New Content</h2>
                <p className="text-readout-sm text-muted mt-1">Upload a video post to the CYLive market</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Content Title</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Masterclass: Neo-Soul Techniques"
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="input-label">Video URL (Static Assets/S3)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://..."
                    value={uploadData.videoUrl}
                    onChange={(e) => setUploadData({ ...uploadData, videoUrl: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border">
                  <div>
                    <h4 className="text-card-title text-white">Private Listing</h4>
                    <p className="text-readout-sm text-muted">Gate content behind a paywall</p>
                  </div>
                  <button
                    onClick={() => setUploadData({ ...uploadData, isPaywalled: !uploadData.isPaywalled })}
                    className="toggle-track"
                    data-active={uploadData.isPaywalled}
                  >
                    <div className="toggle-knob" data-active={uploadData.isPaywalled} />
                  </button>
                </div>

                {uploadData.isPaywalled && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}>
                    <label className="input-label">Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-stat">$</span>
                      <input
                        type="number"
                        className="input-field pl-8"
                        value={uploadData.paywallAmount}
                        onChange={(e) => setUploadData({ ...uploadData, paywallAmount: e.target.value })}
                        step="0.01"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setShowUpload(false)}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!uploadData.title || !uploadData.videoUrl) return;
                    setIsUploading(true);
                    try {
                      const res = await fetch("/api/marketplace/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...uploadData,
                          paywallAmountCents: Math.round(parseFloat(uploadData.paywallAmount) * 100),
                        }),
                      });
                      if (!res.ok) throw new Error("Upload failed");
                      setShowUpload(false);
                      setUploadData({ title: "", isPaywalled: false, paywallAmount: "4.99", videoUrl: "" });
                      alert("Content published successfully!");
                    } catch (err) {
                      alert("Error publishing content. Check logs.");
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  disabled={isUploading || !uploadData.title || !uploadData.videoUrl}
                  className="btn-gold flex-1 py-3"
                >
                  {isUploading ? "Processing..." : "Publish Post"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
