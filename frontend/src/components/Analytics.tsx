import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Zap,
  Calendar,
  ArrowUpRight,
  DollarSign,
  Wallet,
  ShoppingBag,
  Star,
  Sparkles,
  MessageSquare,
  ChevronRight,
  Info,
  PieChart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { analyticsService } from "../services/api";

const Analytics: React.FC = () => {
  const [period, setPeriod] = useState<"24H" | "7D" | "30D">("7D");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    analyticsService
      .getGlobal()
      .then((res) => setData(res.data))
      .catch((err) => console.error("Failed to fetch analytics", err))
      .finally(() => setLoading(false));
  }, []);

  // ─── Chart Data Mocking ──────────────────────────────────────────────────
  const getChartLabels = () => {
    if (period === "24H")
      return ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];
    if (period === "7D")
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return ["W1", "W2", "W3", "W4"];
  };

  const earningsValues = [45, 82, 35, 95, 60, 40, 75];
  const viewersValues = [60, 40, 90, 55, 80, 70, 45];
  const maxVal = 100;

  const insights = [
    {
      topic: "Best Streaming Day",
      emoji: "📅",
      text: "Tuesday is your highest engagement day. Moving music sessions here could boost tips by 15%.",
      color: "border-color-purple",
    },
    {
      topic: "Early Tippers",
      emoji: "⚡",
      text: "Viewers who tip in the first 10 minutes are 85% more likely to subscribe.",
      color: "border-color-cyan",
    },
    {
      topic: "Optimal Duration",
      emoji: "⏲️",
      text: "Your optimal session length is 90-120 minutes. Engagement drops after the 2-hour mark.",
      color: "border-color-green",
    },
    {
      topic: "Engagement Drop",
      emoji: "📉",
      text: "Retention typically dips around the 45-minute mark. Consider a high-intensity event then.",
      color: "border-color-red",
    },
  ];

  const logs = [
    {
      sender: "NeonVibe",
      recipient: "You",
      type: "Tip",
      amount: "50.00",
      date: "Oct 24, 14:02",
      color: "border-color-gold",
    },
    {
      sender: "CyberPunker",
      recipient: "You",
      type: "Subscription",
      amount: "9.99",
      date: "Oct 24, 13:45",
      color: "border-accent",
    },
    {
      sender: "GhostWalker",
      recipient: "You",
      type: "Paywall",
      amount: "15.00",
      date: "Oct 24, 12:30",
      color: "border-color-cyan",
    },
    {
      sender: "TechnoMage",
      recipient: "You",
      type: "Gift",
      amount: "25.00",
      date: "Oct 24, 11:15",
      color: "border-color-purple",
    },
    {
      sender: "Starlight",
      recipient: "You",
      type: "Tip",
      amount: "100.00",
      date: "Oct 24, 09:30",
      color: "border-color-gold",
    },
  ];

  const StatCard = ({ label, value, delta, color, delay }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel p-6 border-white/5 relative overflow-hidden group"
    >
      <div
        className={`absolute -right-4 -top-4 w-20 h-20 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity`}
        style={{ backgroundColor: color }}
      />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <p className="vbas-noya text-3xl text-white tracking-widest">{value}</p>
        {delta && (
          <span className="text-[10px] font-bold text-color-green bg-color-green/10 px-2 py-0.5 rounded-full mb-1">
            {delta}
          </span>
        )}
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "70%" }}
          transition={{ duration: 1, delay: delay + 0.2 }}
          className="h-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* ── Period Selector Header ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter f-dot-stat uppercase">
            Executive Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Global platform performance and earning analytics.
          </p>
        </div>
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1 border border-white/5 shadow-xl">
          {(["24H", "7D", "30D"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p
                  ? "bg-accent text-white shadow-lg"
                  : "text-slate-500 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stat Cards Grid (4) ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Earnings Today"
          value="$1,240.42"
          delta="+12.4%"
          color="#FBBF24"
          delay={0.1}
        />
        <StatCard
          label="Weekly Volume"
          value="$8,124.80"
          delta="+8.2%"
          color="#7C3AED"
          delay={0.15}
        />
        <StatCard
          label="Monthly Rev"
          value="$32,410.00"
          delta="+21.7%"
          color="#22D3EE"
          delay={0.2}
        />
        <StatCard
          label="All Time Total"
          value="$142,000.00"
          delta={null}
          color="#A855F7"
          delay={0.25}
        />
      </div>

      {/* ── Charts Section ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Earnings Chart */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
              <DollarSign className="text-color-gold" size={18} /> Revenue
              Growth
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Values in USD
            </span>
          </div>

          <div className="flex items-end justify-between h-[100px] gap-2 mb-8 relative">
            {earningsValues.map((v, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(v / maxVal) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-color-gold/40 to-color-gold relative group"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded">
                  {v}%
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between px-2">
            {getChartLabels().map((label) => (
              <span
                key={label}
                className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter transform -rotate-30 origin-top-left"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Viewers Chart */}
        <div className="glass-panel p-8 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
              <Users className="text-color-green" size={18} /> Audience Snapshot
            </h3>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Active Retention
            </span>
          </div>

          <div className="flex items-end justify-between h-[100px] gap-2 mb-8 relative">
            {viewersValues.map((v, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(v / maxVal) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="flex-1 rounded-t-lg bg-gradient-to-t from-color-green/40 to-color-green group relative"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded">
                  {v}%
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex justify-between px-2">
            {getChartLabels().map((label) => (
              <span
                key={label}
                className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter transform -rotate-30 origin-top-left"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid: Aura Insights & Logs ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Aura Insights (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-8 rounded-3xl bg-color-purple/5 border border-color-purple/10 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-color-purple/10 blur-[100px] rounded-full" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-color-purple/20 rounded-full border border-color-purple/30">
                <span className="w-2 h-2 bg-color-purple rounded-full animate-pulse shadow-[0_0_10px_#A855F7]" />
                <span className="f-dot-stat text-sm text-color-purple tracking-widest mt-0.5">
                  Aura Strategic Insights
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {insights.map((insight, i) => (
                <motion.div
                  key={insight.topic}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className={`glass-panel p-5 bg-black/40 border-l-4 ${insight.color} flex flex-col gap-3 group hover:bg-black/60 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl group-hover:scale-125 transition-transform">
                      {insight.emoji}
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="text-slate-700 group-hover:text-white transition-colors"
                    />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
                      {insight.topic}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {insight.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Transmission Log (Col 4) */}
        <div className="lg:col-span-4 glass-panel flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
              Transmission Log
            </h3>
            <PieChart size={14} className="text-slate-500" />
          </div>
          <div className="flex-1 overflow-y-auto max-h-[450px] custom-scrollbar">
            {logs.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className={`px-6 py-4 border-l-2 ${log.color} hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-xs font-black text-white">
                    {log.sender}{" "}
                    <span className="text-slate-500 font-normal">→</span>{" "}
                    {log.recipient}
                  </p>
                  <span className="text-[9px] font-black text-slate-500 uppercase">
                    {log.date}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[8px] font-black uppercase tracking-widest text-slate-400">
                    {log.type}
                  </span>
                  <span className="bimbas-noyer text-sm text-white tracking-widest font-bold">
                    ${log.amount}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          <button className="p-4 text-[10px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors border-t border-white/5">
            Download full CSV report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
