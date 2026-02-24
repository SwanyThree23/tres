// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Analytics (Performance Matrix)
// Revenue charts, viewer growth, top streams, AI insights
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Clock,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";

const weeklyData = [
  { day: "Mon", earnings: 142, viewers: 890 },
  { day: "Tue", earnings: 87, viewers: 540 },
  { day: "Wed", earnings: 213, viewers: 1200 },
  { day: "Thu", earnings: 56, viewers: 320 },
  { day: "Fri", earnings: 324, viewers: 1890 },
  { day: "Sat", earnings: 445, viewers: 2400 },
  { day: "Sun", earnings: 178, viewers: 980 },
];

const maxEarnings = Math.max(...weeklyData.map((d) => d.earnings));

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

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
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-cyan" />
            Performance Matrix
          </h1>
          <p className="text-text-muted text-xs mt-1">
            Track growth, revenue, and audience engagement
          </p>
        </div>
        <div className="flex bg-white/5 rounded-xl p-1 border border-border">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                period === p
                  ? "bg-cyan text-black"
                  : "text-text-muted hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Revenue",
            value: "$1,445",
            change: "+23.4%",
            up: true,
            icon: DollarSign,
            variant: "stat-card-gold",
          },
          {
            label: "Viewers",
            value: "8,220",
            change: "+12.1%",
            up: true,
            icon: Eye,
            variant: "stat-card-accent",
          },
          {
            label: "New Followers",
            value: "+324",
            change: "+8.7%",
            up: true,
            icon: Users,
            variant: "stat-card-cyan",
          },
          {
            label: "Avg Watch Time",
            value: "24m",
            change: "-3.2%",
            up: false,
            icon: Clock,
            variant: "stat-card-green",
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <div className={stat.variant}>
              <div className="flex items-center justify-between mb-4">
                <stat.icon size={20} className="text-text-muted" />
                <span
                  className={`text-[10px] font-black flex items-center gap-0.5 px-2 py-0.5 rounded-full ${
                    stat.up
                      ? "text-green bg-green/10"
                      : "text-red-400 bg-red-400/10"
                  }`}
                >
                  {stat.up ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
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

      {/* ── Revenue Chart ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="glass-panel p-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-6">
            Weekly Revenue
          </h3>
          <div className="flex items-end justify-between gap-3 h-48">
            {weeklyData.map((d, i) => {
              const height = (d.earnings / maxEarnings) * 100;
              return (
                <div
                  key={d.day}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <span className="text-[10px] font-bold text-gold">
                    ${d.earnings}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{
                      delay: i * 0.08,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-gold/30 to-gold/80 min-h-[4px]"
                  />
                  <span className="text-[10px] font-bold text-text-muted">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── AI Insights ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4 ml-1">
          AI Strategic Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Peak Engagement Window",
              insight:
                "Your audience is most active between 8-11 PM EST on weekends. Schedule your highest-value streams during this window.",
              icon: "🎯",
            },
            {
              title: "Revenue Opportunity",
              insight:
                "Viewers who watch 15+ minutes are 3.2x more likely to tip. Consider longer format content with mid-stream callouts.",
              icon: "💰",
            },
            {
              title: "Audience Sentiment",
              insight:
                "Chat sentiment is 87% positive. Your community responds best to music sessions and interactive Q&A segments.",
              icon: "🧠",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass-panel p-5 border-l-4 border-l-purple"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{item.icon}</span>
                <Sparkles size={12} className="text-purple" />
              </div>
              <h4 className="text-white font-bold text-sm mb-2">
                {item.title}
              </h4>
              <p className="text-text-muted text-xs leading-relaxed">
                {item.insight}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Top Streams ─────────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-4 ml-1">
          Top Performing Streams
        </h3>
        <div className="glass-panel divide-y divide-border">
          {[
            {
              title: "Friday Night Culture Panel",
              viewers: 2400,
              earnings: "$445",
              duration: "2h 14m",
            },
            {
              title: "Music Session: Neo Soul",
              viewers: 1890,
              earnings: "$324",
              duration: "1h 42m",
            },
            {
              title: "Tech Talk: AI & Creators",
              viewers: 1200,
              earnings: "$213",
              duration: "1h 15m",
            },
          ].map((stream, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-stat text-2xl text-accent w-8">
                  #{i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{stream.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-text-muted text-xs flex items-center gap-1">
                      <Eye size={10} />
                      {stream.viewers.toLocaleString()} peak
                    </span>
                    <span className="text-text-muted text-xs flex items-center gap-1">
                      <Clock size={10} />
                      {stream.duration}
                    </span>
                  </div>
                </div>
              </div>
              <p className="font-stat text-2xl text-gold">{stream.earnings}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
