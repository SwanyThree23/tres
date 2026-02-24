import { Play, Radio, Users, Zap, Heart, MessageSquare, Share2, Gift, Volume2, VolumeX, Maximize, X, ArrowLeft, Settings2, Shield, Lock, ExternalLink, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { streamService } from '../services/api';
import PermissionModal from './PermissionModal';

interface WatchProps {
    streamId?: string;
    onClose?: () => void;
}

const Watch: React.FC<WatchProps> = ({ streamId, onClose }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [tipAmount, setTipAmount] = useState('');
    const [showTipModal, setShowTipModal] = useState(false);
    const [stream, setStream] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (streamId) {
            streamService.getStream(streamId)
                .then(res => setStream(res.data))
                .catch(err => console.error("Failed to fetch stream", err))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [streamId]);
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

    const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);

    const addHeart = () => {
        const id = Date.now();
        const x = Math.random() * 100 - 50;
        setHearts(prev => [...prev, { id, x }]);
        setTimeout(() => {
            setHearts(prev => prev.filter(h => h.id !== id));
        }, 2000);
    };

    const streamers = [
        { id: '1', user: 'NeonVibes', avatar: 'A1', isLive: true },
        { id: '2', user: 'CyberPunker', avatar: 'B2', isLive: true },
        { id: '3', user: 'GhostWalker', avatar: 'C3', isLive: true },
        { id: '4', user: 'TechnoMage', avatar: 'F6', isLive: false },
        { id: '5', user: 'PixelLord', avatar: 'D4', isLive: true },
        { id: '6', user: 'Starlight', avatar: 'E5', isLive: true },
    ];

    const [infoPanels, setInfoPanels] = useState([
        { id: 1, title: 'About the Streamer', content: 'Building the future of decentralized media. AI researcher by day, creative coder by night.' },
        { id: 2, title: 'Streaming Schedule', content: 'Mon-Fri: 8 PM EST. Weekends: Surprise deep-dive sessions.' },
    ]);

    const addPanel = () => {
        const id = Date.now();
        setInfoPanels([...infoPanels, { 
            id, 
            title: 'New Panel', 
            content: 'Click edit to customize this space for your audience.' 
        }]);
    };

    const [showPermissions, setShowPermissions] = useState(false);
    const [isPartyActive, setIsPartyActive] = useState(false);
    const [partyUrl, setPartyUrl] = useState('');
    const [editingPanel, setEditingPanel] = useState<number | null>(null);

    const startParty = (url: string) => {
        if (!url) return;
        setPartyUrl(url);
        setIsPartyActive(true);
        addNotification('Party Started', 'Your watch party is now live and syncing.');
    };

    const savePanel = (id: number, title: string, content: string) => {
        setInfoPanels(prev => prev.map(p => p.id === id ? { ...p, title, content } : p));
        setEditingPanel(null);
        addNotification('Panel Updated', 'Your changes have been saved to the stream.');
    };

    return (
        <div className="grid grid-cols-12 gap-5 h-full animate-fade-in relative">
            
            {/* Permission Settings Overlay */}
            <PermissionModal 
                isOpen={showPermissions} 
                onClose={() => setShowPermissions(false)}
                onSave={(s) => addNotification('Settings Saved', `Visibility set to ${s.visibility}.`)}
                title="Watch Party Permissions"
            />

            {/* ── Left Column: Live Panel (Bigo Style) ──────────────── */}
            <div className="col-span-2 glass-panel flex flex-col items-center py-5 gap-4 overflow-y-auto no-scrollbar shrink-0">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 px-4 text-center">Live Discovery</div>
                <div className="w-full px-3 space-y-3">
                    {streamers.map((s, i) => (
                        <motion.button
                            key={s.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`relative w-full aspect-square rounded-2xl border-2 shrink-0 transition-all group overflow-hidden ${s.id === streamId ? 'border-violet-500 bg-violet-500/10 scale-[1.02] shadow-lg shadow-violet-500/30' : 'border-white/5 hover:border-white/20'}`}
                        >
                            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${s.avatar}`} className="w-full h-full object-cover" alt={s.user} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                <span className="text-[8px] font-bold text-white truncate">{s.user}</span>
                            </div>
                            {s.isLive && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full live-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            )}
                        </motion.button>
                    ))}
                    <button 
                        onClick={() => alert('Start your stream in the Studio to appear here!')}
                        className="w-full aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-all gap-1"
                    >
                        <Zap size={16} />
                        <span className="text-[8px] font-bold uppercase">Go Live</span>
                    </button>
                </div>
                <div className="flex-1" />
            </div>

            {/* ── Middle Column: Video Player ───────────────────────── */}
            <div className="col-span-6 flex flex-col gap-4 overflow-y-auto no-scrollbar pb-10">
                <div className="relative bg-black rounded-3xl overflow-hidden aspect-video group shrink-0 border border-white/5 shadow-2xl">
                    {/* Top-right Interaction menu */}
                    <div className="absolute top-5 right-5 flex items-center gap-2 z-20">
                         <button 
                            onClick={() => setShowPermissions(true)}
                            className="bg-black/50 backdrop-blur-md p-2 rounded-xl text-slate-300 hover:text-white transition-all hover:bg-white/10 border border-white/5"
                            title="Access Permissions & Feature Settings"
                            aria-label="Manage watch party permissions"
                         >
                            <Shield size={16} />
                         </button>
                    </div>

                    {/* Simulated video feed or Party Sync */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-slate-900 to-cyan-900/30 flex items-center justify-center">
                        {isPartyActive ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-3xl p-10">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                    transition={{ repeat: Infinity, duration: 4 }}
                                    className="w-20 h-20 rounded-full bg-violet-600/20 flex items-center justify-center mb-8 border border-violet-500/30"
                                >
                                    <Zap className="text-violet-400" size={32} />
                                </motion.div>
                                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Party Sync Active</h2>
                                <p className="text-slate-500 text-[10px] font-bold mb-8 uppercase tracking-widest text-center max-w-xs leading-relaxed">
                                    Sharing media via <br/> <span className="text-cyan-400 font-mono">{partyUrl.substring(0, 40)}...</span>
                                </p>
                                <button 
                                    onClick={() => setIsPartyActive(false)}
                                    title="Disconnect from Watch Party"
                                    className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-red-500/30 transition-all hover:scale-105"
                                >
                                    Terminate Sync
                                </button>
                            </div>
                        ) : (
                            <div className="text-center relative z-10 p-10 max-w-lg w-full">
                                <div className="mb-10 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-violet-600/10 flex items-center justify-center mb-6 mx-auto border border-white/5">
                                        <Play className="text-violet-500 fill-violet-500 ml-1" size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Theater Mode</h2>
                                    <p className="text-slate-500 text-xs">Enter a video link to initialize a community watch party.</p>
                                </div>
                                
                                <div className="relative group/input">
                                    <input 
                                        type="text"
                                        placeholder="Paste source URL (YT/Twitch)..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-violet-500 outline-none transition-all placeholder:text-slate-600 group-hover/input:bg-white/10"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') startParty(e.currentTarget.value);
                                        }}
                                    />
                                    <button 
                                        onClick={(e) => {
                                            const input = e.currentTarget.previousSibling as HTMLInputElement;
                                            startParty(input.value);
                                        }}
                                        title="Initialize Stream"
                                        className="absolute right-2 top-2 bottom-2 px-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all"
                                    >
                                        Start
                                    </button>
                                </div>
                            </div>
                        )}
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

                    {/* Floating Hearts Container */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <AnimatePresence>
                            {hearts.map(h => (
                                <motion.div
                                    key={h.id}
                                    initial={{ opacity: 0, y: 0, x: h.x, scale: 0.5 }}
                                    animate={{ opacity: 1, y: -200, x: h.x + (Math.sin(h.id) * 30), scale: 1.5 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="absolute bottom-10 left-1/2 text-red-500"
                                >
                                    <Heart fill="currentColor" size={24} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Interaction Buttons (Floating) */}
                    <div className="absolute bottom-5 right-5 flex flex-col gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); addHeart(); }}
                            title="Send Love"
                            aria-label="Send a heart to the creator"
                            className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 hover:scale-110 active:scale-95 transition-all text-white"
                        >
                            <Heart fill="white" size={20} />
                        </button>
                        <button
                            onClick={() => setShowTipModal(true)}
                            title="Quick Gift"
                            aria-label="Send a quick gift"
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/40 hover:scale-110 active:scale-95 transition-all text-white"
                        >
                            <Gift size={20} />
                        </button>
                    </div>

                    {/* Controls (visible on hover) */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-4">
                            <button
                                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                title="Play / Pause"
                                aria-label="Play or pause stream"
                            >
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
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${stream?.user_id || 'CodeWizard'}`} className="rounded-xl" alt="Creator Avatar" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">{stream?.title || 'Building a Web3 AI Orchestrator'}</h2>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    <span className="text-violet-400 font-bold">{stream?.user_id || 'CodeWizard'}</span> · {stream?.category || 'Tech'} · {viewerCount.toLocaleString()} watching
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

                {/* Info Panels Section */}
                <div className="grid grid-cols-2 gap-4">
                    {infoPanels.map(panel => (
                        <motion.div
                            key={panel.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel p-6 border-white/5 group relative"
                        >
                            {editingPanel === panel.id ? (
                                <div className="space-y-4">
                                    <input 
                                        autoFocus
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-violet-500 outline-none"
                                        defaultValue={panel.title}
                                        onBlur={(e) => savePanel(panel.id, e.target.value, panel.content)}
                                        onKeyDown={(e) => e.key === 'Enter' && savePanel(panel.id, e.currentTarget.value, panel.content)}
                                    />
                                    <textarea 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-400 focus:border-violet-500 outline-none h-24 resize-none"
                                        defaultValue={panel.content}
                                        onBlur={(e) => savePanel(panel.id, panel.title, e.target.value)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-[0.2em] mb-4">{panel.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">
                                        {panel.content}
                                    </p>
                                    <button 
                                        onClick={() => setEditingPanel(panel.id)}
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/5 rounded-lg text-slate-500"
                                    >
                                        <Settings2 size={12} />
                                    </button>
                                </>
                            )}
                        </motion.div>
                    ))}
                    
                    {/* Create Panel Button */}
                    <button
                        onClick={addPanel}
                        className="glass-panel p-6 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-violet-400 hover:border-violet-500/30 transition-all"
                    >
                        <Zap size={20} className="animate-glow-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">Create New Panel</span>
                    </button>
                </div>
            </div>

            {/* Chat Panel */}
            <div className="col-span-4 glass-panel flex flex-col h-full">
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
