// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Dashboard Shell Layout
// Authenticated layout with sidebar, header, and mobile nav
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
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
  Wifi,
  WifiOff,
} from "lucide-react";

// ── Navigation Config ───────────────────────────────────────────────────────

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/browse", icon: Compass, label: "Explore" },
  { href: "/studio", icon: LayoutDashboard, label: "Studio" },
  { href: "/audio-rooms", icon: Mic, label: "Rooms" },
  { href: "/marketplace", icon: Clapperboard, label: "Market" },
  { href: "/scheduler", icon: Calendar, label: "Plan" },
  { href: "/analytics", icon: BarChart3, label: "Stats" },
];

const pageTitle: Record<string, string> = {
  "/": "Command Center",
  "/browse": "Global Grid",
  "/studio": "Creator Studio",
  "/audio-rooms": "Voice Nodes",
  "/marketplace": "Content Market",
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
  const [showNotifs, setShowNotifs] = useState(false);

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.username === "admin";

  const currentTitle = pageTitle[pathname] || "CYLive";

  return (
    <div className="flex flex-col md:flex-row h-screen bg-bg-deep overflow-hidden text-text-primary">
      {/* ── Sidebar Navigation (Desktop) ──────────────────────────────── */}
      <aside className="hidden md:flex w-24 flex-col items-center py-8 border-r border-border bg-bg-surface z-50 shrink-0">
        {/* Logo */}
        <Link
          href="/"
          className="w-12 h-12 bg-gradient-to-br from-accent to-cyan rounded-2xl flex items-center justify-center shadow-lg shadow-accent/25 mb-10 animate-glow-pulse shrink-0"
        >
          <Zap className="text-white fill-white" size={24} />
        </Link>

        {/* Nav Items */}
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
                  isActive
                    ? "nav-active text-white"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                }`}
              >
                <item.icon size={20} />
                <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      boxShadow: "0 0 28px rgba(255, 21, 100, 0.35)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-2 mt-4 w-full px-3 pt-4 border-t border-border">
          {isAdmin && (
            <Link
              href="/admin"
              title="Overlord Terminal"
              aria-label="Admin"
              className={`w-full p-3.5 rounded-2xl transition-all flex flex-col items-center gap-1.5 ${
                pathname === "/admin"
                  ? "nav-active text-gold"
                  : "text-text-muted hover:text-gold hover:bg-white/5"
              }`}
            >
              <Shield size={20} />
              <span className="text-[9px] font-bold uppercase tracking-wider">
                Admin
              </span>
            </Link>
          )}
          <Link
            href="/settings"
            title="Settings"
            aria-label="Settings"
            className={`w-full p-3.5 rounded-2xl transition-all flex flex-col items-center gap-1.5 ${
              pathname === "/settings"
                ? "nav-active text-white"
                : "text-text-muted hover:text-text-primary hover:bg-white/5"
            }`}
          >
            <Settings size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              Config
            </span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            aria-label="Sign Out"
            className="w-full p-3.5 rounded-2xl text-text-muted hover:text-red-400 hover:bg-red-500/5 transition-all flex flex-col items-center gap-1.5"
          >
            <LogOut size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              Exit
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100]">
        <nav className="h-16 bg-bg-surface/80 backdrop-blur-2xl border border-border rounded-[2rem] flex items-center justify-around px-4 shadow-2xl shadow-black/50">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative p-2 flex flex-col items-center gap-1 transition-all ${
                  isActive
                    ? "text-accent scale-110"
                    : "text-text-muted hover:text-text-primary"
                }`}
                aria-label={item.label}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -bottom-1 w-1 h-1 bg-accent rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="h-[60px] md:h-[68px] px-4 md:px-8 flex items-center justify-between border-b border-border bg-bg-surface/60 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="md:hidden w-8 h-8 bg-gradient-to-br from-accent to-cyan rounded-lg flex items-center justify-center">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-white truncate max-w-[150px] md:max-w-none tracking-tight">
                {currentTitle}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Wifi size={9} className="text-green" />
                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest text-text-muted">
                  Connected
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
                size={15}
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
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="Notifications"
              title="Notifications"
              className="p-2.5 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-colors relative"
            >
              <Bell size={18} className="text-text-muted" />
            </button>

            <div className="h-8 w-px bg-border" />

            <Link
              href="/settings"
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-accent to-cyan p-0.5 shrink-0 hover:scale-105 transition-transform overflow-hidden"
              aria-label="Profile"
            >
              <img
                src={
                  session?.user?.image ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${
                    session?.user?.email || "CYLive"
                  }`
                }
                className="w-full h-full rounded-[10px] bg-bg-card object-cover"
                alt="Avatar"
              />
            </Link>
          </div>
        </header>

        {/* ── Main Viewport ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 md:pb-8">
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
        </main>
      </div>
    </div>
  );
}
