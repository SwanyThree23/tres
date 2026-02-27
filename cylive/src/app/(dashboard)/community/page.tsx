"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Star,
  MessageSquare,
  Anchor,
  ShieldCheck,
  Heart,
} from "lucide-react";
import { Avatar } from "@/components/primitives/Avatar";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const pinnedPost = {
  author: "Inner Circle",
  title: "WELCOME TO THE INNER CIRCLE",
  content: `Greeting across the grid! You've successfully synchronized with the CYLive 1.0.4 Beta environment. 

This circuit is dedicated to growth, high-fidelity broadcasting, and community resilience. 

SWANY3 STANDARD RULES:
1. Protect the Circuit: No doxing, excessive toxicity, or illegal broadcast streams.
2. Respect the Grid: Use Guardian AI for privacy protection when broadcasting sensitive areas.
3. Collective Feedback: Use the Bug Report Portal for any technical glitches. 

Launch. dominate. Repeat.`,
  timestamp: "Just Now",
};

export default function CommunityPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-page-title text-white flex items-center gap-3">
            <Users size={24} className="text-accent" />
            Community Forum
          </h1>
          <p className="text-readout text-text-muted">
            Collective intelligence for the grid
          </p>
        </div>
      </motion.div>

      {/* ── Pinned Post ────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <BroadcastCard className="border-gold/30 bg-gold/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Star size={20} className="text-gold fill-gold animate-pulse" />
          </div>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center border border-gold/40">
              <Anchor size={24} className="text-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-readout-sm text-gold font-bold uppercase tracking-widest">
                  Pinned Announcement
                </span>
                <span className="text-[10px] text-gold/60">
                  • {pinnedPost.timestamp}
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-1">
                {pinnedPost.title}
              </h2>
            </div>
          </div>

          <div className="text-body text-text-secondary whitespace-pre-wrap pl-16">
            {pinnedPost.content}
          </div>

          <div className="mt-8 pt-6 border-t border-gold/20 pl-16 flex items-center gap-6">
            <button className="flex items-center gap-2 text-readout-sm text-gold hover:text-white transition-colors">
              <Heart size={14} />
              1.2K
            </button>
            <button className="flex items-center gap-2 text-readout-sm text-gold hover:text-white transition-colors">
              <MessageSquare size={14} />
              42 Replies
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-gold/10 border border-gold/20">
              <ShieldCheck size={12} className="text-gold" />
              <span className="text-[9px] text-gold font-bold uppercase">
                System Verified
              </span>
            </div>
          </div>
        </BroadcastCard>
      </motion.div>

      {/* ── Regular Posts (Placeholders) ───────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-section-header-sm ml-1 text-text-muted">
          Recent Syncs
        </h3>
        {[
          {
            author: "ZionMaster",
            title: "New high-fidelity setup test",
            replies: 12,
            likes: 45,
          },
          {
            author: "FluxBroadcaster",
            title: "Guardian AI saved my setup today!",
            replies: 8,
            likes: 89,
          },
          {
            author: "AuraExpert",
            title: "Best personality for gaming streams?",
            replies: 34,
            likes: 21,
          },
        ].map((post, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.2 + i * 0.05 }}
            className="glass-panel p-5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar size="sm" alt={post.author} />
                <div>
                  <h4 className="text-card-title text-white">{post.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-readout-sm text-accent">
                      @{post.author}
                    </span>
                    <span className="text-[10px] text-text-dim">• 2h ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-text-muted">
                <div className="flex items-center gap-1.5">
                  <MessageSquare size={14} />
                  <span className="text-readout-sm">{post.replies}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart size={14} />
                  <span className="text-readout-sm">{post.likes}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
