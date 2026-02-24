import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Users,
  Layout,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Bell,
  Check,
  ChevronDown,
  Sparkles,
  Orbit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Scheduler: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  // ─── Modal State ────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [panelCount, setPanelCount] = useState(1);
  const [notify, setNotify] = useState(true);

  const scheduled = [
    {
      id: "1",
      title: "Synthesized Reality Showcase",
      panels: 3,
      date: "Oct 28",
      time: "14:00",
      desc: "A deep dive into neural rendering and spatial computing for live creators.",
      countdown: "03D : 04H : 12M",
      avatar: "🪐",
    },
    {
      id: "2",
      title: "Global AI Summit: The Rise of Aura",
      panels: 1,
      date: "Oct 30",
      time: "19:30",
      desc: "Exclusive interview with the leads of the Aura AI project.",
      countdown: "05D : 09H : 45M",
      avatar: "🔮",
    },
    {
      id: "3",
      title: "Level 9 Overlord Gaming",
      panels: 9,
      date: "Nov 02",
      time: "21:00",
      desc: "The first-ever 9-panel multicam stream featuring the top Overlord tier creators.",
      countdown: "08D : 11H : 20M",
      avatar: "👑",
    },
  ];

  const ScheduledCard = ({ item }: { item: any }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-panel p-6 flex flex-col md:flex-row gap-6 items-start group hover:border-accent/30 transition-all border-white/5 bg-surface-dark/40"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-1 shrink-0 shadow-2xl">
        <div className="w-full h-full bg-slate-900 rounded-[12px] flex items-center justify-center text-3xl">
          {item.avatar}
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-black text-white uppercase tracking-widest">
                {item.title}
              </h3>
              <span className="px-2 py-0.5 rounded-lg bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/20">
                {item.panels} PANELS
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest">
                <Calendar size={12} className="text-accent" /> {item.date}
              </div>
              <div className="flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-widest">
                <Clock size={12} className="text-accent" /> {item.time} UTC
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
              Commencing in
            </p>
            <p className="vbas-noya text-2xl text-white tracking-[0.1em]">
              {item.countdown}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          {item.desc}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
            <Edit3 size={14} /> Edit Plan
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/5 border border-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-white hover:bg-red-500 transition-all">
            <Trash2 size={14} /> Cancel
          </button>
          <div className="flex-1" />
          <button className="p-2 text-slate-700 hover:text-white transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="f-dot-stat text-3xl text-white tracking-widest uppercase leading-none mb-1">
            Transmission Schedule
          </h1>
          <p className="text-slate-500 text-sm">
            Plan and orchestrate future broadcasts and global events.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-accent px-8 py-4 rounded-2xl flex items-center gap-3 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} /> Create Schedule
        </button>
      </div>

      {/* ── List ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {scheduled.map((item) => (
          <ScheduledCard key={item.id} item={item} />
        ))}
      </div>

      {/* ── Create Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-panel w-full max-w-xl p-8 relative z-10 border-white/10 bg-surface-dark shadow-[0_32px_128px_rgba(0,0,0,0.8)]"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6">
                <Calendar size={32} />
              </div>

              <h2 className="f-dot-stat text-2xl text-white tracking-widest mb-2">
                SCHEDULE BROADCAST
              </h2>
              <p className="text-slate-500 text-xs mb-8 uppercase tracking-widest font-black">
                Reserve your slot in the global grid
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g. The Overlord Unveiling..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-accent outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Launch Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-accent outline-none color-scheme-dark"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Universal Time (UTC)
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-accent outline-none color-scheme-dark"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Panel Configuration
                  </label>
                  <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
                    {[1, 3, 9].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPanelCount(n)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                          panelCount === n
                            ? "bg-accent text-white shadow-lg"
                            : "text-slate-500 hover:text-white"
                        }`}
                      >
                        {n} {n === 1 ? "Panel" : "Panels"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-accent/10 text-accent">
                      <Bell size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">
                        Subscriber Alert
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Notify followers 1 hour before launch
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotify(!notify)}
                    className={`w-10 h-5 rounded-full transition-all relative ${notify ? "bg-accent" : "bg-slate-700"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${notify ? "left-5.5" : "left-0.5"}`}
                    />
                  </button>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-5 rounded-2xl bg-accent text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Confirm Manifest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scheduler;
