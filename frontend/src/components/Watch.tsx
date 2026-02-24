import React, { useState, useEffect } from 'react';
import { Play, Radio, Users, Zap, Heart, MessageSquare, Share2, Gift, Volume2, VolumeX, Maximize, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WatchProps {
    streamId?: string;
    onClose?: () => void;
}

const Watch: React.FC<WatchProps> = ({ streamId, onClose }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [tipAmount, setTipAmount] = useState('');
    const [showTipModal, setShowTipModal] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, user: 'NeonVibes', text: 'LETS GOOOO 🔥', avatar: 'A1', isHighlight: false },
        { id: 2, user: 'CyberPunker', text: 'This AI director is insane!', avatar: 'B2', isHighlight: true },
        { id: 3, user: 'GhostWalker', text: 'tipped $50! Keep it up!', avatar: 'C3', isHighlight: false },
        { id: 4, user: 'PixelLord', text: 'Can you do the crazy stunt again?', avatar: 'D4', isHighlight: false },
        { id: 5, user: 'Starlight99', text: 'First time here, already subscribed 💜', avatar: 'E5', isHighlight: false },
        { id: 6, user: 'TechnoMage', text: 'The 4K quality is incredible fr', avatar: 'F6', isHighlight: false },
    ]);
    const [chatInput, setChatInput] = useState('');
    const [viewerCount, setViewerCount] = useState(1248);

    useEffect(() => {
        const interval = setInterval(() => {
            setViewerCount(prev => prev + Math.floor(Math.random() * 10) - 3);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        const newMsg = {
            id: Date.now(),
            user: 'Swany_Dev',
            text: chatInput,
            avatar: 'Felix',
            isHighlight: false,
        };
        setChatMessages(prev => [...prev.slice(-50), newMsg]);
        setChatInput('');
    };

    const quickTips = [5, 10, 25, 50, 100];

    return (
        <div className="grid grid-cols-12 gap-5 h-full animate-fade-in">

            {/* Video Player */}
            <div className="col-span-8 flex flex-col gap-4">
                <div className="relative bg-black rounded-3xl overflow-hidden aspect-video group">
                    {/* Simulated video feed */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-slate-900 to-cyan-900/30 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto animate-pulse">
                                <Radio className="text-red-500" size={48} />
                            </div>
                            <p className="text-xl font-bold text-white">Building a Web3 AI Orchestrator</p>
                            <p className="text-slate-400 text-sm mt-1">CodeWizard • LIVE</p>
                        </div>
                    </div>

                    {/* Overlays */}
                    <div className="absolute top-5 left-5 flex items-center gap-3">
                        <div className="badge-live">
                            <span className="w-1.5 h-1.5 bg-white rounded-full live-pulse" />
                            Live
                        </div>
                        <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2">
                            <Users size={12} />
                            {viewerCount.toLocaleString()}
                        </div>
                    </div>

                    {/* Controls (visible on hover) */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                            <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Play fill="white" size={18} />
                            </button>
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                                title={isMuted ? 'Unmute' : 'Mute'}
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <div className="flex-1" />
                            <button className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" title="Fullscreen">
                                <Maximize size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stream Info + Actions */}
                <div className="glass-panel p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 p-0.5 shrink-0">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ace" className="rounded-xl" alt="CodeWizard" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Building a Web3 AI Orchestrator</h2>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    <span className="text-violet-400 font-bold">CodeWizard</span> · Tech · 3.1K watching
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="px-2.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-bold text-violet-400">Tech</span>
                                    <span className="px-2.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-bold text-cyan-400">AI/ML</span>
                                    <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-slate-400">Web3</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => setIsLiked(!isLiked)}
                                aria-label="Like stream"
                                title="Like"
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isLiked
                                        ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                                        : 'glass-panel text-slate-400 hover:text-red-400'
                                    }`}
                            >
                                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                                {isLiked ? 'Liked' : 'Like'}
                            </button>
                            <button
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold glass-panel text-slate-400 hover:text-cyan-400 transition-colors"
                                title="Share"
                            >
                                <Share2 size={16} /> Share
                            </button>
                            <button
                                onClick={() => setShowTipModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:scale-105 transition-transform"
                            >
                                <Gift size={16} /> Tip Creator
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Panel */}
            <div className="col-span-4 glass-panel flex flex-col">
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={16} className="text-slate-400" />
                        <span className="font-bold text-sm">Live Chat</span>
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full live-pulse" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{viewerCount.toLocaleString()} online</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {chatMessages.map(msg => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-2.5 group ${msg.isHighlight ? 'bg-violet-500/5 rounded-xl p-2 -mx-1' : ''}`}
                            >
                                <img
                                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.avatar}`}
                                    className="w-7 h-7 rounded-full border border-white/10 shrink-0 mt-0.5"
                                    alt={msg.user}
                                />
                                <div>
                                    <span className={`text-[10px] font-bold ${msg.user === 'Swany_Dev' ? 'text-cyan-400' : 'text-violet-400'}`}>
                                        {msg.user}
                                    </span>
                                    {msg.isHighlight && (
                                        <span className="ml-1 text-[8px] font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full align-middle">VIP</span>
                                    )}
                                    <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{msg.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Chat Input */}
                <div className="px-4 py-4 border-t border-white/5 shrink-0">
                    <form onSubmit={handleSendChat} className="flex gap-2">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Send a message..."
                            maxLength={200}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                        />
                        <button
                            type="submit"
                            aria-label="Send chat message"
                            className="px-3 py-2 bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors"
                        >
                            <Zap size={14} className="text-white" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Tip Modal */}
            <AnimatePresence>
                {showTipModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowTipModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="glass-panel p-8 w-full max-w-md relative"
                        >
                            <button
                                onClick={() => setShowTipModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                                aria-label="Close tip modal"
                            >
                                <X size={18} />
                            </button>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                                    <Gift className="text-white" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Tip CodeWizard</h3>
                                    <p className="text-xs text-slate-400">Show your appreciation</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {quickTips.map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setTipAmount(String(amount))}
                                        className={`py-2.5 rounded-xl text-sm font-bold transition-all ${tipAmount === String(amount)
                                                ? 'bg-violet-600 text-white'
                                                : 'glass-panel text-slate-300 hover:text-white hover:border-violet-500/40'
                                            }`}
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="number"
                                placeholder="Custom amount..."
                                value={tipAmount}
                                onChange={e => setTipAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 mb-4 placeholder-slate-500"
                            />

                            <button className="w-full py-4 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-xl font-bold text-white hover:scale-[1.02] transition-transform">
                                Send ${tipAmount || '0'} Tip ⚡
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Watch;
