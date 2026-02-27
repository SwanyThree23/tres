// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Analytics (Performance Matrix)
// 
// TYPOGRAPHY:
//   Bebas Neue       → stat values, section headers, page title
//   Barlow Condensed → body text, card titles, insight copy
//   DM Mono          → labels, period selector, timestamps, readouts
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import {
  BarChart3,
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

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-white flex items-center gap-3">
            <BarChart3 size={22} className="text-cyan" />
            Performance Matrix
          </h1>
          <p className="text-readout mt-1 text-text-muted">
            Track growth, revenue, and audience engagement
          </p>
        </div>
        {/* Period toggle — DM Mono */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
            {(["7d", "30d", "90d"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="text-readout px-4 py-2 rounded-lg transition-all"
                style={{
                  background: period === p ? "var(--cyan)" : "transparent",
                  color: period === p ? "black" : "var(--text-muted)",
                  fontWeight: period === p ? 500 : 400,
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-gold/10 border border-gold/20 shadow-lg shadow-gold/5">
            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
            <span className="text-[10px] text-gold font-bold uppercase tracking-widest">
              Beta Integrity Disclaimer: System Test Data Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ──────────────────────────────────────────── */}
      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue", value: "$1,445", change: "+23.4%", up: true, icon: DollarSign, accent: "var(--gold)" },
          { label: "Peak Viewers", value: "8,220", change: "+12.1%", up: true, icon: Eye, accent: "var(--accent)" },
          { label: "New Followers", value: "+324", change: "+8.7%", up: true, icon: Users, accent: "var(--cyan)" },
          { label: "Avg Watch Time", value: "24m", change: "-3.2%", up: false, icon: Clock, accent: "var(--green)" },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <BroadcastCard compact>
              <div className="flex items-center justify-between mb-4">
                <stat.icon size={18} style={{ color: stat.accent }} />
                {/* DM Mono change readout */}
                <span
                  className="text-readout-sm px-2 py-0.5 rounded"
                  style={{
                    background: stat.up ? "rgba(0,255,148,0.08)" : "rgba(255,59,48,0.08)",
                    color: stat.up ? "var(--green)" : "var(--red)",
                  }}
                >
                  {stat.up ? <ArrowUp size={8} className="inline mr-0.5" /> : <ArrowDown size={8} className="inline mr-0.5" />}
                  {stat.change}
                </span>
              </div>
              {/* Bebas Neue stat value */}
              <p className="font-stat text-white" style={{ fontSize: "36px" }}>{stat.value}</p>
              {/* DM Mono label */}
              <p className="text-readout mt-1 text-text-muted">{stat.label}</p>
            </BroadcastCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Revenue Chart ───────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <BroadcastCard>
          {/* Section header — Bebas Neue */}
          <h3 className="text-section-header-sm mb-6 text-text-muted">
            Weekly Revenue
          </h3>
          <div className="flex items-end justify-between gap-3 h-48">
            {weeklyData.map((d, i) => {
              const height = (d.earnings / maxEarnings) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  {/* Bebas Neue value */}
                  <span className="font-stat" style={{ fontSize: "16px", color: "var(--gold)" }}>
                    ${d.earnings}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: "easeOut" }}
                    className="w-full rounded-t-lg min-h-[4px]"
                    style={{ background: "linear-gradient(to top, rgba(255,184,0,0.3), rgba(255,184,0,0.8))" }}
                  />
                  {/* DM Mono day label */}
                  <span className="text-readout-sm text-text-muted">{d.day}</span>
                </div>
              );
            })}
          </div>
        </BroadcastCard>
      </motion.div>

      {/* ── AI Insights ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h3 className="text-section-header-sm ml-1 mb-4 text-text-muted">
          Aura Strategic Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Peak Engagement Window", insight: "Your audience is most active between 8–11 PM EST on weekends. Schedule your highest-value streams during this window.", icon: "🎯" },
            { title: "Revenue Opportunity", insight: "Viewers who watch 15+ minutes are 3.2× more likely to tip. Consider longer format content with mid-stream callouts.", icon: "💰" },
            { title: "Audience Sentiment", insight: "Chat sentiment is 87% positive. Your community responds best to music sessions and interactive Q&A segments.", icon: "🧠" },
          ].map((item) => (
            <BroadcastCard key={item.title}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{item.icon}</span>
                <Sparkles size={12} style={{ color: "var(--purple)" }} />
              </div>
              {/* Card title — Barlow Condensed Bold */}
              <h4 className="text-card-title text-white mb-2">{item.title}</h4>
              {/* Body — Barlow Condensed */}
              <p className="text-body-sm" style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
                {item.insight}
              </p>
            </BroadcastCard>
          ))}
        </div>
      </motion.div>

      {/* ── Top Streams ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <h3 className="text-section-header-sm ml-1 mb-4 text-text-muted">
          Top Performing Streams
        </h3>
        <div className="glass-panel overflow-hidden">
          {[
            { title: "Friday Night Culture Panel", viewers: 2400, earnings: "$445", duration: "2h 14m" },
            { title: "Music Session: Neo Soul", viewers: 1890, earnings: "$324", duration: "1h 42m" },
            { title: "Tech Talk: AI & Creators", viewers: 1200, earnings: "$213", duration: "1h 15m" },
          ].map((stream, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
              style={{ borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}
            >
              <div className="flex items-center gap-4">
                {/* Bebas Neue rank */}
                <span className="font-stat" style={{ fontSize: "32px", color: "var(--accent)", width: "2rem", textAlign: "center" }}>
                  {i + 1}
                </span>
                <div>
                  {/* Card title — Barlow Condensed Bold */}
                  <p className="text-card-title text-white">{stream.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {/* DM Mono readouts */}
                    <span className="text-readout-sm flex items-center gap-1 text-text-muted">
                      <Eye size={10} />
                      {stream.viewers.toLocaleString()} peak
                    </span>
                    <span className="text-readout-sm flex items-center gap-1 text-text-muted">
                      <Clock size={10} />
                      {stream.duration}
                    </span>
                  </div>
                </div>
              </div>
              {/* Bebas Neue earnings */}
              <p className="font-stat" style={{ fontSize: "28px", color: "var(--gold)" }}>
                {stream.earnings}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
