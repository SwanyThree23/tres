import React, { useState } from "react";
import {
  Play,
  Clock,
  DollarSign,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Plus,
  Film,
  Lock,
  ChevronRight,
  Eye,
  User,
  X,
  Info,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VideoPosts: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Upload Form State ──────────────────────────────────────────────────
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [paywallEnabled, setPaywallEnabled] = useState(false);
  const [paywallPrice, setPaywallPrice] = useState("5.00");

  const posts = [
    {
      id: "1",
      title: "Cyberpunk Aesthetic Breakdown",
      creator: "NeonVibe",
      views: "1.2K",
      duration: "12:44",
      thumb: "🌆",
      price: null,
    },
    {
      id: "2",
      title: "AI Ethics in 2024",
      creator: "CyberPunker",
      views: "840",
      duration: "08:15",
      thumb: "🤖",
      price: "10.00",
    },
    {
      id: "3",
      title: "Neo-Tokyo Street Food",
      creator: "GhostWalker",
      views: "2.5K",
      duration: "15:20",
      thumb: "🍜",
      price: null,
    },
    {
      id: "4",
      title: "Low-Fi Beats Session",
      creator: "TechnoMage",
      views: "5.1K",
      duration: "45:00",
      thumb: "🎧",
      price: "5.00",
    },
    {
      id: "5",
      title: "Synthesized Reality",
      creator: "Starlight",
      views: "920",
      duration: "10:10",
      thumb: "🌌",
      price: "2.50",
    },
    {
      id: "6",
      title: "The Future of Web 5.0",
      creator: "BitMaster",
      views: "3.3K",
      duration: "22:30",
      thumb: "💎",
      price: null,
    },
  ];

  const VideoCard = ({ post }: { post: any }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="glass-panel overflow-hidden group border-white/5 bg-surface-dark/40"
    >
      {/* Thumbnail Area */}
      <div className="h-[140px] relative bg-slate-900 flex items-center justify-center overflow-hidden">
        {/* Grid Overlay */}
        <div
          className="absolute inset-0 z-10 opacity-10"
          style={{
            backgroundSize: "10px 10px",
            backgroundImage:
              "linear-gradient(to right, grey 1px, transparent 1px), linear-gradient(to bottom, grey 1px, transparent 1px)",
          }}
        />

        {/* Emoji Thumb */}
        <span className="text-5xl group-hover:scale-125 transition-transform duration-500 z-0">
          {post.thumb}
        </span>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
          {post.duration}
        </div>
        {post.price && (
          <div className="absolute top-3 right-3 z-20 bg-color-gold text-black px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_12px_rgba(251,191,36,0.5)]">
            <Lock size={10} /> ${post.price}
          </div>
        )}

        {/* Hover Play Button */}
        <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
            <Play size={20} fill="white" />
          </div>
        </div>
      </div>

      {/* Info Below */}
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-black text-white leading-tight truncate">
          {post.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 p-0.5">
              <div className="w-full h-full bg-slate-900 rounded-[7px] flex items-center justify-center text-[10px]">
                {post.creator[0]}
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {post.creator}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Eye size={12} />
            <span className="text-[10px] font-bold">{post.views}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="animate-fade-in space-y-8 pb-24">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="f-dot-stat text-3xl text-white tracking-widest uppercase mb-1 leading-none">
            Creator Marketplace
          </h1>
          <p className="text-slate-500 text-sm">
            Upload, sell, and discover premium video content.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              size={16}
            />
            <input
              type="text"
              placeholder="Search video posts..."
              className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-accent w-64"
            />
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-accent px-6 py-3 rounded-2xl flex items-center gap-2 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Upload size={16} /> Upload Video
          </button>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        {[
          "All Clips",
          "Premium",
          "Free",
          "Music",
          "Education",
          "Lifestyle",
        ].map((f, i) => (
          <button
            key={f}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${
              i === 0
                ? "bg-white/10 text-white border-white/20"
                : "text-slate-500 border-white/5 hover:border-white/10"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        {posts.map((post) => (
          <VideoCard key={post.id} post={post} />
        ))}
      </div>

      {/* ── Upload Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-panel w-full max-w-xl p-8 relative z-10 border-white/10 bg-surface-dark shadow-[0_32px_128px_rgba(0,0,0,0.8)]"
            >
              <button
                onClick={() => setShowUploadModal(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white"
              >
                <X size={24} />
              </button>

              <h2 className="f-dot-stat text-2xl text-white tracking-widest mb-6">
                MINT NEW CONTENT
              </h2>

              <div className="space-y-6">
                {/* Drag & Drop Zone */}
                <div className="group relative border-2 border-dashed border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-accent group-hover:scale-110 transition-all">
                    <Film size={32} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">
                      Select Video to Upload
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                      MP4, MOV, or WEBM up to 2GB
                    </p>
                  </div>

                  {/* License Note on Hover */}
                  <div className="absolute inset-0 bg-bg-surface flex items-center justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-3xl">
                    <div className="flex gap-4 items-start">
                      <ShieldCheck
                        className="text-color-green shrink-0"
                        size={24}
                      />
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
                          Upload License Agreement
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          By uploading, you certify that you own all rights and
                          grant CYLive the ability to distribute this content
                          globally. AI generation tags must be disclosed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Catchy, viral-ready title..."
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                      Description
                    </label>
                    <textarea
                      value={uploadDesc}
                      onChange={(e) => setUploadDesc(e.target.value)}
                      placeholder="What's this video about?"
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-5 py-3 text-sm text-white outline-none focus:border-accent min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Paywall Toggle */}
                <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl transition-colors ${paywallEnabled ? "bg-color-gold/10 text-color-gold" : "bg-slate-700 text-slate-500"}`}
                      >
                        <Lock size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">
                          Premium Content
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Require payment to view this video
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPaywallEnabled(!paywallEnabled)}
                      className={`w-12 h-6 rounded-full transition-all relative ${paywallEnabled ? "bg-color-gold" : "bg-slate-700"}`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${paywallEnabled ? "left-7" : "left-1"}`}
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {paywallEnabled && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            Price per View (USD)
                          </label>
                          <div className="relative mt-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-color-gold font-bold text-sm">
                              $
                            </span>
                            <input
                              type="text"
                              value={paywallPrice}
                              onChange={(e) => setPaywallPrice(e.target.value)}
                              className="w-full bg-white/5 border border-color-gold/30 rounded-xl py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-color-gold"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button className="w-full py-5 rounded-2xl bg-accent text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Submit for Minting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPosts;
