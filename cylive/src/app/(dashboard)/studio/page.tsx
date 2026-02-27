// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Creator Studio
// Stream setup, camera preview, panel management, RTMP key, Aura AI
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  Users,
  Copy,
  Check,
  Grid3X3,
  DollarSign,
  Eye,
  Sparkles,
  Radio,
  Lock,
  Send,
  RefreshCw,
} from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";

type PanelConfig = 1 | 2 | 3 | 4 | 6 | 9;
type AuraMode = "SASSY" | "HYPE" | "CALM" | "KIND";

export default function StudioPage() {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── State ─────────────────────────────────────────────────────────
  const [isLive, setIsLive] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [ingestUrl, setIngestUrl] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [panelCount, setPanelCount] = useState<PanelConfig>(1);
  const [auraMode, setAuraMode] = useState<AuraMode>("HYPE");
  const [auraEnabled, setAuraEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallAmount, setPaywallAmount] = useState("");
  const [streamTitle, setStreamTitle] = useState("");
  const [streamGenre, setStreamGenre] = useState<string>("OTHER");
  const [viewers, setViewers] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  const tier = session?.user?.tier || "FREE";
  const isProOrStudio = tier === "PRO" || tier === "STUDIO";

  // ── Camera Setup ──────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream;

    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: true,
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn("[Studio] Camera access denied:", err);
      }
    };

    setupCamera();

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── AV Track Control ──────────────────────────────────────────────
  useEffect(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach((t) => (t.enabled = camOn));
    }
  }, [camOn, mediaStream]);

  useEffect(() => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach((t) => (t.enabled = micOn));
    }
  }, [micOn, mediaStream]);

  // ── Live Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
      // Simulate viewer fluctuation
      setViewers((v) => Math.max(0, v + Math.floor(Math.random() * 20 - 5)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  // ── Go Live ───────────────────────────────────────────────────────
  const handleGoLive = useCallback(async () => {
    if (!streamTitle.trim() || isStarting) return;

    setIsStarting(true);
    try {
      const res = await fetch("/api/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: streamTitle,
          genre: streamGenre,
          panelCount,
          isPaywalled: showPaywall,
          paywallAmountCents: showPaywall
            ? parseFloat(paywallAmount) * 100
            : undefined,
          auraMode: auraEnabled ? auraMode : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to start stream");

      const data = await res.json();
      setStreamId(data.stream.id);
      setStreamKey(data.stream.streamKey);
      setIngestUrl(data.stream.ingestUrl);
      setIsLive(true);
      setViewers(Math.floor(Math.random() * 50) + 10);
      setDuration(0);

      // Socket.io: Join stream room and broadcast start
      if (socket && isConnected) {
        socket.emit("join-stream", data.stream.id);
        socket.emit("stream-start", {
          streamId: data.stream.id,
          title: streamTitle,
        });
      }
    } catch (err) {
      console.error("[Studio] Go Live Error:", err);
      alert("Failed to start stream. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }, [
    streamTitle,
    streamGenre,
    panelCount,
    showPaywall,
    paywallAmount,
    auraEnabled,
    auraMode,
    isStarting,
  ]);

  const handleEndStream = useCallback(async () => {
    if (!streamId) return;

    try {
      await fetch(`/api/streams/${streamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });

      setIsLive(false);
      setStreamId(null);
      setStreamKey(null);
      setIngestUrl(null);
      setDuration(0);
      setViewers(0);
      setEarnings(0);
    } catch (err) {
      console.error("[Studio] End Stream Error:", err);
    }
  }, [streamId]);

  // ── Format Helpers ────────────────────────────────────────────────
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Stream Setup Header ──────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Creator Studio
          </h1>
          <p className="text-text-muted text-xs mt-1">
            {isLive
              ? "You are broadcasting live"
              : "Configure your stream before going live"}
          </p>
        </div>

        {isLive ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-xl">
              <span className="w-2 h-2 bg-accent rounded-full animate-live-pulse" />
              <span className="font-stat text-xl text-accent">
                {formatTime(duration)}
              </span>
            </div>
            <button onClick={handleEndStream} className="btn-danger">
              End Stream
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoLive}
            disabled={!streamTitle.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            <Radio size={16} />
            Go Live
          </button>
        )}
      </div>

      {/* ── Main Studio Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* ── Left: Camera + Stream Info ──────────────────────────────── */}
        <div className="space-y-5">
          {/* Camera Preview */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-bg-card border border-border">
            {camOn ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="camera-grid absolute inset-0 pointer-events-none opacity-40" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-card text-text-dim">
                <VideoOff size={48} className="mb-3 opacity-50" />
                <p className="font-bold text-sm">Camera Off</p>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            {isLive && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="badge-live">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Live
                </span>
                <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                  <Eye size={10} />
                  {viewers.toLocaleString()}
                </span>
              </div>
            )}

            {/* AV Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={() => setMicOn(!micOn)}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                className={`p-3 rounded-xl transition-all ${
                  micOn
                    ? "bg-white/10 backdrop-blur-md hover:bg-white/20 text-white"
                    : "bg-red-500/80 text-white"
                }`}
              >
                {micOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                onClick={() => setCamOn(!camOn)}
                aria-label={camOn ? "Turn off camera" : "Turn on camera"}
                className={`p-3 rounded-xl transition-all ${
                  camOn
                    ? "bg-white/10 backdrop-blur-md hover:bg-white/20 text-white"
                    : "bg-red-500/80 text-white"
                }`}
              >
                {camOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
              <button
                aria-label="Share screen"
                className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 text-white transition-all"
              >
                <ScreenShare size={18} />
              </button>
            </div>

            {/* Mic Indicator */}
            {micOn && isLive && (
              <div className="absolute bottom-4 right-4">
                <div className="w-3 h-3 bg-green rounded-full animate-live-pulse" />
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="glass-panel p-6 space-y-5">
            <div>
              <label htmlFor="stream-title" className="input-label">
                Stream Title
              </label>
              <input
                id="stream-title"
                type="text"
                placeholder="What are you streaming today?"
                className="input-field"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                disabled={isLive}
              />
            </div>

            <div>
              <label htmlFor="stream-genre" className="input-label">
                Genre
              </label>
              <select
                id="stream-genre"
                className="input-field bg-bg-card"
                value={streamGenre}
                onChange={(e) => setStreamGenre(e.target.value)}
                disabled={isLive}
              >
                {[
                  "TALK_SHOW",
                  "MUSIC",
                  "GAMING",
                  "LIFESTYLE",
                  "EDUCATION",
                  "SPORTS",
                  "NEWS",
                  "COMEDY",
                  "ART",
                  "TECHNOLOGY",
                  "OTHER",
                ].map((g) => (
                  <option key={g} value={g}>
                    {g.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* RTMP Key */}
            <div>
              <label className="input-label">RTMP Ingest URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="rtmps://ingest.cylive.app/live"
                  aria-label="RTMP Ingest URL"
                  className="input-field font-mono text-xs flex-1"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "rtmps://ingest.cylive.app/live",
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  aria-label="Copy RTMP URL"
                  className="p-3 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-colors shrink-0"
                >
                  {copied ? (
                    <Check size={16} className="text-green" />
                  ) : (
                    <Copy size={16} className="text-text-muted" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">Stream Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  readOnly
                  value={streamKey}
                  aria-label="Stream Key"
                  className="input-field font-mono text-xs flex-1"
                />
                <button
                  aria-label="Regenerate stream key"
                  className="p-3 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-colors shrink-0"
                >
                  <RefreshCw size={16} className="text-text-muted" />
                </button>
              </div>
              <p className="text-[10px] text-text-dim mt-1.5 ml-1">
                Never share your stream key. Click refresh to regenerate.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: Controls Sidebar ────────────────────────────────── */}
        <div className="space-y-5">
          {/* Live Stats (when live) */}
          {isLive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                    Viewers
                  </p>
                  <p className="font-stat text-3xl text-white">{viewers}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                    Earnings
                  </p>
                  <p className="font-stat text-3xl text-gold">
                    ${(earnings / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Panel Count Selector */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Grid3X3 size={16} className="text-cyan" />
                <span className="text-xs font-bold text-white">
                  Panel Layout
                </span>
              </div>
              <span className="text-[9px] font-bold text-text-muted uppercase">
                {panelCount} panel{panelCount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {([1, 2, 3, 4, 6, 9] as PanelConfig[]).map((count) => {
                const maxPanels =
                  tier === "STUDIO"
                    ? 9
                    : tier === "PRO" || tier === "CREATOR"
                      ? 3
                      : 1;
                const locked = count > maxPanels;
                return (
                  <button
                    key={count}
                    onClick={() => !locked && setPanelCount(count)}
                    disabled={locked || isLive}
                    aria-label={`${count} panel layout${locked ? " (locked)" : ""}`}
                    className={`aspect-square rounded-lg border text-xs font-bold transition-all flex items-center justify-center ${
                      panelCount === count
                        ? "bg-accent text-white border-accent shadow-glow"
                        : locked
                          ? "bg-white/2 text-text-dim border-border cursor-not-allowed"
                          : "bg-white/5 text-text-muted border-border hover:border-accent/40 hover:text-white"
                    }`}
                  >
                    {locked ? <Lock size={10} /> : count}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aura AI Co-Host */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple" />
                <span className="text-xs font-bold text-white">
                  Aura AI Co-Host
                </span>
              </div>
              {isProOrStudio ? (
                <button
                  onClick={() => setAuraEnabled(!auraEnabled)}
                  aria-label={auraEnabled ? "Disable Aura" : "Enable Aura"}
                  className="toggle-track"
                  data-active={auraEnabled}
                >
                  <div className="toggle-knob" data-active={auraEnabled} />
                </button>
              ) : (
                <span className="badge-pro">Pro+</span>
              )}
            </div>

            {isProOrStudio && auraEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <p className="text-[10px] text-text-muted mb-3">
                  Choose Aura&apos;s personality for this stream
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(["SASSY", "HYPE", "CALM", "KIND"] as AuraMode[]).map(
                    (mode) => (
                      <button
                        key={mode}
                        onClick={() => setAuraMode(mode)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                          auraMode === mode
                            ? "bg-purple/20 border-purple/40 text-purple"
                            : "bg-white/3 border-border text-text-muted hover:text-white hover:border-purple/20"
                        }`}
                      >
                        {mode === "SASSY" && "😏 "}
                        {mode === "HYPE" && "🔥 "}
                        {mode === "CALM" && "🧘 "}
                        {mode === "KIND" && "💜 "}
                        {mode}
                      </button>
                    ),
                  )}
                </div>
              </motion.div>
            )}

            {!isProOrStudio && (
              <p className="text-text-dim text-xs">
                Upgrade to Pro or Studio to unlock your AI co-host companion.
              </p>
            )}
          </div>

          {/* Paywall Settings */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-gold" />
                <span className="text-xs font-bold text-white">Paywall</span>
              </div>
              <button
                onClick={() => setShowPaywall(!showPaywall)}
                aria-label={showPaywall ? "Disable paywall" : "Enable paywall"}
                className="toggle-track"
                data-active={showPaywall}
              >
                <div className="toggle-knob" data-active={showPaywall} />
              </button>
            </div>
            {showPaywall && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label htmlFor="paywall-amount" className="input-label">
                  Access Price (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-bold text-sm">
                    $
                  </span>
                  <input
                    id="paywall-amount"
                    type="number"
                    min="1"
                    max="500"
                    placeholder="5.00"
                    className="input-field pl-8"
                    value={paywallAmount}
                    onChange={(e) => setPaywallAmount(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Guest Management */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-cyan" />
                <span className="text-xs font-bold text-white">
                  Guest Panel
                </span>
              </div>
              <span className="text-[9px] font-bold text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                0/{panelCount - 1} slots
              </span>
            </div>
            <p className="text-text-dim text-xs">
              {isLive
                ? "Share your invite link to add guests to your stream panels."
                : "Go live to start accepting guest requests."}
            </p>
            {isLive && (
              <button className="btn-ghost w-full mt-3 flex items-center justify-center gap-2">
                <Send size={14} />
                Copy Invite Link
              </button>
            )}
          </div>

          {/* Stream Credentials (RTMP) */}
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio size={16} className="text-accent" />
              <span className="text-xs font-bold text-white">
                Stream Credentials
              </span>
            </div>
            {isLive ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] uppercase tracking-wider text-text-dim block mb-1">
                    Ingest URL
                  </label>
                  <div className="flex items-center gap-2">
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
                  <label className="text-[9px] uppercase tracking-wider text-text-dim block mb-1">
                    Stream Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      readOnly
                      value={streamKey || ""}
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
                </div>
                <p className="text-[10px] text-text-dim italic mt-2">
                  Use these in OBS / Streamlabs to broadcast.
                </p>
              </div>
            ) : (
              <p className="text-text-dim text-xs">
                Go live to generate your temporary stream key.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
