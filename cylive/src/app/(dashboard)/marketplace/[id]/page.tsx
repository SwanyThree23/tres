"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  Play,
  Eye,
  Clock,
  Calendar,
  DollarSign,
  Shield,
  Clapperboard,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/components/primitives/Avatar";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

interface VideoPost {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  isPaywalled: boolean;
  paywallAmount: number;
  duration: number;
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    verified: boolean;
  };
}

export default function VideoPostPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [post, setPost] = useState<VideoPost | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/marketplace/${params.id}`);
        const data = await res.json();
        if (data.post) {
          setPost(data.post);
          setHasAccess(data.hasAccess);
        }
      } catch (err) {
        console.error("Fetch post error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [params.id]);

  const handlePurchase = async () => {
    if (!session) {
      alert("Please login to purchase content");
      return;
    }
    setPurchasing(true);
    try {
      // Simulate purchase flow
      // In a real app, this would call /api/payments/checkout
      const res = await fetch("/api/payments/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPostId: params.id }),
      });
      const data = await res.json();
      if (data.success) {
        setHasAccess(true);
        // Refresh post to get videoUrl
        const refreshRes = await fetch(`/api/marketplace/${params.id}`);
        const refreshData = await refreshRes.json();
        setPost(refreshData.post);
      } else {
        throw new Error(data.error || "Purchase failed");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to process purchase";
      alert(message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        <p className="text-readout text-text-muted animate-pulse">
          Accessing Cloud Vault...
        </p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-20 space-y-4">
        <Clapperboard size={48} className="mx-auto text-text-dim" />
        <h2 className="text-2xl text-white font-bold">Content vanished...</h2>
        <p className="text-text-muted">
          This post may have been removed or moved.
        </p>
        <Link
          href="/marketplace"
          className="btn-ghost inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Return to Market
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header / Back ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/marketplace"
          className="group flex items-center gap-2 text-readout text-text-muted hover:text-white transition-colors"
        >
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
            <ArrowLeft size={16} /> {/* Changed ChevronLeft to ArrowLeft */}
          </div>
          Back to Market
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-border">
          <Shield size={14} className="text-cyan" />
          <span className="text-readout-sm text-text-muted">
            Secure Marketplace Listing
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* ── Left: Player & Description ───────────────────────────── */}
        <div className="space-y-6">
          {/* Video Player Area */}
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-border shadow-2xl">
            {hasAccess ? (
              <video
                src={post.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={post.thumbnailUrl}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <div className="absolute inset-0 z-0 opacity-40 blur-2xl">
                  {post.thumbnailUrl && (
                    <Image
                      src={post.thumbnailUrl}
                      fill
                      className="object-cover"
                      alt=""
                    />
                  )}
                </div>

                <div className="relative z-10 space-y-6 max-w-sm">
                  <div className="w-20 h-20 bg-gold/20 backdrop-blur-xl border border-gold/30 rounded-full flex items-center justify-center mx-auto shadow-glow-gold">
                    <Lock size={32} className="text-gold" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Premium Content Gated
                    </h2>
                    <p className="text-readout-sm text-text-muted">
                      Support @{post.user.username} to unlock this exclusive
                      broadcast post.
                    </p>
                  </div>
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="btn-gold w-full py-4 text-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
                  >
                    {purchasing ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <Play size={20} fill="currentColor" />
                    )}
                    Unlock for ${((post.paywallAmount || 0) / 100).toFixed(2)}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info Section */}
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            <h1 className="text-4xl font-bold text-white leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 py-4 border-y border-border">
              <div className="flex items-center gap-3">
                <Avatar
                  size="md"
                  alt={post.user.username}
                  src={post.user.avatarUrl}
                  verified={post.user.verified}
                />
                <div>
                  <p className="text-body-sm text-white font-bold">
                    @{post.user.username}
                  </p>
                  <p className="text-readout-sm text-text-muted">
                    Content Creator
                  </p>
                </div>
              </div>
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2 text-text-muted">
                <Eye size={16} />
                <span className="text-readout-sm font-bold text-white">
                  {post.viewCount.toLocaleString()}
                </span>
                <span className="text-readout-sm">Views</span>
              </div>
              <div className="flex items-center gap-2 text-text-muted">
                <Calendar size={16} />
                <span className="text-readout-sm">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase tracking-widest text-text-dim font-black">
                Description
              </h3>
              <p className="text-body text-text-muted leading-relaxed whitespace-pre-wrap">
                {post.description ||
                  "No description provided for this content piece."}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Right: Sidebar / Purchase Info ────────────────────────── */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-card-title text-white">Content Specs</h3>
              <Clapperboard size={16} className="text-text-muted" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-border">
                <div className="flex items-center gap-2 text-text-muted">
                  <Clock size={14} />
                  <span className="text-readout-sm">Duration</span>
                </div>
                <span className="text-readout-sm text-white font-bold">
                  {post.duration
                    ? `${Math.floor(post.duration / 60)}m ${post.duration % 60}s`
                    : "0m 0s"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/2 border border-border">
                <div className="flex items-center gap-2 text-text-muted">
                  <CheckCircle size={14} className="text-green" />
                  <span className="text-readout-sm">Format</span>
                </div>
                <span className="text-readout-sm text-white font-bold">
                  4K / UHD
                </span>
              </div>
            </div>

            {!hasAccess && (
              <div className="p-4 rounded-xl bg-gold/5 border border-gold/20 space-y-3">
                <p className="text-readout-sm text-gold font-bold flex items-center gap-2">
                  <DollarSign size={14} />
                  One-time Purchase
                </p>
                <p className="text-[10px] text-text-muted leading-relaxed">
                  Lifetime access to this content in your library. Supporting
                  the creator directly.
                </p>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="btn-gold w-full text-xs py-2.5"
                >
                  Unlock Vault Access
                </button>
              </div>
            )}

            {hasAccess && (
              <div className="p-4 rounded-xl bg-green/5 border border-green/20">
                <p className="text-readout-sm text-green font-bold flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Access Granted
                </p>
                <p className="text-[10px] text-text-muted mt-1">
                  You have full ownership of this content in your library.
                </p>
              </div>
            )}
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-card-title text-white mb-4 italic underline decoration-cyan underline-offset-4">
              Creator Notes
            </h3>
            <p className="text-readout-sm text-text-muted italic leading-relaxed">
              &quot;This broadcast covers the advanced nuances of the CYLive
              platform architecture. Hope you enjoy the deep dive!&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
