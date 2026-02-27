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

import React, { useState, useEffect } from "react";
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
  Info,
} from "lucide-react";
import GoldTierCard from "@/components/monetization/GoldTierCard";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

interface LiveStream {
  id: string;
  title: string;
  thumbnailUrl?: string;
  viewers: number;
  user: { displayName: string; username: string };
}

interface UserStats {
  id: string;
  totalViews?: number;
  totalEarnings?: number;
  followers?: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  const displayName =
    session?.user?.displayName || session?.user?.username || "Creator";
  const tier = (session?.user?.tier || "FREE") as
    | "FREE"
    | "CREATOR"
    | "PRO"
    | "STUDIO";

  useEffect(() => {
    async function fetchData() {
      try {
        const [historyRes, streamsRes, userRes] = await Promise.all([
          fetch("/api/payments/history?limit=4"),
          fetch("/api/streams?status=LIVE&limit=3"),
          fetch(`/api/users/${session?.user?.id}`),
        ]);

        const historyData = await historyRes.json();
        const streamsData = await streamsRes.json();
        const userData = await userRes.json();

        setTransactions(historyData.payments || []);
        setLiveStreams(streamsData.streams || []);
        setUserStats(userData.user);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    }

    if (session?.user) {
      fetchData();
    }
  }, [session]);

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
            value: userStats
              ? `$${Number(userStats.totalEarnings).toLocaleString()}`
              : "$0",
            change: "+12.5%",
            icon: DollarSign,
            borderColor: "var(--gold)",
          },
          {
            label: "Followers",
            value: userStats ? userStats.followerCount.toLocaleString() : "0",
            change: "+324",
            icon: Users,
            borderColor: "var(--accent)",
          },
          {
            label: "Total Streams",
            value: userStats ? userStats._count.streams.toLocaleString() : "0",
            change: "+8h this wk",
            icon: Video,
            borderColor: "var(--cyan)",
          },
          {
            label: "Live Now",
            value: liveStreams.length.toString(),
            change: "Across platform",
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

      {/* ── Gold Tier Marketing ────────────────────────────────────── */}
      {(tier === "FREE" || tier === "CREATOR") && (
        <motion.div variants={fadeUp}>
          <GoldTierCard />
        </motion.div>
      )}

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
          {liveStreams.length > 0 ? (
            liveStreams.map((stream) => (
              <BroadcastCard key={stream.id} className="group cursor-pointer">
                <Link href={`/watch/${stream.id}`}>
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
                      <div className="flex items-center gap-3">
                        <span className="badge-live px-3 py-1">
                          PHASE 2: BETA
                        </span>
                        <Link
                          href="/terms"
                          className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors"
                        >
                          <Info size={10} />
                          Learn More
                        </Link>
                      </div>
                      <span
                        className="text-readout-sm text-white"
                        style={{
                          background: "rgba(0,0,0,0.5)",
                          backdropFilter: "blur(8px)",
                          padding: "2px 6px",
                          borderRadius: "999px",
                        }}
                      >
                        {stream.panelCount} panels
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1">
                      <Eye
                        size={10}
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      />
                      <span className="text-readout-sm text-white">
                        {stream.peakViewers.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-card-title text-white truncate group-hover:text-[var(--accent)] transition-colors">
                    {stream.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
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
                </Link>
              </BroadcastCard>
            ))
          ) : (
            <div className="col-span-full py-12 text-center glass-panel border-dashed">
              <p className="text-text-dim text-sm italic">
                No streams live right now. Be the first!
              </p>
            </div>
          )}
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
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background:
                        tx.type === "TIP"
                          ? "rgba(255, 184, 0, 0.1)"
                          : tx.type === "SUBSCRIPTION"
                            ? "rgba(255, 21, 100, 0.1)"
                            : "rgba(0, 229, 255, 0.1)",
                      color:
                        tx.type === "TIP"
                          ? "var(--gold)"
                          : tx.type === "SUBSCRIPTION"
                            ? "var(--accent)"
                            : "var(--cyan)",
                    }}
                  >
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-card-title text-white">
                      {tx.type} {tx.isOutgoing ? "Sent" : "Received"}
                    </p>
                    <p
                      className="text-body-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {tx.isOutgoing ? "to" : "from"} @
                      {tx.counterparty?.username || "Anonymous"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className="font-stat"
                    style={{
                      fontSize: "24px",
                      color: tx.isOutgoing ? "var(--text-dim)" : "var(--gold)",
                    }}
                  >
                    {tx.isOutgoing ? "-" : "+"}$
                    {(tx.amountCents / 100).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background:
                          tx.status === "SUCCEEDED"
                            ? "var(--green)"
                            : "var(--gold)",
                      }}
                    />
                    <span
                      className="text-readout-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-text-dim text-sm italic">
                No recent transactions.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
