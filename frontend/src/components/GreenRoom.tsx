import React, { useState, useEffect, useRef } from 'react';
import { 
    Video, VideoOff, Mic, MicOff, Settings, Zap, 
    Share2, Plus, Twitch, Youtube, Globe, Play, 
    Layout, Tv2, Users, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GreenRoomProps {
    onEnter: (config: any) => void;
}

const GreenRoom: React.FC<GreenRoomProps> = ({ onEnter }) => {
    const [camOn, setCamOn] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [micLevel, setMicLevel] = useState(0);
    const [destinations, setDestinations] = useState([
        { id: '1', platform: 'Twitch', name: 'Primary Stream', isActive: true },
        { id: '2', platform: 'YouTube', name: 'Archive Channel', isActive: false },
    ]);
    const [action, setAction] = useState<'watch' | 'panel' | 'browse'>('browse');

    useEffect(() => {
        let currentStream: MediaStream | null = null;
        const startMedia = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ 
                    video: camOn, 
                    audio: micOn 
                });
                setStream(s);
                currentStream = s;
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                }

                // Simple audio level simulation/track monitor
                if (micOn && s.getAudioTracks().length > 0) {
                    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
                    if (!AudioContextClass) return;
                    
                    const audioContext = new AudioContextClass();
                    const source = audioContext.createMediaStreamSource(s);
                    const analyser = audioContext.createAnalyser();
                    source.connect(analyser);
                    analyser.fftSize = 256;
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    
                    const updateLevel = () => {
                        analyser.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                        setMicLevel(average / 128);
                        if (currentStream && micOn) requestAnimationFrame(updateLevel);
                    };
                    updateLevel();
                }
            } catch (err) {
                console.warn("Media access failed:", err);
            }
        };

        startMedia();

        return () => {
            currentStream?.getTracks().forEach(t => t.stop());
        };
    }, [camOn, micOn]);

    const handleEnter = () => {
        onEnter({
            camOn,
            micOn,
            action,
            destinations: destinations.filter(d => d.isActive)
        });
    };

    return (
        <div className="fixed inset-0 z-[300] bg-[hsl(240,20%,2%)] overflow-y-auto custom-scrollbar">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.05),transparent_70%)]" />
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-violet-600/10 blur-[150px] rounded-full" 
                />
            </div>

            <div className="relative min-h-screen flex flex-col items-center justify-center p-6 py-12">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/40 mx-auto mb-6">
                        <Zap className="text-white fill-white" size={32} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">Welcome to the Green Room</h1>
                    <p className="text-slate-400 text-sm md:text-base font-medium max-w-sm mx-auto">Calibrate your presence and define your entry point.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-6xl">
                    
                    {/* Media Preview (Left) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="aspect-video bg-black/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl glass-panel group">
                            {camOn ? (
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    muted 
                                    playsInline 
                                    className="w-full h-full object-cover scale-[1.02]"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <VideoOff className="text-slate-600" size={32} />
                                        </div>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Camera Disabled</p>
                                    </div>
                                </div>
                            )}

                            {/* Mic Level Overlay */}
                            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4">
                                <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden backdrop-blur-md border border-white/5">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                                        style={{ width: micOn ? `${micLevel * 100}%` : '0%' }}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setCamOn(!camOn)}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${camOn ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-white/10 text-slate-400'}`}
                                        title={camOn ? "Stop video" : "Start video"}
                                    >
                                        {camOn ? <Video size={20} /> : <VideoOff size={20} />}
                                    </button>
                                    <button 
                                        onClick={() => setMicOn(!micOn)}
                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${micOn ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-white/10 text-slate-400'}`}
                                        title={micOn ? "Mute" : "Unmute"}
                                    >
                                        {micOn ? <Mic size={20} /> : <MicOff size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'browse', label: 'Explore Platform', icon: Globe, desc: 'Jump into the broad discovery feed.' },
                                { id: 'watch', label: 'Start Watch Party', icon: Users, desc: 'Initiate a social viewing session.' },
                                { id: 'panel', label: 'Configure Profile', icon: Layout, desc: 'Design your creator info panels.' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setAction(item.id as any)}
                                    className={`p-6 rounded-[2rem] border text-left transition-all ${action === item.id ? 'border-violet-500 bg-violet-500/10 shadow-xl shadow-violet-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                >
                                    <item.icon size={24} className={action === item.id ? 'text-violet-400' : 'text-slate-500'} />
                                    <h3 className="text-sm font-bold text-white mt-4 mb-1">{item.label}</h3>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Destinations */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="glass-panel p-8 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <Share2 className="text-cyan-400" size={20} />
                                    <h2 className="text-xl font-bold text-white tracking-tight">Destinations</h2>
                                </div>
                                <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors" title="Add destination">
                                    <Plus size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 mb-6 leading-relaxed">Select the platforms where your activity will be broadcasted simultaneously.</p>

                            <div className="space-y-4 flex-1">
                                {destinations.map((d) => (
                                    <div key={d.id} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center">
                                                {d.platform === 'Twitch' ? <Twitch size={18} className="text-violet-400" /> : <Youtube size={18} className="text-red-500" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{d.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest">{d.platform}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setDestinations(prev => prev.map(item => item.id === d.id ? {...item, isActive: !item.isActive} : item))}
                                            className={`w-10 h-6 rounded-full relative transition-colors ${d.isActive ? 'bg-violet-600' : 'bg-slate-800'}`}
                                            title={d.isActive ? "Deactivate" : "Activate"}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${d.isActive ? 'left-5' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                                <div className="p-4 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-slate-600 cursor-pointer hover:border-violet-500/50 hover:text-slate-400 transition-colors py-8">
                                    <Globe size={24} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Connect Custom RTMP</span>
                                </div>
                            </div>

                            <div className="mt-8">
                                <button 
                                    onClick={handleEnter}
                                    className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-[2rem] text-sm font-bold uppercase tracking-[0.2em] shadow-2xl shadow-violet-600/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                >
                                    Enter Application <ArrowRight size={18} />
                                </button>
                                <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
                                    <Zap size={12} className="fill-cyan-400" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">AI Engine Optimized</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GreenRoom;
