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
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
    description: "",
    isPaywalled: false,
    paywallAmount: "4.99",
    videoUrl: "",
    thumbnailUrl: "",
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
          <div className="flex bg-white/[0.04] border border-border rounded-xl p-1">
            {(["all", "free", "premium"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-readout px-4 py-1.5 rounded-lg transition-all ${
                  filter === f
                    ? "bg-accent text-white"
                    : "bg-transparent text-text-muted hover:text-white"
                }`}
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
              <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-gradient-to-br from-bg-card-high to-bg-card">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                {post.thumbnailUrl && (
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* Paywall badge — DM Mono */}
                {post.isPaywalled && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold/20 backdrop-blur-md border border-gold/15">
                    <Lock size={10} className="text-gold" />
                    <span className="text-readout-sm text-gold">
                      ${((post.paywallAmount || 0) / 100).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Duration — DM Mono */}
                {post.duration && (
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md">
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
                <span className="text-body-sm text-text-muted">
                  @{post.user.username}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-readout-sm flex items-center gap-1 text-text-muted">
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
                <h2 className="text-section-header text-white">
                  Broadcast New Content
                </h2>
                <p className="text-readout-sm text-muted mt-1">
                  Upload a video post to the CYLive market
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Content Title</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Masterclass: Neo-Soul Techniques"
                    value={uploadData.title}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="input-label">Description</label>
                  <textarea
                    className="input-field min-h-[80px]"
                    placeholder="Describe your content..."
                    value={uploadData.description}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                {!selectedFile && (
                  <div
                    className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() =>
                      document.getElementById("video-upload")?.click()
                    }
                  >
                    <Upload size={24} className="mx-auto text-text-dim mb-2" />
                    <p className="text-body-sm text-white font-bold">
                      Select Video File
                    </p>
                    <p className="text-readout-sm text-text-dim mt-1">
                      MP4, WebM or MOV (Max 500MB)
                    </p>
                    <input
                      id="video-upload"
                      type="file"
                      className="hidden"
                      accept="video/*"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] || null)
                      }
                    />
                  </div>
                )}

                {selectedFile && (
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Clapperboard size={18} className="text-cyan shrink-0" />
                      <div className="min-w-0">
                        <p className="text-body-sm text-white font-bold truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-readout-sm text-text-dim">
                          {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-2 hover:bg-white/10 rounded-lg text-text-dim"
                      >
                        <Upload size={14} className="rotate-180" />
                      </button>
                    )}
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-readout-sm">
                      <span className="text-text-muted">
                        Uploading to cloud matrix...
                      </span>
                      <span className="text-white font-bold">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-border">
                  <div>
                    <h4 className="text-card-title text-white">
                      Private Listing
                    </h4>
                    <p className="text-readout-sm text-text-dim">
                      Gate content behind a paywall
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setUploadData({
                        ...uploadData,
                        isPaywalled: !uploadData.isPaywalled,
                      })
                    }
                    className="toggle-track"
                    data-active={uploadData.isPaywalled}
                  >
                    <div
                      className="toggle-knob"
                      data-active={uploadData.isPaywalled}
                    />
                  </button>
                </div>

                {uploadData.isPaywalled && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                  >
                    <label className="input-label">Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-stat">
                        $
                      </span>
                      <input
                        type="number"
                        className="input-field pl-8"
                        value={uploadData.paywallAmount}
                        onChange={(e) =>
                          setUploadData({
                            ...uploadData,
                            paywallAmount: e.target.value,
                          })
                        }
                        step="0.01"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowUpload(false);
                    setSelectedFile(null);
                    setUploadProgress(0);
                  }}
                  disabled={isUploading}
                  className="btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!uploadData.title || !selectedFile) return;
                    setIsUploading(true);
                    setUploadProgress(0);

                    try {
                      // 1. Get Presigned URL
                      const presignedRes = await fetch(
                        `/api/marketplace/upload/presigned?fileName=${encodeURIComponent(selectedFile.name)}&fileType=video&contentType=${encodeURIComponent(selectedFile.type)}`,
                      );
                      const { uploadUrl, cdnUrl } = await presignedRes.json();

                      if (!uploadUrl)
                        throw new Error("Failed to get upload URL");

                      // 2. Upload to S3
                      const xhr = new XMLHttpRequest();
                      await new Promise((resolve, reject) => {
                        xhr.open("PUT", uploadUrl);
                        xhr.setRequestHeader("Content-Type", selectedFile.type);

                        xhr.upload.onprogress = (e) => {
                          if (e.lengthComputable) {
                            setUploadProgress(
                              Math.round((e.loaded / e.total) * 100),
                            );
                          }
                        };

                        xhr.onload = () =>
                          xhr.status === 200 ? resolve(xhr.response) : reject();
                        xhr.onerror = () => reject();
                        xhr.send(selectedFile);
                      });

                      // 3. Finalize Post
                      const res = await fetch("/api/marketplace/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...uploadData,
                          videoUrl: cdnUrl,
                          paywallAmountCents: Math.round(
                            parseFloat(uploadData.paywallAmount) * 100,
                          ),
                        }),
                      });

                      if (!res.ok) throw new Error("Post finalization failed");

                      setShowUpload(false);
                      setSelectedFile(null);
                      setUploadData({
                        title: "",
                        description: "",
                        isPaywalled: false,
                        paywallAmount: "4.99",
                        videoUrl: "",
                        thumbnailUrl: "",
                      });
                      alert("Content published successfully!");
                      window.location.reload(); // Refresh to show new post
                    } catch (err) {
                      console.error("Upload process error:", err);
                      alert(
                        "Error publishing content. Please check connection and try again.",
                      );
                    } finally {
                      setIsUploading(false);
                      setUploadProgress(0);
                    }
                  }}
                  disabled={isUploading || !uploadData.title || !selectedFile}
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
