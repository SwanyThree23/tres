// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Settings Page
//
// Profile, notifications, subscription tier, stream keys, security
//
// TYPOGRAPHY:
//   Bebas Neue       → page title, section headers
//   Barlow Condensed → labels, body, buttons
//   DM Mono          → current values, readouts, badges
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { Avatar } from "@/components/primitives/Avatar";
import { TierBadge } from "@/components/primitives/Badge";
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Key,
  Save,
  Copy,
  LogOut,
  Eye,
} from "lucide-react";

type SettingsTab =
  | "profile"
  | "notifications"
  | "billing"
  | "security"
  | "appearance"
  | "stream";

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User size={16} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { id: "billing", label: "Billing", icon: <CreditCard size={16} /> },
  { id: "security", label: "Security", icon: <Shield size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  { id: "stream", label: "Stream", icon: <Key size={16} /> },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [displayName, setDisplayName] = useState(
    session?.user?.displayName || session?.user?.username || "",
  );
  const [username, setUsername] = useState(session?.user?.username || "");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState({
    tips: true,
    followers: true,
    streams: true,
    promotions: false,
  });
  const [saving, setSaving] = useState(false);
  const [ingestUrl] = useState("rtmps://ingest.cylive.app/live");
  const [streamKey, setStreamKey] = useState("sk_xxxxxxxxxxxxxxxxxxxx"); // Placeholder for stream key
  const [showStreamKey, setShowStreamKey] = useState(false);

  const tier = (session?.user?.tier as string) || "FREE";

  const handleSave = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${session.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          bio,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save changes");
      }

      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error("[Settings] Save Error:", err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className="max-w-5xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-page-title text-white flex items-center gap-3">
          <Settings size={22} style={{ color: "var(--text-muted)" }} />
          Settings
        </h1>
        <p className="text-readout mt-1" style={{ color: "var(--text-muted)" }}>
          Manage your account, preferences, and stream configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <div className="glass-panel p-3 lg:sticky lg:top-6 self-start space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-body-sm transition-all text-left"
              style={{
                background:
                  activeTab === tab.id ? "var(--accent)" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text-muted)",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <div
            className="border-t my-2"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-body-sm transition-all text-left hover:bg-white/5"
            style={{ color: "var(--accent)" }}
            aria-label="Sign Out"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5">
          {/* ── Profile Tab ───────────────────────────────────────── */}
          {activeTab === "profile" && (
            <BroadcastCard>
              <h2 className="text-section-header text-white mb-6">Profile</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-6">
                <Avatar
                  size="lg"
                  alt={displayName}
                  src={session?.user?.avatarUrl || undefined}
                  verified={session?.user?.verified}
                />
                <div>
                  <p className="text-card-title text-white">
                    {displayName || "Your Name"}
                  </p>
                  <p
                    className="text-readout-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    @{username || "username"}
                  </p>
                  <button
                    className="text-body-sm mt-2 px-3 py-1 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "var(--cyan)",
                    }}
                    aria-label="Change Avatar"
                  >
                    Change Avatar
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="set-displayname" className="input-label">
                    Display Name
                  </label>
                  <input
                    id="set-displayname"
                    type="text"
                    className="input-field"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    aria-label="Display Name"
                  />
                </div>
                <div>
                  <label htmlFor="set-username" className="input-label">
                    Username
                  </label>
                  <div className="relative">
                    <span
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-readout-sm"
                      style={{ color: "var(--text-dim)" }}
                    >
                      @
                    </span>
                    <input
                      id="set-username"
                      type="text"
                      className="input-field pl-8"
                      value={username}
                      onChange={(e) =>
                        setUsername(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, ""),
                        )
                      }
                      aria-label="Username"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="set-bio" className="input-label">
                    Bio
                  </label>
                  <textarea
                    id="set-bio"
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Tell viewers about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    aria-label="Bio"
                  />
                </div>
                <div>
                  <label htmlFor="set-email" className="input-label">
                    Email
                  </label>
                  <input
                    id="set-email"
                    type="email"
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="Email"
                  />
                </div>
                <div>
                  <label htmlFor="set-lang" className="input-label">
                    Preferred Language
                  </label>
                  <select
                    id="set-lang"
                    className="input-field"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    aria-label="Preferred Language"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 mt-6"
                aria-label={saving ? "Saving changes" : "Save Changes"}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </BroadcastCard>
          )}

          {/* ── Notifications Tab ─────────────────────────────────── */}
          {activeTab === "notifications" && (
            <BroadcastCard>
              <h2 className="text-section-header text-white mb-6">
                Notifications
              </h2>
              <div className="space-y-4">
                {[
                  {
                    key: "tips" as const,
                    label: "Tip Received",
                    desc: "Get notified when someone tips you",
                  },
                  {
                    key: "followers" as const,
                    label: "New Follower",
                    desc: "Get notified for new followers",
                  },
                  {
                    key: "streams" as const,
                    label: "Stream Reminders",
                    desc: "Reminder before your scheduled streams",
                  },
                  {
                    key: "promotions" as const,
                    label: "Promotions",
                    desc: "Platform updates and offers",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <p className="text-card-title text-white">{item.label}</p>
                      <p
                        className="text-readout-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((n) => ({
                          ...n,
                          [item.key]: !n[item.key],
                        }))
                      }
                      aria-label={`Toggle ${item.label} notifications`}
                      className="toggle-track"
                      data-active={notifications[item.key]}
                    >
                      <div
                        className="toggle-knob"
                        data-active={notifications[item.key]}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </BroadcastCard>
          )}

          {/* ── Billing Tab ───────────────────────────────────────── */}
          {activeTab === "billing" && (
            <BroadcastCard>
              <h2 className="text-section-header text-white mb-6">
                Subscription
              </h2>
              <div
                className="flex items-center gap-4 mb-6 p-5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                }}
              >
                <TierBadge
                  tier={tier as "FREE" | "CREATOR" | "PRO" | "STUDIO"}
                  size="md"
                />
                <div>
                  <p className="text-card-title text-white">
                    Current Tier: {tier}
                  </p>
                  <p
                    className="text-readout-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {tier === "FREE"
                      ? "Upgrade to unlock multi-panel streaming and AI features"
                      : `Next billing date: March 1, 2026`}
                  </p>
                </div>
              </div>
              <button
                className="btn-gold flex items-center gap-2"
                aria-label={
                  tier === "FREE" ? "Upgrade Now" : "Manage Subscription"
                }
              >
                <CreditCard size={14} />
                {tier === "FREE" ? "Upgrade Now" : "Manage Subscription"}
              </button>
            </BroadcastCard>
          )}

          {/* ── Security Tab ──────────────────────────────────────── */}
          {activeTab === "security" && (
            <BroadcastCard>
              <h2 className="text-section-header text-white mb-6">Security</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="set-current-pw" className="input-label">
                    Current Password
                  </label>
                  <input
                    id="set-current-pw"
                    type="password"
                    placeholder="Enter current password"
                    className="input-field"
                    autoComplete="current-password"
                    aria-label="Current Password"
                  />
                </div>
                <div>
                  <label htmlFor="set-new-pw" className="input-label">
                    New Password
                  </label>
                  <input
                    id="set-new-pw"
                    type="password"
                    placeholder="Enter new password"
                    className="input-field"
                    autoComplete="new-password"
                    aria-label="New Password"
                  />
                </div>
                <div>
                  <label htmlFor="set-confirm-pw" className="input-label">
                    Confirm New Password
                  </label>
                  <input
                    id="set-confirm-pw"
                    type="password"
                    placeholder="Confirm new password"
                    className="input-field"
                    autoComplete="new-password"
                    aria-label="Confirm New Password"
                  />
                </div>
                <button
                  className="btn-primary flex items-center gap-2 mt-2"
                  aria-label="Update Password"
                >
                  <Shield size={14} />
                  Update Password
                </button>
              </div>
            </BroadcastCard>
          )}

          {/* ── Appearance Tab ────────────────────────────────────── */}
          {activeTab === "appearance" && (
            <BroadcastCard>
              <h2 className="text-section-header text-white mb-6">
                Appearance
              </h2>
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <p className="text-card-title text-white">Dark Mode</p>
                  <p
                    className="text-readout-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    CYLive is designed for dark mode. Light mode coming soon.
                  </p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  aria-label="Toggle dark mode"
                  className="toggle-track"
                  data-active={darkMode}
                >
                  <div className="toggle-knob" data-active={darkMode} />
                </button>
              </div>
            </BroadcastCard>
          )}

          {/* ── Stream Tab ────────────────────────────────────────── */}
          {activeTab === "stream" && (
            <BroadcastCard>
              <h2 className="text-section-header text-white mb-6">
                Stream Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="input-label">RTMP Ingest URL</label>
                  <div className="relative flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={ingestUrl || ""}
                      className="input-field py-1.5 text-[10px] font-mono"
                      aria-label="Ingest URL"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(ingestUrl || "");
                        alert("Ingest URL copied!");
                      }}
                      className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      aria-label="Copy Ingest URL"
                      title="Copy Ingest URL"
                    >
                      <Copy size={12} className="text-text-muted" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="input-label">Stream Key</label>
                  <div className="relative flex items-center gap-2">
                    <input
                      type={showStreamKey ? "text" : "password"}
                      readOnly
                      value={
                        showStreamKey ? streamKey : "sk_••••••••••••••••••••"
                      }
                      className="input-field py-1.5 text-[10px] font-mono"
                      aria-label="Stream Key"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(streamKey || "");
                        alert("Stream Key copied!");
                      }}
                      className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                      aria-label="Copy Stream Key"
                      title="Copy Stream Key"
                    >
                      <Copy size={12} className="text-text-muted" />
                    </button>
                  </div>
                  <p
                    className="text-readout-sm mt-1.5 ml-1"
                    style={{ color: "var(--text-dim)" }}
                  >
                    Never share your stream key publicly
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={() => setShowStreamKey(!showStreamKey)}
                    className="btn-ghost flex items-center gap-2"
                    aria-label={showStreamKey ? "Hide Key" : "Reveal Key"}
                  >
                    <Eye size={14} />
                    {showStreamKey ? "Hide Key" : "Reveal Key"}
                  </button>
                  <button
                    className="btn-ghost flex items-center gap-2"
                    aria-label="Regenerate Stream Key"
                  >
                    <Key size={14} />
                    Regenerate
                  </button>
                </div>
              </div>
            </BroadcastCard>
          )}
        </div>
      </div>
    </motion.div>
  );
}
