import React, { useState } from "react";
import {
  Shield,
  Users,
  Radio,
  DollarSign,
  Flag,
  Search,
  Filter,
  MoreVertical,
  Check,
  X,
  TrendingUp,
  BarChart3,
  Lock,
  Eye,
  Mail,
  Smartphone,
  Globe,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

type AdminTab = "overview" | "users" | "streams" | "payments" | "flags";

const AdminConsole: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Permission Check ──────────────────────────────────────────────────
  if (user?.role !== "admin" && user?.username !== "admin") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center text-color-red mb-6 border border-color-red/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <Lock size={40} />
        </div>
        <h2 className="f-dot-stat text-3xl text-white tracking-widest uppercase mb-2">
          ACCESS DENIED
        </h2>
        <p className="text-slate-500 max-w-sm leading-relaxed">
          Your identity manifest lacks the necessary administrative clearance
          for the Overlord Terminal.
        </p>
        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/5 max-w-xs w-full">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
            Simulated Credentials
          </p>
          <p className="text-xs font-bold text-white">
            User: <span className="text-accent">admin</span>
          </p>
          <p className="text-xs font-bold text-white mt-1">
            Pass: <span className="text-accent underline">admin1234</span>
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "streams", label: "Streams", icon: Radio },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "flags", label: "Flags", icon: Flag },
  ];

  const stats = [
    {
      label: "Total Entities",
      value: "42,108",
      delta: "+842",
      color: "border-accent",
    },
    {
      label: "Active Streams",
      value: "1,204",
      delta: "+12%",
      color: "border-color-cyan",
    },
    {
      label: "Total Revenue",
      value: "$840,240",
      delta: "+5.2%",
      color: "border-color-green",
    },
    {
      label: "Platform Cut",
      value: "$84,024",
      delta: "$2.1K/day",
      color: "border-color-gold",
    },
  ];

  const transactions = [
    {
      id: "TX-9012",
      sender: "NeonVibe",
      amount: "$50.00",
      type: "Tip",
      status: "Settled",
    },
    {
      id: "TX-9013",
      sender: "CyberPunker",
      amount: "$15.00",
      type: "Paywall",
      status: "Pending",
    },
    {
      id: "TX-9014",
      sender: "GhostWalker",
      amount: "$25.00",
      type: "Subscription",
      status: "Settled",
    },
    {
      id: "TX-9015",
      sender: "TechnoMage",
      amount: "$100.00",
      type: "Tip",
      status: "Verified",
    },
    {
      id: "TX-9016",
      sender: "Starlight",
      amount: "$9.99",
      type: "Post",
      status: "Settled",
    },
  ];

  const userBreakdown = [
    { tier: "Standard", count: 28400, color: "bg-slate-600", pct: 60 },
    { tier: "Executive", count: 12100, color: "bg-accent", pct: 30 },
    { tier: "Overlord", count: 1608, color: "bg-color-gold", pct: 10 },
  ];

  return (
    <div className="flex flex-col h-full gap-8 animate-fade-in no-scrollbar pb-20">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-xl shadow-accent/20">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="f-dot-stat text-3xl text-white tracking-widest uppercase leading-none mb-1">
              Overlord Terminal
            </h1>
            <p className="text-slate-500 text-sm">
              System-wide performance and entity management.
            </p>
          </div>
        </div>

        <nav className="flex bg-white/5 rounded-2xl p-1 gap-1 border border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-lg"
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── Content Viewport ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* ── Overview Tab ───────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((s, i) => (
                    <div
                      key={i}
                      className={`glass-panel p-6 border-l-4 ${s.color}`}
                    >
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        {s.label}
                      </p>
                      <div className="flex items-end justify-between">
                        <p className="vbas-noya text-3xl text-white tracking-widest leading-none">
                          {s.value}
                        </p>
                        <span className="text-[10px] font-bold text-color-green bg-color-green/10 px-2 py-0.5 rounded-full mb-1">
                          {s.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Tier Breakdown Chart */}
                  <div className="glass-panel p-8">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8">
                      Identity Tier Distribution
                    </h3>
                    <div className="space-y-6">
                      {userBreakdown.map((t, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span>{t.tier} Plan</span>
                            <span className="text-white">
                              {t.count.toLocaleString()} Users
                            </span>
                          </div>
                          <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${t.pct}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className={`h-full ${t.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity Logs */}
                  <div className="glass-panel overflow-hidden border-white/5 flex flex-col">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">
                        System Signal Log
                      </h3>
                      <Activity size={16} className="text-slate-500" />
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
                      {transactions.map((tx, i) => (
                        <div
                          key={i}
                          className="px-6 py-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 text-[10px] font-black">
                              {tx.id.split("-")[1]}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white uppercase tracking-tighter">
                                {tx.sender}
                              </p>
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                                {tx.type}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-white f-dot-stat tracking-widest">
                              {tx.amount}
                            </p>
                            <p
                              className={`text-[9px] font-black uppercase tracking-widest ${tx.status === "Settled" ? "text-color-green" : "text-color-gold"}`}
                            >
                              {tx.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Users Tab ──────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 max-w-xl mx-auto w-full">
                  <div className="relative flex-1">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                      size={18}
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search entities by manifest ID or username..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white outline-none focus:border-accent"
                    />
                  </div>
                  <button className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-all">
                    <Filter size={18} />
                  </button>
                </div>

                <div className="glass-panel overflow-hidden border-white/5">
                  <table className="w-full text-left">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Identity
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Tier
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Balance
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        {
                          name: "NeonVibe",
                          tier: "Pro",
                          status: "Online",
                          balance: "$2,482.00",
                          color: "text-accent",
                        },
                        {
                          name: "CyberPunker",
                          tier: "Standard",
                          status: "Streaming",
                          balance: "$840.42",
                          color: "text-slate-500",
                        },
                        {
                          name: "GhostWalker",
                          tier: "Elite",
                          status: "Idle",
                          balance: "$12,410.00",
                          color: "text-color-gold",
                        },
                        {
                          name: "TechnoMage",
                          tier: "Pro",
                          status: "Offline",
                          balance: "$5,102.50",
                          color: "text-accent",
                        },
                      ].map((u) => (
                        <tr
                          key={u.name}
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 p-0.5">
                              <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center text-[10px]">
                                {u.name[0]}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-white">
                              {u.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[9px] font-black uppercase tracking-widest ${u.color}`}
                            >
                              {u.tier}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${u.status === "Online" || u.status === "Streaming" ? "bg-color-green live-pulse" : "bg-slate-600"}`}
                              />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                {u.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-white font-mono">
                              {u.balance}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-2 text-slate-500 hover:text-white transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminConsole;
