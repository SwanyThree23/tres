import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Play, Square, Radio, Users, Zap, DollarSign, 
    BarChart3, Loader2, Mic, MicOff, Camera, 
    CameraOff, Settings2, Share2, Signal, 
    Smartphone, Monitor, Layout, Info, UserPlus,
    Check, X, Crown, Sparkles, Smile, Flame, 
    Coffee, Heart, Search, ChevronDown, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStream } from '../hooks/useStream';
import Destinations from './Destinations';
import ChatPanel from './ChatPanel';

interface GuestRequest {
    id: string;
    name: string;
    message: string;
    avatar: string;
}

interface StudioProps {
    isLive: boolean; // This is the prop from App.tsx, but the spec uses its own 'isStreaming' state
    setIsLive: (live: boolean) => void;
    onAction: (title: string, body: string) => void;
}

const Studio: React.FC<StudioProps> = ({ setIsLive, onAction }) => {
    // ─── Stream State ───────────────────────────────────────────────────────
    const {
        isStarting,
        isStopping,
        streamId,
        startStream,
        stopStream,
    } = useStream(onAction);

    const [isStreaming, setIsStreaming] = useState(false);
    const [liveTime, setLiveTime] = useState(0);
    const [viewerCount, setViewerCount] = useState(0);
    const [localEarnings, setLocalEarnings] = useState(0);
    const [streamTitle, setStreamTitle] = useState('');
    const [streamCategory, setStreamCategory] = useState('Talk');
    const [panelCount, setPanelCount] = useState(1);
    
    // ─── AV Controls ────────────────────────────────────────────────────────
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [screenShareOn, setScreenShareOn] = useState(false);
    
    // ─── Paywall ────────────────────────────────────────────────────────────
    const [paywallEnabled, setPaywallEnabled] = useState(false);
    const [paywallPrice, setPaywallPrice] = useState('5.00');

    // ─── Aura AI ────────────────────────────────────────────────────────────
    const [auraEnabled, setAuraEnabled] = useState(false);
    const [auraMode, setAuraMode] = useState<'Sassy' | 'Hype' | 'Calm' | 'Kind'>('Hype');

    // ─── Guests ─────────────────────────────────────────────────────────────
    const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([
        { id: '1', name: 'NeonVibe', message: 'Can I join for the gaming sesh?', avatar: '🦊' },
        { id: '2', name: 'CyberPunker', message: 'Lets collab on the AI project!', avatar: '🤖' }
    ]);
    const [activeGuests, setActiveGuests] = useState<GuestRequest[]>([]);

    // ─── Media Refs ─────────────────────────────────────────────────────────
    const videoRef = useRef<HTMLVideoElement>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    // ─── Lifecycle / Media ──────────────────────────────────────────────────
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
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [onAction]);

    useEffect(() => {
        if (mediaStream) {
            mediaStream.getAudioTracks().forEach(t => t.enabled = micOn);
            mediaStream.getVideoTracks().forEach(t => t.enabled = camOn);
        }
    }, [micOn, camOn, mediaStream]);

    // ─── Live Interval Logic ────────────────────────────────────────────────
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isStreaming) {
            interval = setInterval(() => {
                setLiveTime(t => t + 1);
                setViewerCount(v => {
                    const delta = Math.floor(Math.random() * 15) - 7;
                    return Math.max(0, v + delta);
                });
                setLocalEarnings(e => e + (Math.random() * 0.5));
            }, 1000);
        } else {
            setLiveTime(0);
            setViewerCount(0);
            // Local earnings reset? The spec says "resets everything", but maybe earnings should persist? 
            // I'll reset it to keep it purely session-based as described.
            setLocalEarnings(0);
        }
        return () => clearInterval(interval);
    }, [isStreaming]);

    // ─── Handlers ───────────────────────────────────────────────────────────
    const handleGoLive = async () => {
        if (!streamTitle.trim()) {
            onAction('Validation Error', 'Please enter a stream title before going live.');
            return;
        }
        try {
            await startStream(streamTitle, `Category: ${streamCategory}`);
            setIsStreaming(true);
            setIsLive(true);
            setViewerCount(12);
        } catch (err) {
            onAction('Error', 'Failed to start stream.');
        }
    };

    const handleEndStream = async () => {
        try {
            await stopStream();
            setIsStreaming(false);
            setIsLive(false);
        } catch (err) {
            onAction('Error', 'Failed to stop stream.');
        }
    };

    const fmtTime = (s: number) => {
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return [hrs, mins, secs].map(v => String(v).padStart(2, '0')).join(':');
    };

    const acceptGuest = (guest: GuestRequest) => {
        setGuestRequests(prev => prev.filter(g => g.id !== guest.id));
        setActiveGuests(prev => [...prev, guest]);
        onAction('Guest Accepted', `${guest.name} is now in the active list.`);
    };

    const rejectGuest = (id: string) => {
        setGuestRequests(prev => prev.filter(g => g.id !== id));
    };

    // ─── Components ─────────────────────────────────────────────────────────
    
    const AVCard = ({ label, icon: Icon, active, color, onClick }: any) => (
        <button
            onClick={onClick}
            className={`glass-panel p-4 flex flex-col items-center justify-center gap-2 transition-all ${
                active ? 'border-2 scale-105 shadow-lg' : 'opacity-60 grayscale-[0.5]'
            }`}
            style={{ 
                borderColor: active ? color : 'transparent',
                backgroundColor: active ? `${color}10` : 'rgba(255,255,255,0.03)'
            }}
        >
            <div className={`p-2 rounded-xl`} style={{ backgroundColor: active ? color : 'rgba(255,255,255,0.05)' }}>
                <Icon size={20} className={active ? 'text-white' : 'text-slate-400'} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white mt-1">{label}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase">{active ? 'ON' : 'OFF'}</span>
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6 animate-fade-in overflow-hidden">
            
            {/* ── Main Console (Flex 1) ─────────────────────────────────── */}
            <main className="main-console flex flex-col gap-6 overflow-y-auto no-scrollbar pb-24">
                
                {/* ── Header ────────────────────────────────────────────── */}
                <header className="glass-panel px-6 py-4 flex items-center justify-between border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map(i => (
                                <div 
                                    key={i} 
                                    className={`w-1 rounded-full ${isStreaming && i <= 3 ? 'bg-color-cyan shadow-[0_0_8px_#22D3EE]' : 'bg-slate-700'}`} 
                                    style={{ height: `${i * 4}px` }} 
                                />
                            ))}
                        </div>
                        {isStreaming && (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-color-red/10 border border-color-red/20 px-3 py-1 rounded-full">
                                    <span className="w-2 h-2 bg-color-red rounded-full live-pulse" />
                                    <span className="text-color-red text-[10px] font-black uppercase tracking-widest">On-Air</span>
                                </div>
                                <span className="vbas-noya text-2xl text-white tracking-widest leading-none mt-1">
                                    {fmtTime(liveTime)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-slate-500 hover:text-white transition-colors">
                            <Settings2 size={18} />
                        </button>
                        <button className="text-slate-500 hover:text-white transition-colors">
                            <Share2 size={18} />
                        </button>
                    </div>
                </header>

                {/* ── Camera Preview ────────────────────────────────────── */}
                <section 
                    className={`relative rounded-3xl overflow-hidden aspect-video bg-slate-950 transition-all duration-500 border-2 ${
                        isStreaming ? 'border-color-red shadow-[inset_0_0_30px_rgba(239,68,68,0.3)]' : 'border-white/5 shadow-2xl'
                    }`}
                >
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10 opacity-20" 
                        style={{ backgroundSize: '40px 40px', backgroundImage: 'radial-gradient(circle, #ffffff22 1px, transparent 1px)' }} 
                    />
                    
                    <video 
                        ref={videoRef}
                        autoPlay playsInline muted
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${camOn ? 'opacity-100' : 'opacity-0'}`}
                    />

                    {/* Camera Off State */}
                    {!camOn && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center group">
                                <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                                    <CameraOff className="text-slate-600" size={32} />
                                </div>
                                <p className="dim-dm-mono text-sm tracking-widest uppercase">Camera Off</p>
                            </div>
                        </div>
                    )}

                    {/* Qubit (Live + Mic On) */}
                    {isStreaming && micOn && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute bottom-6 left-6 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10"
                        >
                            <div className="w-3 h-3 bg-color-green rounded-full shadow-[0_0_12px_#34D399] animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Qubit Sync</span>
                        </motion.div>
                    )}

                    {/* Earnings Display */}
                    {isStreaming && (
                        <div className="absolute bottom-6 right-6 z-20 text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Session Revenue</p>
                            <span className="famous-noise text-4xl text-color-green drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                                ${localEarnings.toFixed(2)}
                            </span>
                        </div>
                    )}

                    {/* Top Left Indicators */}
                    <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            isStreaming ? 'bg-color-red text-white border-color-red/50' : 'bg-black/50 text-slate-500 border-white/10'
                        }`}>
                            {isStreaming ? 'Live' : 'Standby'}
                        </div>
                        {isStreaming && (
                            <div className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                <Users size={12} className="text-blue-400" />
                                <span className="text-xs font-bold text-white">{viewerCount.toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Stream Info & Controls Grid ─────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Stream Info (Col 7) */}
                    <div className="md:col-span-7 glass-panel p-6 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stream Broadcast Title</label>
                            <input 
                                type="text"
                                value={streamTitle}
                                onChange={e => setStreamTitle(e.target.value)}
                                disabled={isStreaming}
                                placeholder="E.g. Building the future of AI streaming..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-accent outline-none transition-all disabled:opacity-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Stream Category</label>
                                <div className="relative group">
                                    <select 
                                        value={streamCategory}
                                        onChange={e => setStreamCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white appearance-none outline-none focus:border-accent"
                                    >
                                        {['Talk', 'Music', 'Lifestyle', 'Gaming', 'Fitness', 'Education'].map(c => (
                                            <option key={c} value={c} className="bg-bg-surface">{c}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Panel Count Selection</label>
                                <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
                                    {[1, 3, 9].map(n => {
                                        const disabled = n === 9; // Assume for demo/tier check
                                        return (
                                            <button
                                                key={n}
                                                onClick={() => !disabled && setPanelCount(n)}
                                                className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                                                    panelCount === n ? 'bg-accent text-white shadow-lg' : 'text-slate-500 hover:text-white'
                                                } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                            >
                                                {n}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Upgrade for 9 Panels (GhostButton) */}
                        {panelCount < 9 && (
                            <button className="w-full py-3 rounded-2xl border border-dashed border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-color-gold hover:text-color-gold transition-all">
                                Upgrade to Pro for 9 Panels
                            </button>
                        )}
                    </div>

                    {/* AV Controls & Paywall (Col 5) */}
                    <div className="md:col-span-5 flex flex-col gap-6">
                        
                        {/* AV Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <AVCard 
                                label="Camera" icon={Camera} active={camOn} 
                                color="#22D3EE" onClick={() => setCamOn(!camOn)} 
                            />
                            <AVCard 
                                label="Mic" icon={Mic} active={micOn} 
                                color="#34D399" onClick={() => setMicOn(!micOn)} 
                            />
                            <AVCard 
                                label="Screen" icon={Monitor} active={screenShareOn} 
                                color="#A855F7" onClick={() => setScreenShareOn(!screenShareOn)} 
                            />
                        </div>

                        {/* Paywall Card */}
                        <div className="glass-panel p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Premium Access</h3>
                                    <p className="text-[10px] text-slate-500">Enable Paywall for this session</p>
                                </div>
                                <button 
                                    onClick={() => setPaywallEnabled(!paywallEnabled)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${paywallEnabled ? 'bg-color-gold' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${paywallEnabled ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <AnimatePresence>
                                {paywallEnabled && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-3"
                                    >
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-color-gold font-bold">$</span>
                                            <input 
                                                type="text"
                                                value={paywallPrice}
                                                onChange={e => setPaywallPrice(e.target.value)}
                                                className="w-full bg-white/5 border border-color-gold/30 rounded-xl py-3 pl-8 pr-4 text-sm text-white outline-none focus:border-color-gold"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Go Live Button */}
                        <button
                            id="go-live-action"
                            onClick={isStreaming ? handleEndStream : handleGoLive}
                            disabled={isStarting || isStopping}
                            className={`w-full py-6 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl ${
                                isStreaming 
                                ? 'bg-color-red text-white shadow-color-red/30' 
                                : 'bg-accent text-white shadow-accent/30'
                            }`}
                        >
                            {isStarting ? <Loader2 className="animate-spin mx-auto" /> : isStreaming ? 'End Broadcast' : 'Go Live Now'}
                        </button>
                    </div>
                </div>
            </main>

            {/* ── Right Sidebar (320px) ─────────────────────────────────── */}
            <aside className="right-sidebar flex flex-col gap-6 overflow-y-auto no-scrollbar pb-32">
                
                {/* Aura AI Panel */}
                <section className="glass-panel p-6 border-color-purple/20">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <motion.div 
                                animate={{ scale: [1, 1.2, 1] }} 
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-xl"
                            >
                                🔮
                            </motion.div>
                            <div>
                                <h3 className="f-dot-stat text-lg text-color-purple tracking-widest leading-none">Aura AI Co-host</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mt-1">Autonomous Director</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setAuraEnabled(!auraEnabled)}
                            className={`w-10 h-5 rounded-full transition-all relative ${auraEnabled ? 'bg-color-purple' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${auraEnabled ? 'left-5.5' : 'left-0.5'}`} />
                        </button>
                    </div>

                    {auraEnabled ? (
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'Sassy', icon: Smile, color: 'rgb(168, 85, 247)' },
                                { id: 'Hype', icon: Flame, color: 'rgb(249, 115, 22)' },
                                { id: 'Calm', icon: Coffee, color: 'rgb(14, 165, 233)' },
                                { id: 'Kind', icon: Heart, color: 'rgb(236, 72, 153)' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setAuraMode(mode.id as any)}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                                        auraMode === mode.id ? 'bg-white/10 scale-105' : 'border-white/5 opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
                                    }`}
                                    style={{ borderColor: auraMode === mode.id ? mode.color : 'transparent' }}
                                >
                                    <mode.icon size={16} style={{ color: mode.color }} />
                                    <span className="text-[10px] font-bold text-white">{mode.id}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="py-4 text-center">
                            <p className="dim-dm-mono text-[10px] uppercase tracking-widest text-slate-500">Upgrade to Pro to unlock Aura</p>
                            <Crown className="mx-auto mt-3 text-color-gold opacity-20" size={24} />
                        </div>
                    )}
                </section>

                {/* Guest Requests */}
                <section className="glass-panel flex flex-col h-[400px]">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Guest Requests</h3>
                        <span className="bg-white/10 px-2 py-0.5 rounded text-[9px] font-bold">{guestRequests.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {guestRequests.length === 0 && activeGuests.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
                                <UserPlus size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest">No requests yet</p>
                            </div>
                        ) : (
                            <>
                                {activeGuests.map(guest => (
                                    <div key={guest.id} className="p-3 rounded-xl bg-color-green/5 border-l-2 border-color-green flex items-center gap-3">
                                        <div className="text-xl shrink-0">{guest.avatar}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-white truncate">{guest.name}</p>
                                            <p className="text-[10px] text-color-green font-bold uppercase tracking-tighter">On Stage</p>
                                        </div>
                                        <button onClick={() => setActiveGuests(prev => prev.filter(g => g.id !== guest.id))} className="text-slate-500 hover:text-color-red">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                                {guestRequests.map(guest => (
                                    <div key={guest.id} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="text-xl shrink-0">{guest.avatar}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white truncate">{guest.name}</p>
                                                <p className="text-[10px] text-slate-500 italic truncate">"{guest.message}"</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => acceptGuest(guest)}
                                                className="flex-1 py-1.5 rounded-lg bg-color-green/20 text-color-green font-bold text-[10px] uppercase hover:bg-color-green hover:text-white transition-all"
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                onClick={() => rejectGuest(guest.id)}
                                                className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-400 font-bold text-[10px] uppercase hover:bg-red-500 hover:text-white transition-all"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </section>

                {/* Live Stats (Render only when streaming) */}
                <AnimatePresence>
                    {isStreaming && (
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-4"
                        >
                            <div className="glass-panel p-5 border-l-4 border-color-cyan">
                                <div className="flex justify-between items-start mb-3">
                                    <Users className="text-color-cyan" size={16} />
                                    <span className="text-[9px] font-bold text-color-cyan bg-color-cyan/10 px-2 py-0.5 rounded-full">REALTIME</span>
                                </div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Watching</p>
                                <p className="vbas-noya text-3xl text-white tracking-widest">{viewerCount}</p>
                            </div>

                            <div className="glass-panel p-5 border-l-4 border-color-gold">
                                <div className="flex justify-between items-start mb-3">
                                    <Sparkles className="text-color-gold" size={16} />
                                    <span className="text-[9px] font-bold text-color-gold bg-color-gold/10 px-2 py-0.5 rounded-full">ESTIMATED</span>
                                </div>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Live Earnings</p>
                                <p className="vbas-noya text-3xl text-white tracking-widest">${localEarnings.toFixed(2)}</p>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </aside>
        </div>
    );
};

export default Studio;
