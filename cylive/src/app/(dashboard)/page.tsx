// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Dashboard (Command Center)
//
// TYPOGRAPHY:
//   Bebas Neue       → stat values, section headers, welcome headline
//   Barlow Condensed → body text, card titles, button labels
//   DM Mono          → labels, badges, timestamps, metadata readouts
//
// BroadcastCard with corner brackets on all primary content cards
// SignalBars not needed here (already in header via layout)
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { TierBadge } from "@/components/primitives/Badge";
import { Avatar } from "@/components/primitives/Avatar";
import {
  Zap,
  DollarSign,
  Users,
  Video,
  TrendingUp,
  Mic,
  Calendar,
  ArrowUpRight,
  Eye,
  Activity,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const displayName =
    session?.user?.displayName || session?.user?.username || "Creator";
  const tier = (session?.user?.tier || "FREE") as
    | "FREE"
    | "CREATOR"
    | "PRO"
    | "STUDIO";

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* ── Welcome Banner ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <BroadcastCard>
          <div className="relative overflow-hidden">
            {/* Background glows */}
            <div
              className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[100px] pointer-events-none"
              style={{ background: "rgba(255, 21, 100, 0.1)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-56 h-56 rounded-full blur-[80px] pointer-events-none"
              style={{ background: "rgba(0, 229, 255, 0.05)" }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <TierBadge tier={tier} size="md" />
                {/* DM Mono readout */}
                <span
                  className="text-readout"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Activity size={10} className="inline mr-1" />
                  System Active
                </span>
              </div>

              {/* Hero headline — Bebas Neue 42px */}
              <h1 className="text-hero-sm text-white mb-2">
                Welcome back, {displayName}
              </h1>

              {/* Body copy — Barlow Condensed */}
              <p
                className="text-body"
                style={{ color: "var(--text-secondary)", maxWidth: "32rem" }}
              >
                Your command center is ready. Launch a stream, check your
                earnings, or explore what&apos;s happening across the grid.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/studio"
                  className="btn-primary flex items-center gap-2"
                >
                  <Zap size={16} className="fill-white" />
                  Go Live
                </Link>
                <Link
                  href="/browse"
                  className="btn-ghost flex items-center gap-2"
                >
                  <Eye size={16} />
                  Explore Grid
                </Link>
              </div>
            </div>
          </div>
        </BroadcastCard>
      </motion.div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Total Earnings",
            value: "$2,847",
            change: "+12.5%",
            icon: DollarSign,
            borderColor: "var(--gold)",
          },
          {
            label: "Followers",
            value: "14,208",
            change: "+324",
            icon: Users,
            borderColor: "var(--accent)",
          },
          {
            label: "Stream Hours",
            value: "186",
            change: "+8h this wk",
            icon: Video,
            borderColor: "var(--cyan)",
          },
          {
            label: "Watch Time",
            value: "2.4K",
            change: "+18% growth",
            icon: TrendingUp,
            borderColor: "var(--green)",
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <BroadcastCard compact>
              <div className="flex items-center justify-between mb-4">
                <stat.icon size={18} style={{ color: stat.borderColor }} />
                {/* DM Mono badge */}
                <span
                  className="text-readout-sm"
                  style={{
                    color: "var(--green)",
                    background: "rgba(0, 255, 148, 0.08)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  {stat.change}
                </span>
              </div>
              {/* Stat value — Bebas Neue */}
              <p
                className="font-stat text-white"
                style={{ fontSize: "36px", letterSpacing: "1.5px" }}
              >
                {stat.value}
              </p>
              {/* Label — DM Mono */}
              <p
                className="text-readout mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                {stat.label}
              </p>
            </BroadcastCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Quick Actions Grid ──────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        {/* Section header — Bebas Neue 12px uppercase */}
        <h3
          className="text-section-header-sm ml-1 mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Launch Stream",
              desc: "Go live with up to 9 panels",
              icon: Video,
              href: "/studio",
              accentColor: "var(--accent)",
            },
            {
              label: "Open Audio Room",
              desc: "Start a voice-only session",
              icon: Mic,
              href: "/audio-rooms",
              accentColor: "var(--cyan)",
            },
            {
              label: "Schedule Broadcast",
              desc: "Plan an upcoming show",
              icon: Calendar,
              href: "/scheduler",
              accentColor: "var(--purple)",
            },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <BroadcastCard className="group cursor-pointer hover:scale-[1.02] transition-transform duration-200">
                <div className="flex items-center justify-between mb-4">
                  <action.icon
                    size={28}
                    style={{ color: action.accentColor }}
                  />
                  <ArrowUpRight
                    size={16}
                    className="group-hover:text-white transition-colors"
                    style={{ color: "var(--text-dim)" }}
                  />
                </div>
                {/* Card title — Barlow Condensed Bold */}
                <h4 className="text-card-title-lg text-white">
                  {action.label}
                </h4>
                {/* Body — Barlow Condensed */}
                <p
                  className="text-body-sm mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  {action.desc}
                </p>
              </BroadcastCard>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Live Now Section ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          {/* Section header — Bebas Neue */}
          <h3
            className="text-section-header-sm ml-1"
            style={{ color: "var(--text-muted)" }}
          >
            Live Now on CYLive
          </h3>
          <Link
            href="/browse"
            className="text-readout-sm flex items-center gap-1 hover:text-white transition-colors"
            style={{ color: "var(--accent)" }}
          >
            View All <ArrowUpRight size={10} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Late Night Culture Talk",
              creator: "NightOwlMedia",
              viewers: 2847,
              panels: 4,
              genre: "Talk Show",
              verified: true,
            },
            {
              title: "Studio Session: Neo Soul",
              creator: "MelodicWaves",
              viewers: 1204,
              panels: 2,
              genre: "Music",
              verified: true,
            },
            {
              title: "Tech & Tea: AI Discussion",
              creator: "FutureCast",
              viewers: 892,
              panels: 6,
              genre: "Technology",
              verified: false,
            },
          ].map((stream) => (
            <BroadcastCard key={stream.title} className="group cursor-pointer">
              {/* Thumbnail */}
              <div
                className="h-36 rounded-xl overflow-hidden relative mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, var(--bg-card-high), var(--bg-card))",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="badge-live">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-live-pulse" />
                    Live
                  </span>
                  {/* DM Mono readout */}
                  <span
                    className="text-readout-sm text-white"
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(8px)",
                      padding: "2px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    {stream.panels} panels
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                  <Eye size={10} style={{ color: "rgba(255,255,255,0.7)" }} />
                  {/* DM Mono viewer count */}
                  <span className="text-readout-sm text-white">
                    {stream.viewers.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Card title — Barlow Condensed Bold */}
              <h4 className="text-card-title text-white truncate group-hover:text-[var(--accent)] transition-colors">
                {stream.title}
              </h4>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    size="xs"
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
                {/* DM Mono genre badge */}
                <span
                  className="text-readout-sm"
                  style={{ color: "var(--cyan)" }}
                >
                  {stream.genre}
                </span>
              </div>
            </BroadcastCard>
          ))}
        </div>
      </motion.div>

      {/* ── Recent Earnings Ledger ───────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        {/* Section header — Bebas Neue */}
        <h3
          className="text-section-header-sm ml-1 mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          Recent Earnings
        </h3>
        <div
          className="glass-panel divide-y"
          style={{ borderColor: "var(--border)" }}
        >
          {[
            {
              type: "Tip",
              from: "MoonwalkerFan",
              amount: "$25.00",
              time: "2m ago",
              status: "completed",
            },
            {
              type: "Subscription",
              from: "VelvetVibes",
              amount: "$20.00",
              time: "18m ago",
              status: "completed",
            },
            {
              type: "Paywall",
              from: "NewListener42",
              amount: "$5.00",
              time: "1h ago",
              status: "completed",
            },
            {
              type: "Tip",
              from: "NightRider",
              amount: "$50.00",
              time: "3h ago",
              status: "processing",
            },
          ].map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background:
                      tx.type === "Tip"
                        ? "rgba(255, 184, 0, 0.1)"
                        : tx.type === "Subscription"
                          ? "rgba(255, 21, 100, 0.1)"
                          : "rgba(0, 229, 255, 0.1)",
                    color:
                      tx.type === "Tip"
                        ? "var(--gold)"
                        : tx.type === "Subscription"
                          ? "var(--accent)"
                          : "var(--cyan)",
                  }}
                >
                  <DollarSign size={18} />
                </div>
                <div>
                  {/* Card title — Barlow Condensed Bold */}
                  <p className="text-card-title text-white">{tx.type}</p>
                  {/* Body — Barlow Condensed */}
                  <p
                    className="text-body-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    from @{tx.from}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {/* Stat value — Bebas Neue */}
                <p
                  className="font-stat"
                  style={{ fontSize: "24px", color: "var(--gold)" }}
                >
                  {tx.amount}
                </p>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background:
                        tx.status === "completed"
                          ? "var(--green)"
                          : "var(--gold)",
                      animation:
                        tx.status !== "completed"
                          ? "live-pulse 2s ease-in-out infinite"
                          : "none",
                    }}
                  />
                  {/* DM Mono timestamp */}
                  <span
                    className="text-readout-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {tx.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
