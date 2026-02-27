// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Dashboard Shell Layout
// Sidebar + Header with SignalBars + Mobile Nav
//
// TYPOGRAPHY:
//   Bebas Neue for page titles
//   Barlow Condensed for nav labels, body
//   DM Mono for status readouts
//
// SIGNAL BARS appear in the header (required)
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { SignalBars } from "@/components/primitives/SignalBars";
import { Avatar } from "@/components/primitives/Avatar";
import { TierBadge } from "@/components/primitives/Badge";
import {
  Zap,
  Home,
  Compass,
  LayoutDashboard,
  Mic,
  Clapperboard,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Bell,
  Search,
} from "lucide-react";

// ── Navigation Config ───────────────────────────────────────────────────────

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/browse", icon: Compass, label: "Explore" },
  { href: "/studio", icon: LayoutDashboard, label: "Studio" },
  { href: "/audio-rooms", icon: Mic, label: "Rooms" },
  { href: "/community", icon: Users, label: "Forum" },
  { href: "/marketplace", icon: Clapperboard, label: "Market" },
  { href: "/scheduler", icon: Calendar, label: "Plan" },
  { href: "/analytics", icon: BarChart3, label: "Stats" },
];

// Page titles use Bebas Neue
const pageTitle: Record<string, string> = {
  "/dashboard": "Command Center",
  "/browse": "Global Grid",
  "/studio": "Creator Studio",
  "/audio-rooms": "Voice Nodes",
  "/marketplace": "Content Market",
  "/community": "Inner Circle Forum",
  "/scheduler": "Time Manifest",
  "/analytics": "Performance Matrix",
  "/settings": "Manifest Config",
  "/admin": "Overlord Terminal",
};

