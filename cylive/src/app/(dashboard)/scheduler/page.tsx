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

export default function SchedulerPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [panels, setPanels] = useState(1);
  const [notify, setNotify] = useState(true);
  const [genre, setGenre] = useState("CULTURE");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function fetchSchedules() {
      if (!session?.user?.id) return;
      try {
        const res = await fetch(
          `/api/streams?status=SCHEDULED&userId=${session.user.id}`,
        );
        const data = await res.json();
        const mapped = data.streams.map((s: any) => ({
          id: s.id,
          title: s.title,
          scheduledAt: s.scheduledAt,
          panelCount: s.panelCount,
          genre: s.genre,
          notifyFollowers: true,
        }));
        setEvents(mapped);
      } catch (err) {
        console.error("Schedule fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, [session?.user?.id]);

  const handleSchedule = async () => {
    if (!title.trim() || !date || !time) return;
    setIsCreating(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          genre,
          panelCount: panels,
          scheduledAt,
        }),
      });
      const data = await res.json();
      if (data.stream) {
        const newEvent = {
          id: data.stream.id,
          title: data.stream.title,
          scheduledAt: data.stream.scheduledAt,
          panelCount: data.stream.panelCount,
          genre: data.stream.genre,
          notifyFollowers: true,
        };
        setEvents((prev) => [newEvent, ...prev]);
        setShowCreate(false);
        setTitle("");
        setDate("");
        setTime("");
      }
    } catch (err) {
      console.error("Create schedule error:", err);
    } finally {
      setIsCreating(false);
    }
  };

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
            {events.length} upcoming broadcasts scheduled
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
        {events.map((event, i) => (
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
                  onClick={handleSchedule}
                  disabled={!title.trim() || !date || !time || isCreating}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isCreating ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Calendar size={16} />
                  )}
                  {isCreating ? "Scheduling..." : "Schedule Broadcast"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
