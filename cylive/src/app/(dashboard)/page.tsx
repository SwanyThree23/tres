// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Dashboard (Command Center)
// Live metrics, active streams, recent earnings, quick actions
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
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
  Clock,
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
    session?.user?.displayName || session?.user?.name || "Creator";
  const tier = session?.user?.tier || "FREE";

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* ── Welcome Banner ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="relative glass-panel p-8 md:p-10 overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="badge-gold">{tier}</span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                <Activity size={10} className="inline mr-1" />
                System Active
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-text-muted text-sm max-w-lg">
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
      </motion.div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Total Earnings",
            value: "$2,847.90",
            change: "+12.5%",
            icon: DollarSign,
            color: "gold",
            variant: "stat-card-gold",
          },
          {
            label: "Followers",
            value: "14,208",
            change: "+324",
            icon: Users,
            color: "accent",
            variant: "stat-card-accent",
          },
          {
            label: "Stream Hours",
            value: "186h",
            change: "+8h this week",
            icon: Video,
            color: "cyan",
            variant: "stat-card-cyan",
          },
          {
            label: "Watch Time",
            value: "2.4K hrs",
            change: "+18% growth",
            icon: TrendingUp,
            color: "green",
            variant: "stat-card-green",
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <div className={stat.variant}>
              <div className="flex items-center justify-between mb-4">
                <stat.icon size={20} className={`text-${stat.color}`} />
                <span className="text-[10px] font-black text-green-400 bg-green/10 px-2 py-0.5 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="font-stat text-3xl text-white tracking-wide">
                {stat.value}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-1">
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Quick Actions Grid ──────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4 ml-1">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Launch Stream",
              desc: "Go live with up to 9 panels",
              icon: Video,
              href: "/studio",
              gradient: "from-accent/20 to-accent/5",
              iconColor: "text-accent",
            },
            {
              label: "Open Audio Room",
              desc: "Start a voice-only session",
              icon: Mic,
              href: "/audio-rooms",
              gradient: "from-cyan/20 to-cyan/5",
              iconColor: "text-cyan",
            },
            {
              label: "Schedule Broadcast",
              desc: "Plan an upcoming show",
              icon: Calendar,
              href: "/scheduler",
              gradient: "from-purple/20 to-purple/5",
              iconColor: "text-purple",
            },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <div
                className={`glass-panel p-6 bg-gradient-to-br ${action.gradient} group hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-4">
                  <action.icon size={28} className={action.iconColor} />
                  <ArrowUpRight
                    size={16}
                    className="text-text-dim group-hover:text-text-primary transition-colors"
                  />
                </div>
                <h4 className="text-white font-bold text-lg">{action.label}</h4>
                <p className="text-text-muted text-xs mt-1">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Live Now Section ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">
            Live Now on CYLive
          </h3>
          <Link
            href="/browse"
            className="text-[10px] font-bold text-accent hover:text-accent-300 transition-colors flex items-center gap-1"
          >
            View All <ArrowUpRight size={12} />
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
            },
            {
              title: "Studio Session: Neo Soul",
              creator: "MelodicWaves",
              viewers: 1204,
              panels: 2,
              genre: "Music",
            },
            {
              title: "Tech & Tea: AI Discussion",
              creator: "FutureCast",
              viewers: 892,
              panels: 6,
              genre: "Technology",
            },
          ].map((stream) => (
            <div
              key={stream.title}
              className="glass-panel p-5 group hover:border-accent/30 transition-all duration-200"
            >
              {/* Thumbnail Placeholder */}
              <div className="h-36 rounded-xl bg-gradient-to-br from-bg-card-high to-bg-card mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="badge-live">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Live
                  </span>
                  <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-full text-[9px] font-bold text-white">
                    {stream.panels} panels
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                  <Eye size={10} className="text-white/70" />
                  <span className="text-[10px] font-bold text-white">
                    {stream.viewers.toLocaleString()}
                  </span>
                </div>
              </div>

              <h4 className="text-white font-bold text-sm truncate">
                {stream.title}
              </h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-text-muted text-xs font-medium">
                  @{stream.creator}
                </span>
                <span className="text-[9px] font-bold text-cyan uppercase">
                  {stream.genre}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Recent Earnings Ledger ───────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4 ml-1">
          Recent Earnings
        </h3>
        <div className="glass-panel divide-y divide-border">
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
              className="flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === "Tip"
                      ? "bg-gold/10 text-gold"
                      : tx.type === "Subscription"
                        ? "bg-accent/10 text-accent"
                        : "bg-cyan/10 text-cyan"
                  }`}
                >
                  <DollarSign size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{tx.type}</p>
                  <p className="text-text-muted text-xs">from @{tx.from}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-stat text-xl text-gold">{tx.amount}</p>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      tx.status === "completed"
                        ? "bg-green"
                        : "bg-gold animate-pulse"
                    }`}
                  />
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
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