// ── Layout Component ────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.username === "admin";

  const currentTitle = pageTitle[pathname] || "SEEWHY LIVE";
  const tier = (session?.user?.tier || "FREE") as
    | "FREE"
    | "CREATOR"
    | "PRO"
    | "STUDIO";

  return (
    <div
      className="flex flex-col md:flex-row h-screen overflow-hidden"
      style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}
    >
      {/* ── Sidebar Navigation (Desktop) ──────────────────────────── */}
      <aside
        className="hidden md:flex w-24 flex-col items-center py-8 border-r z-50 shrink-0"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-surface)",
        }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg mb-10 animate-glow-pulse shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--cyan))",
            boxShadow: "0 0 20px rgba(255, 21, 100, 0.25)",
          }}
        >
          <Zap className="text-white fill-white" size={24} />
        </Link>

        {/* Nav Items — Barlow Condensed labels */}
        <nav className="flex-1 flex flex-col items-center gap-2 w-full px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className={`relative w-full p-3.5 rounded-2xl transition-all duration-200 flex flex-col items-center gap-1.5 group ${
                  isActive ? "nav-active text-white" : "hover:bg-white/5"
                }`}
                style={{ color: isActive ? "white" : "var(--text-muted)" }}
              >
                <item.icon size={20} />
                {/* Nav label — Barlow Condensed, tiny uppercase */}
                <span
                  className="text-button"
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ boxShadow: "var(--glow-accent)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div
          className="flex flex-col items-center gap-2 mt-4 w-full px-3 pt-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {isAdmin && (
            <Link
              href="/admin"
              title="Overlord Terminal"
              aria-label="Admin"
              className={`w-full p-3.5 rounded-2xl transition-all flex flex-col items-center gap-1.5 ${
                pathname === "/admin" ? "nav-active" : "hover:bg-white/5"
              }`}
              style={{
                color:
                  pathname === "/admin" ? "var(--gold)" : "var(--text-muted)",
              }}
            >
              <Shield size={20} />
              <span
                className="text-button"
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                Admin
              </span>
            </Link>
          )}
          <Link
            href="/settings"
            title="Settings"
            aria-label="Settings"
            className={`w-full p-3.5 rounded-2xl transition-all flex flex-col items-center gap-1.5 ${
              pathname === "/settings" ? "nav-active" : "hover:bg-white/5"
            }`}
            style={{
              color: pathname === "/settings" ? "white" : "var(--text-muted)",
            }}
          >
            <Settings size={20} />
            <span
              className="text-button"
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Config
            </span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            aria-label="Sign Out"
            className="w-full p-3.5 rounded-2xl transition-all flex flex-col items-center gap-1.5 hover:bg-red-500/5"
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={20} />
            <span
              className="text-button"
              style={{
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
              }}
            >
              Exit
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-[34px] left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100]">
        <nav
          className="h-16 backdrop-blur-2xl rounded-[2rem] flex items-center justify-around px-4 shadow-2xl shadow-black/50"
          style={{
            background: "rgba(10, 10, 20, 0.8)",
            border: "1px solid var(--border)",
          }}
        >
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative p-2 flex flex-col items-center gap-1 transition-all"
                style={{
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                }}
                aria-label={item.label}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-1 w-1 h-1 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Top Header — contains SignalBars (required) ────────── */}
        <header
          className="h-[60px] md:h-[68px] px-4 md:px-8 flex items-center justify-between shrink-0"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "rgba(10, 10, 20, 0.6)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile logo */}
            <div
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--cyan))",
              }}
            >
              <Zap className="text-white fill-white" size={16} />
            </div>

            <div>
              {/* Page title — Bebas Neue */}
              <h2 className="text-page-title text-white truncate max-w-[150px] md:max-w-none">
                {currentTitle}
              </h2>
              {/* Status readout — DM Mono with SignalBars */}
              <div className="flex items-center gap-2 mt-0.5">
                <SignalBars size="sm" color="green" />
                <span
                  className="text-readout-sm hidden sm:inline"
                  style={{ color: "var(--text-muted)" }}
                >
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar — Barlow Condensed */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                size={15}
                style={{ color: "var(--text-muted)" }}
              />
              <input
                id="global-search"
                type="text"
                placeholder="Search streams, creators, clips..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Tier badge — DM Mono */}
            <TierBadge tier={tier} size="sm" />

            <button
              aria-label="Notifications"
              title="Notifications"
              className="p-2.5 rounded-xl hover:bg-white/10 transition-colors relative"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
              }}
            >
              <Bell size={18} style={{ color: "var(--text-muted)" }} />
            </button>

            <div className="h-8 w-px" style={{ background: "var(--border)" }} />

            <Link
              href="/settings"
              aria-label="Profile"
              className="shrink-0 hover:scale-105 transition-transform"
            >
              <Avatar
                src={session?.user?.avatarUrl}
                alt={session?.user?.displayName || "Profile"}
                size="sm"
                verified={session?.user?.verified}
              />
            </Link>
          </div>
        </header>

        {/* ── Main Viewport ──────────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative"
          style={{ paddingBottom: "calc(var(--chiron-height) + 100px)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>

          {/* ── Beta Footer ────────────────────────────────────────── */}
          <footer className="mt-20 py-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex bg- Burgundy/10 items-center gap-2 px-3 py-1.5 rounded-lg border border-red/20">
              <Shield size={14} className="text-red" />
              <span className="text-readout-sm text-red font-bold">
                Beta Phase v1.0.4
              </span>
            </div>

            <nav className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-readout-sm text-text-muted hover:text-gold transition-colors"
              >
                Agreement
              </Link>
              <Link
                href="/guidelines"
                className="text-readout-sm text-text-muted hover:text-gold transition-colors"
              >
                Guidelines
              </Link>
              <Link
                href="/privacy"
                className="text-readout-sm text-text-muted hover:text-gold transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/support/bug-report"
                className="text-readout-sm text-text-muted hover:text-gold transition-colors font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
              >
                Report Bug
              </Link>
            </nav>

            <p className="text-readout-sm text-text-dim">
              &copy; 2026 CYLive Inner Circle. All circuits reserved.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
