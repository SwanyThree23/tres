// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Admin Console (Overlord Terminal)
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { Avatar } from "@/components/primitives/Avatar";
import { TierBadge } from "@/components/primitives/Badge";
import {
  Shield,
  Users,
  Video,
  DollarSign,
  AlertTriangle,
  Search,
  MoreVertical,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Ban,
  Slash,
  Eye,
  Trash2,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

export default function AdminPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<
    "users" | "streams" | "moderation" | "finance"
  >("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [usersRes, streamsRes, statsRes] = await Promise.all([
          fetch("/api/users?limit=20"),
          fetch("/api/streams?limit=20"),
          fetch("/api/analytics/platform"), // We'll create this
        ]);

        const usersData = await usersRes.json();
        const streamsData = await streamsRes.json();
        const statsData = await statsRes.json();

        setUsers(usersData.users || []);
        setStreams(streamsData.streams || []);
        setStats(statsData);
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.role === "ADMIN") {
      fetchAdminData();
    }
  }, [session]);

  if (session?.user?.role !== "ADMIN" && session?.user?.username !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Slash size={64} className="text-red-500 opacity-20" />
        <h2 className="text-hero-sm text-white">Access Restricted</h2>
        <p className="text-text-muted">
          You do not have administrative privileges for this terminal.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="initial"
      animate="animate"
      className="space-y-8 max-w-7xl mx-auto pb-20"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-page-title text-white flex items-center gap-3">
            <Shield size={24} className="text-gold" />
            Overlord Terminal
          </h1>
          <p className="text-readout mt-1 text-text-muted">
            Platform-wide governance, moderation, and intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["users", "streams", "moderation", "finance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-readout px-4 py-2 rounded-xl transition-all capitalize border ${
                activeTab === tab
                  ? "bg-accent text-white border-accent"
                  : "bg-white/5 text-text-muted border-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Platform Pulse Stat Cards ───────────────────────────── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          {
            label: "Active Nodes",
            value: stats?.activeStreams || "0",
            icon: Video,
            colorClass: "text-accent",
          },
          {
            label: "Total Grid Population",
            value: stats?.totalUsers || "0",
            icon: Users,
            colorClass: "text-cyan",
          },
          {
            label: "Current Throughput",
            value: `$${(stats?.dailyRevenue || 0).toLocaleString()}`,
            icon: DollarSign,
            colorClass: "text-gold",
          },
          {
            label: "System Health",
            value: "99.9%",
            icon: Activity,
            colorClass: "text-green",
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <BroadcastCard compact>
              <div className="flex items-center justify-between mb-4">
                <stat.icon size={18} className={stat.colorClass} />
                <span className="text-readout-sm text-green flex items-center gap-1">
                  <TrendingUp size={10} />
                  Nominal
                </span>
              </div>
              <p className="font-stat text-white text-3xl">
                {stat.value}
              </p>
              <p className="text-readout mt-1 text-text-muted">
                {stat.label}
              </p>
            </BroadcastCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Search & Filter Bar ─────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            size={16}
          />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            className="input-field pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="btn-ghost px-6">Export Data</button>
      </motion.div>

      {/* ── Main Data View ───────────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="glass-panel overflow-hidden border">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-white/[0.02]">
                  {activeTab === "users" && (
                    <>
                      <th className="p-4 text-readout-sm text-muted">USER</th>
                      <th className="p-4 text-readout-sm text-muted">TIER</th>
                      <th className="p-4 text-readout-sm text-muted">STATUS</th>
                      <th className="p-4 text-readout-sm text-muted">JOINED</th>
                      <th className="p-4 text-readout-sm text-muted text-right">
                        ACTIONS
                      </th>
                    </>
                  )}
                  {activeTab === "streams" && (
                    <>
                      <th className="p-4 text-readout-sm text-muted">STREAM</th>
                      <th className="p-4 text-readout-sm text-muted">
                        CREATOR
                      </th>
                      <th className="p-4 text-readout-sm text-muted">
                        VIEWERS
                      </th>
                      <th className="p-4 text-readout-sm text-muted">
                        REVENUE
                      </th>
                      <th className="p-4 text-readout-sm text-muted text-right">
                        ACTIONS
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeTab === "users" &&
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="sm"
                            alt={user.username}
                            verified={user.verified}
                          />
                          <div>
                            <p className="text-body-sm text-white font-bold">
                              {user.displayName || user.username}
                            </p>
                            <p className="text-readout-sm text-muted">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <TierBadge tier={user.tier} size="sm" />
                      </td>
                      <td className="p-4">
                        <span className="text-readout-sm text-green flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-green" />
                          Active
                        </span>
                      </td>
                      <td className="p-4 text-readout-sm text-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-white/5 rounded-lg text-muted" title="More Options">
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {activeTab === "streams" &&
                  streams.map((stream) => (
                    <tr
                      key={stream.id}
                      className="hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="text-body-sm text-white font-bold">
                            {stream.title}
                          </p>
                          <p className="text-readout-sm text-muted">
                            {stream.id.split("-")[0]}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Avatar size="xs" alt={stream.user.username} />
                          <span className="text-body-sm text-white">
                            @{stream.user.username}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-readout-sm text-white flex items-center gap-1.5">
                          <Eye size={12} className="text-muted" />
                          {stream.peakViewers.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-readout-sm text-gold font-bold">
                          ${Number(stream.totalEarnings).toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="p-2 hover:bg-red-500/10 rounded-lg text-red-500"
                            title="Shutdown Stream"
                          >
                            <Ban size={14} />
                          </button>
                          <button className="p-2 hover:bg-white/5 rounded-lg text-muted" title="More Options">
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {loading && (
            <div className="p-12 text-center text-muted italic">
              Updating terminal node matrix...
            </div>
          )}

          {!loading &&
            ((activeTab === "users" && users.length === 0) ||
              (activeTab === "streams" && streams.length === 0)) && (
              <div className="p-12 text-center">
                <p className="text-text-dim text-sm italic">
                  Accessing database... No matching entities found.
                </p>
              </div>
            )}
        </div>
      </motion.div>

      {/* ── Bottom Alerts Panel ─────────────────────────────────── */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-section-header-sm ml-1 text-muted">
            System Security Alerts
          </h3>
          <span className="text-readout-sm text-red-500 font-bold animate-pulse">
            2 CRITICAL ENFORCEMENTS PENDING
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-5 bg-red-500/5 border-red-500/20">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-card-title text-white">
                    Massive Flag Report
                  </h4>
                  <span className="text-readout-sm text-red-500">Just Now</span>
                </div>
                <p className="text-body-sm text-muted mt-1">
                  Stream ID{" "}
                  <code className="text-xs bg-white/5 px-1">ax-992</code>{" "}
                  received 450+ hate speech flags in 2 minutes.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button className="btn-danger btn-sm">Shutdown Stream</button>
                  <button className="btn-ghost btn-sm">Investigate</button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 bg-gold/5 border-gold/20">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gold/10 rounded-lg text-gold">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-card-title text-white">
                    Suspicious Transaction
                  </h4>
                  <span className="text-readout-sm text-gold">14m ago</span>
                </div>
                <p className="text-body-sm text-muted mt-1">
                  $4,500 tip detected from a new account (
                  <code className="text-xs bg-white/5 px-1">@darkside</code>) to
                  a Tier 1 creator.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <button className="btn-primary btn-sm bg-gold text-black border-none hover:bg-gold-300">
                    Hold Funds
                  </button>
                  <button className="btn-ghost btn-sm">Audit Account</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
