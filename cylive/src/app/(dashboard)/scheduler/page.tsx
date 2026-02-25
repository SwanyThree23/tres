// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Scheduler (Time Manifest)
//
// TYPOGRAPHY:
//   Bebas Neue       → page title, countdown values, section headers
//   Barlow Condensed → event titles, body, buttons
//   DM Mono          → date/time, genre pills, panel counts, labels
//
// BroadcastCard on all event cards
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";
import { Calendar, Plus, X, Bell, Grid3X3 } from "lucide-react";

interface ScheduledEvent {
  id: string;
  title: string;
  scheduledAt: string;
  panelCount: number;
  genre: string;
  notifyFollowers: boolean;
}

const mockEvents: ScheduledEvent[] = [
  {
    id: "1",
    title: "Weekend Vibes: Music & Community",
    scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    panelCount: 4,
    genre: "Music",
    notifyFollowers: true,
  },
  {
    id: "2",
    title: "Creator Roundtable: Monetization Tips",
    scheduledAt: new Date(Date.now() + 86400000 * 5).toISOString(),
    panelCount: 6,
    genre: "Education",
    notifyFollowers: true,
  },
  {
    id: "3",
    title: "Late Night Stand-Up: Open Mic",
    scheduledAt: new Date(Date.now() + 86400000 * 8).toISOString(),
    panelCount: 3,
    genre: "Comedy",
    notifyFollowers: false,
  },
];

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft("Starting soon");
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
}

function EventCard({ event }: { event: ScheduledEvent }) {
  const countdown = useCountdown(event.scheduledAt);
  const date = new Date(event.scheduledAt);

  return (
    <BroadcastCard className="group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Card title — Barlow Condensed Bold */}
          <h3 className="text-card-title-lg text-white truncate group-hover:text-[var(--accent)] transition-colors">
            {event.title}
          </h3>
          <div className="flex items-center gap-3 mt-2">
            {/* DM Mono genre badge */}
            <span
              className="text-readout-sm px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "var(--text-muted)",
              }}
            >
              {event.genre}
            </span>
            {/* DM Mono panel count */}
            <span
              className="text-readout-sm flex items-center gap-1"
              style={{ color: "var(--text-muted)" }}
            >
              <Grid3X3 size={9} />
              {event.panelCount} panels
            </span>
            {event.notifyFollowers && (
              <span
                className="text-readout-sm flex items-center gap-1"
                style={{ color: "var(--gold)" }}
              >
                <Bell size={9} />
                Notify
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0 ml-4">
          {/* Bebas Neue countdown */}
          <p
            className="font-stat"
            style={{ fontSize: "28px", color: "var(--accent)" }}
          >
            {countdown}
          </p>
          {/* DM Mono date/time */}
          <p className="text-timestamp">
            {date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
            {" at "}
            {date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>
      </div>
    </BroadcastCard>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function SchedulerPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [panels, setPanels] = useState(1);
  const [notify, setNotify] = useState(true);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      className="space-y-6 max-w-5xl mx-auto"
    >
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between"
      >
        <div>
          {/* Bebas Neue page title */}
          <h1 className="text-page-title text-white flex items-center gap-3">
            <Calendar size={22} style={{ color: "var(--accent)" }} />
            Time Manifest
          </h1>
          {/* DM Mono readout */}
          <p
            className="text-readout mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            {mockEvents.length} upcoming broadcasts scheduled
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Schedule
        </button>
      </motion.div>

      {/* Events List */}
      <div className="space-y-4">
        {mockEvents.map((event, i) => (
          <motion.div
            key={event.id}
            variants={fadeUp}
            custom={i}
            transition={{ delay: i * 0.05 }}
          >
            <EventCard event={event} />
          </motion.div>
        ))}
      </div>

      {/* ── Create Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel-elevated p-8 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-section-header-lg text-white">
                  Schedule Stream
                </h3>
                <button
                  onClick={() => setShowCreate(false)}
                  aria-label="Close"
                  className="p-2 rounded-lg hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  <X size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="sched-title" className="input-label">
                    Stream Title
                  </label>
                  <input
                    id="sched-title"
                    type="text"
                    placeholder="What are you planning?"
                    className="input-field"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="sched-date" className="input-label">
                      Date
                    </label>
                    <input
                      id="sched-date"
                      type="date"
                      className="input-field"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="sched-time" className="input-label">
                      Time
                    </label>
                    <input
                      id="sched-time"
                      type="time"
                      className="input-field"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Panel Count</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 6, 9].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPanels(n)}
                        className="aspect-square rounded-lg text-readout flex items-center justify-center transition-all"
                        style={{
                          background:
                            panels === n
                              ? "var(--accent)"
                              : "rgba(255,255,255,0.04)",
                          color: panels === n ? "white" : "var(--text-muted)",
                          border: `1px solid ${panels === n ? "var(--accent)" : "var(--border)"}`,
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Bell size={16} style={{ color: "var(--gold)" }} />
                    <div>
                      <p className="text-card-title text-white">
                        Notify Followers
                      </p>
                      <p
                        className="text-readout-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Send reminder 10 min before stream
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotify(!notify)}
                    aria-label={notify ? "Disable" : "Enable"}
                    className="toggle-track"
                    data-active={notify}
                  >
                    <div className="toggle-knob" data-active={notify} />
                  </button>
                </div>

                <button
                  disabled={!title.trim() || !date || !time}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Calendar size={16} />
                  Schedule Broadcast
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
