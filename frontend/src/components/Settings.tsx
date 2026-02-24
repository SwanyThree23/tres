import React, { useState } from "react";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Lock,
  LogOut,
  ChevronRight,
  Camera,
  Check,
  Zap,
  Star,
  Crown,
  Wallet,
  Smartphone,
  Mail,
  Globe,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

type SettingsTab =
  | "profile"
  | "payouts"
  | "notifications"
  | "subscription"
  | "privacy";

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // ─── Profile State ──────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState("");

  // ─── Notification Toggles ───────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    newStream: true,
    tips: true,
    subs: true,
    email: false,
  });

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "profile", label: "My Identity", icon: User },
    { id: "payouts", label: "Financials", icon: Wallet },
    { id: "notifications", label: "Preferences", icon: Bell },
    { id: "subscription", label: "Tier Plan", icon: Zap },
    { id: "privacy", label: "Security", icon: Shield },
  ];

  const ToggleRow = ({ title, subtitle, active, onToggle }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div>
        <p className="text-xs font-black text-white uppercase tracking-widest">
          {title}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-all relative ${active ? "bg-accent" : "bg-slate-700"}`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${active ? "left-5.5" : "left-0.5"}`}
        />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in max-w-6xl mx-auto h-full pb-20">
      {/* ── Sidebar Nav ──────────────────────────────────────────── */}
      <aside className="lg:w-64 flex flex-col gap-2 shrink-0">
        <h2 className="f-dot-stat text-2xl text-white tracking-widest uppercase mb-6 px-4">
          Workspace
        </h2>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-lg shadow-accent/20"
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto px-4 pt-8">
          <button
            onClick={logout}
            className="flex items-center gap-3 text-slate-500 hover:text-color-red transition-all text-[11px] font-black uppercase tracking-widest"
          >
            <LogOut size={16} /> Terminate Session
          </button>
        </div>
      </aside>

      {/* ── Content Area ─────────────────────────────────────────── */}
      <main className="flex-1 glass-panel p-8 min-h-[600px] border-white/10 bg-surface-dark/40 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── Profile View ───────────────────────────────── */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <section className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-violet-500 to-cyan-500 p-1">
                      <div className="w-full h-full bg-slate-900 rounded-[2.3rem] overflow-hidden">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || "Felix"}`}
                          className="w-full h-full object-cover"
                          alt="Avatar"
                        />
                      </div>
                    </div>
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-accent text-white rounded-2xl flex items-center justify-center border-4 border-surface-dark group-hover:scale-110 transition-transform shadow-xl">
                      <Camera size={18} />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-white tracking-tight">
                        {user?.display_name || "Cyber Streamer"}
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-color-gold text-black text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                        <Crown size={10} /> {user?.tier || "Pro"}
                      </span>
                    </div>
                    <p className="dim-dm-mono text-sm">
                      @{user?.username || "cyber_streamer"}
                    </p>
                    <div className="flex gap-4 pt-2">
                      <div>
                        <p className="text-white font-bold text-sm">1.2K</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black uppercase tracking-widest">
                          Followers
                        </p>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">482</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black uppercase tracking-widest">
                          Streams
                        </p>
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">$4.2K</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black uppercase tracking-widest">
                          Monthly Vol
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Universal Identity Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-accent outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Public Transmission Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the world about your digital presence..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-accent outline-none min-h-[120px] resize-none"
                    />
                  </div>
                  <button className="bg-accent px-10 py-4 rounded-2xl text-[11px] font-black text-white uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all">
                    Save Manifest
                  </button>
                </div>
              </div>
            )}

            {/* ── Payouts View ───────────────────────────────── */}
            {activeTab === "payouts" && (
              <div className="space-y-8">
                <section className="p-8 rounded-[2rem] bg-gradient-to-br from-color-green/10 to-transparent border border-color-green/10 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-color-green/20 flex items-center justify-center text-color-green">
                    <CreditCard size={32} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-1">
                      Creator Payout Schema
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      90% Net Payout • 48-Hour Processing • $20.00 Minimum
                      Threshold
                      <br />
                      Funds are directly routed via Stripe Connect or
                      CyberVault.
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 bg-white/5 border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                      Linked Payment Gateways
                    </h4>
                    <div className="space-y-3">
                      {["CashApp", "Venmo", "PayPal", "Stripe"].map((app) => (
                        <button
                          key={app}
                          className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-accent transition-all group"
                        >
                          <span className="text-sm font-bold text-white transition-colors group-hover:text-accent">
                            {app}
                          </span>
                          <ChevronRight size={16} className="text-slate-600" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel p-6 bg-gradient-to-br from-accent/10 to-transparent border-accent/10 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                        Liquid Balance
                      </h4>
                      <p className="vbas-noya text-5xl text-white tracking-widest">
                        $1,240<span className="text-lg opacity-40">.42</span>
                      </p>
                    </div>
                    <button className="w-full py-4 rounded-2xl bg-color-green text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-color-green/20 mt-8">
                      Request Quick Draw
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Subscription View ────────────────────────────── */}
            {activeTab === "subscription" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      id: "standard",
                      name: "Identity",
                      price: "0",
                      color: "bg-slate-500",
                      perks: [
                        "720p Streaming",
                        "1 Guest Panel",
                        "Basic Analytics",
                      ],
                    },
                    {
                      id: "pro",
                      name: "Executive",
                      price: "29",
                      color: "bg-accent",
                      perks: [
                        "4K Streaming",
                        "3 Guest Panels",
                        "Aura Co-host Access",
                        "Custom Vaults",
                      ],
                    },
                    {
                      id: "elite",
                      name: "Overlord",
                      price: "99",
                      color: "bg-color-gold",
                      perks: [
                        "8K Spatial Sync",
                        "9 Guest Panels",
                        "AI Model Training",
                        "Zero-Fee Marketplace",
                      ],
                    },
                  ].map((tier) => (
                    <div
                      key={tier.id}
                      className={`glass-panel p-6 border-white/5 flex flex-col h-full relative overflow-hidden group hover:scale-[1.02] transition-all ${tier.id === "pro" ? "border-accent shadow-2xl bg-accent/5" : ""}`}
                    >
                      {tier.id === "pro" && (
                        <div className="absolute top-4 right-4 bg-accent text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded">
                          Popular
                        </div>
                      )}
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1">
                        {tier.name} Plan
                      </h3>
                      <p className="vbas-noya text-4xl text-white tracking-widest mb-6">
                        ${tier.price}
                        <span className="text-sm opacity-50">/MO</span>
                      </p>
                      <ul className="space-y-3 flex-1">
                        {tier.perks.map((p) => (
                          <li
                            key={p}
                            className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tighter"
                          >
                            <Check size={12} className="text-color-green" /> {p}
                          </li>
                        ))}
                      </ul>
                      <button
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-8 transition-all ${
                          tier.id === "pro"
                            ? "bg-accent text-white"
                            : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {tier.id === (user?.tier?.toLowerCase() || "standard")
                          ? "Current Active"
                          : "Initiate Shift"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Notifications View ──────────────────────────── */}
            {activeTab === "notifications" && (
              <div className="space-y-2">
                <ToggleRow
                  title="New Stream Propagation"
                  subtitle="Notify me when creators I follow go live in the grid."
                  active={notifs.newStream}
                  onToggle={() =>
                    setNotifs({ ...notifs, newStream: !notifs.newStream })
                  }
                />
                <ToggleRow
                  title="Direct Transmissions"
                  subtitle="Push alerts for new DMs and encrypted messages."
                  active={true}
                  onToggle={() => {}}
                />
                <ToggleRow
                  title="Tip & Transaction Sync"
                  subtitle="Real-time alerts for donations, NFT sales, and vault shifts."
                  active={notifs.tips}
                  onToggle={() => setNotifs({ ...notifs, tips: !notifs.tips })}
                />
                <ToggleRow
                  title="Weekly Performance Digest"
                  subtitle="Summarized AI analytics delivered via electronic mail."
                  active={notifs.email}
                  onToggle={() =>
                    setNotifs({ ...notifs, email: !notifs.email })
                  }
                />
              </div>
            )}

            {/* ── Privacy View ─────────────────────────────────── */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <ToggleRow
                    title="Public Presence Profile"
                    subtitle="Allow others to discover your profile in search."
                    active={true}
                    onToggle={() => {}}
                  />
                  <ToggleRow
                    title="Manifest Earnings Display"
                    subtitle="Show your total platform revenue on your public profile."
                    active={false}
                    onToggle={() => {}}
                  />
                  <ToggleRow
                    title="Direct Transmission Gateway"
                    subtitle="Enable incoming DM requests from any identity."
                    active={true}
                    onToggle={() => {}}
                  />
                </div>
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                    Crucial Zone
                  </p>
                  <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs font-bold w-full md:w-auto">
                    Purge Identity Manifest (Delete Account)
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Settings;
