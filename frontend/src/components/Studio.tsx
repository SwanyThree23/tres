import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Radio, Users, Zap, DollarSign, BarChart3, Loader2, Mic, MicOff, Camera, CameraOff, Settings2, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStream } from '../hooks/useStream';
import Destinations from './Destinations';
import ChatPanel from './ChatPanel';

interface StudioProps {
    isLive: boolean;
    setIsLive: (live: boolean) => void;
    onAction: (title: string, body: string) => void;
}

const Studio: React.FC<StudioProps> = ({ setIsLive, onAction }) => {
    const {
        isLive,
        isStarting,
        isStopping,
        viewerCount,
        streamId,
        startStream,
        stopStream,
    } = useStream(onAction);

    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [uptime, setUptime] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    // Request camera and mic permissions
    useEffect(() => {
        let stream: MediaStream | null = null;
        const initMedia = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setMediaStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error('Failed to get media devices:', err);
                onAction('Media Error', 'Could not access camera or microphone.');
            }
        };
        initMedia();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [onAction]);

    // Toggle tracks based on micOn/camOn
    useEffect(() => {
        if (mediaStream) {
            mediaStream.getAudioTracks().forEach(track => {
                track.enabled = micOn;
            });
        }
    }, [micOn, mediaStream]);

    useEffect(() => {
        if (mediaStream) {
            mediaStream.getVideoTracks().forEach(track => {
                track.enabled = camOn;
            });
        }
    }, [camOn, mediaStream]);

    // Sync parent state
    useEffect(() => { setIsLive(isLive); }, [isLive, setIsLive]);

    // Simulated viewer count growth
    const [displayViewers, setDisplayViewers] = useState(0);
    useEffect(() => {
        if (!isLive) { setDisplayViewers(0); return; }
        const t = setInterval(() => {
            setDisplayViewers(v => Math.min(v + Math.floor(Math.random() * 18) + 2, 9999));
        }, 2000);
        return () => clearInterval(t);
    }, [isLive]);

    // Uptime counter
    useEffect(() => {
        if (!isLive) { setUptime(0); return; }
        const t = setInterval(() => setUptime(u => u + 1), 1000);
        return () => clearInterval(t);
    }, [isLive]);

    const fmtTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return h > 0
            ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
            : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const integrations = [
        { name: 'Stripe Connect', status: 'Verified', color: 'text-green-400', dot: 'bg-green-400' },
        { name: 'Vault AES-256', status: 'Sealed', color: 'text-violet-400', dot: 'bg-violet-400' },
        { name: 'AI Director', status: 'Nominal', color: 'text-cyan-400', dot: 'bg-cyan-400' },
        { name: 'WebRTC Mesh', status: 'Latency Low', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    ];

    return (
        <div className="grid grid-cols-12 gap-6 h-full animate-fade-in">

            {/* ── Left Column: Video + Controls ──────────────────────── */}
            <div className="col-span-8 flex flex-col gap-5">

                {/* Video Preview */}
                <section className="relative rounded-3xl overflow-hidden bg-slate-950 aspect-video group border border-white/5">
                    
                    <video 
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${camOn ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Feed / Offline state */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {isLive ? (
                            <div className={`text-center transition-opacity duration-500 ${camOn ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                <motion.div
                                    animate={{ scale: [1, 1.08, 1] }}
                                    transition={{ repeat: Infinity, duration: 2.2 }}
                                    className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-5 mx-auto"
                                >
                                    <Radio className="text-red-500" size={40} />
                                </motion.div>
                                <p className="text-xl font-bold text-white">Broadcasting Live</p>
                                <p className="text-slate-500 text-sm mt-1 font-mono">{fmtTime(uptime)}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <button
                                    id="go-live-btn"
                                    onClick={() => startStream()}
                                    disabled={isStarting}
                                    aria-label="Start live broadcast"
                                    title="Go Live"
                                    className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-2xl shadow-violet-500/50 mx-auto disabled:opacity-50 mb-4"
                                >
                                    {isStarting
                                        ? <Loader2 className="text-white animate-spin" size={32} />
                                        : <Play className="text-white fill-white ml-1" size={32} />
                                    }
                                </button>
                                <p className="text-slate-400 text-sm">{isStarting ? 'Connecting...' : 'Click to go live'}</p>
                            </div>
                        )}
                    </div>

                    {/* Top-left overlays */}
                    <div className="absolute top-5 left-5 flex items-center gap-3 z-10">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isLive ? 'bg-red-600 text-white' : 'bg-black/50 text-slate-400 backdrop-blur-md'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-white live-pulse' : 'bg-slate-500'}`} />
                            {isLive ? 'Live' : 'Offline'}
                        </div>
                        {isLive && (
                            <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-white flex items-center gap-2">
                                <Users size={11} /> {displayViewers.toLocaleString()} Viewers
                            </div>
                        )}
                    </div>

                    {/* Bottom controls bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-6 py-5 flex items-center gap-3">
                        <button
                            onClick={() => setMicOn(v => !v)}
                            aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                            title={micOn ? 'Mute Mic' : 'Unmute Mic'}
                            className={`p-2.5 rounded-xl transition-all ${micOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                        >
                            {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                        </button>
                        <button
                            onClick={() => setCamOn(v => !v)}
                            aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
                            title={camOn ? 'Camera Off' : 'Camera On'}
                            className={`p-2.5 rounded-xl transition-all ${camOn ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                        >
                            {camOn ? <Camera size={16} /> : <CameraOff size={16} />}
                        </button>
                        <div className="flex-1" />
                        <button
                            title="Stream Settings"
                            aria-label="Stream Settings"
                            className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
                        >
                            <Settings2 size={16} />
                        </button>
                        {isLive && (
                            <button
                                id="end-stream-btn"
                                onClick={stopStream}
                                disabled={isStopping}
                                aria-label="End broadcast"
                                title="End Stream"
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                            >
                                {isStopping
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <Square size={14} fill="white" />
                                }
                                {isStopping ? 'Ending...' : 'End Stream'}
                            </button>
                        )}
                    </div>
                </section>

                {/* Quick Feature Actions */}
                <div className="grid grid-cols-3 gap-4">
                    <button
                        id="quick-payouts-btn"
                        onClick={() => onAction('Stripe Trace', 'Checking payout accounts and queuing transfers...')}
                        className="glass-panel p-5 hover:border-green-500/30 hover:bg-green-500/5 transition-all text-left group"
                        aria-label="View Stripe Payouts"
                    >
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 text-green-500 group-hover:scale-110 transition-transform">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1">Stripe Payouts</h3>
                        <p className="text-[11px] text-slate-500">Integrated with Connect accounts.</p>
                    </button>

                    <button
                        id="quick-ai-btn"
                        onClick={() => onAction('AI Orchestrator', 'Scanning stream for viral highlights...')}
                        className="glass-panel p-5 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
                        aria-label="Manage AI Highlights"
                    >
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1">AI Highlights</h3>
                        <p className="text-[11px] text-slate-500">Mint 4K clips as NFTs automatically.</p>
                    </button>

                    <button
                        id="quick-analytics-btn"
                        className="glass-panel p-5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-left group"
                        aria-label="View Advanced Analytics"
                    >
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 text-violet-500 group-hover:scale-110 transition-transform">
                            <BarChart3 size={20} />
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1">Advanced Analytics</h3>
                        <p className="text-[11px] text-slate-500">Real-time viewer behavior metrics.</p>
                    </button>
                </div>
            </div>

            {/* ── Right Column: Status + Revenue ─────────────────────── */}
            <div className="col-span-4 flex flex-col gap-5 overflow-y-auto no-scrollbar pb-10">

                {/* Guest Streaming Destinations */}
                <Destinations streamId={streamId || undefined} />

                {/* Live Chat Integration */}
                <div className="flex-1 min-h-[400px]">
                    <ChatPanel streamId={streamId || undefined} onAction={onAction} isCreator={true} />
                </div>

                {/* Revenue Snapshot */}
                <div className="glass-panel p-6 bg-gradient-to-br from-violet-600/8 to-transparent flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estimated Revenue</h3>
                        <BarChart3 size={14} className="text-slate-500" />
                    </div>
                    <div className="space-y-5">
                        {[
                            { label: 'Tips & Donations', value: '$1,240', pct: 65, color: 'bg-violet-500' },
                            { label: 'NFT Royalties', value: '$840', pct: 40, color: 'bg-cyan-500' },
                            { label: 'Subscriptions', value: '$320', pct: 20, color: 'bg-emerald-500' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex justify-between text-[11px] mb-2 text-slate-400">
                                    <span>{item.label}</span>
                                    <span className="text-white font-mono">{item.value}</span>
                                </div>
                                <div className="progress-bar">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.pct}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                        className={`progress-fill ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="pt-5 border-t border-white/5 mt-2">
                            <p className="text-3xl font-bold text-white tracking-tight">
                                $2,400<span className="text-slate-600 text-sm ml-1 font-normal">.00</span>
                            </p>
                            <p className="text-[10px] text-green-400 mt-2 flex items-center gap-1 font-bold">
                                <Zap size={10} className="fill-green-400" /> +18.4% growth since launch
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Studio;
