import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Zap, Globe, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWebSocket } from '../services/api';

interface ChatMsg {
    id: number;
    user: string;
    text: string;
    avatar: string;
    isHighlight: boolean;
    translation?: string;
}

interface ChatPanelProps {
    streamId?: string;
    onAction?: (title: string, body: string) => void;
    isCreator?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ streamId, onAction, isCreator }) => {
    const [messages, setMessages] = useState<ChatMsg[]>([
        { id: 1, user: 'NeonVibes', text: 'LETS GOOOO 🔥', avatar: 'A1', isHighlight: false },
        { id: 2, user: 'CyberPunker', text: 'This AI director is insane!', avatar: 'B2', isHighlight: true },
    ]);
    const [input, setInput] = useState('');
    const [isUniversal, setIsUniversal] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!streamId) return;

        const ws = createWebSocket();
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'subscribe', room: `stream_${streamId}` }));
        };

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'chat') {
                const msg: ChatMsg = {
                    id: Date.now(),
                    user: data.user_name,
                    text: data.text,
                    avatar: data.avatar,
                    isHighlight: data.is_highlight,
                    translation: data.translation
                };
                setMessages(prev => [...prev.slice(-50), msg]);
            } else if (data.type === 'error') {
                onAction?.('Chat Error', data.body);
            }
        };

        return () => ws.close();
    }, [streamId, onAction]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !wsRef.current || !streamId) return;

        wsRef.current.send(JSON.stringify({
            type: 'chat',
            room: `stream_${streamId}`,
            text: input,
            user_name: isCreator ? 'Creator_Dev' : 'User_42',
            avatar: isCreator ? 'Felix' : 'Guest',
            universal: isUniversal
        }));

        setInput('');
    };

    return (
        <div className="glass-panel flex flex-col h-full overflow-hidden border-white/5 shadow-2xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/5">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-violet-400" />
                    <span className="font-bold text-sm tracking-tight text-white">Live Chat</span>
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                </div>
                {isCreator && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/10 rounded-full border border-violet-500/20">
                        <Shield size={10} className="text-violet-400" />
                        <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">Director</span>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar bg-slate-950/20">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex gap-3 group ${msg.isHighlight ? 'bg-violet-500/5 rounded-2xl p-3 border border-violet-500/10' : ''}`}
                        >
                            <img
                                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.avatar}`}
                                className="w-8 h-8 rounded-xl border border-white/10 shrink-0 mt-0.5 shadow-lg"
                                alt={msg.user}
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${msg.user.includes('Creator') ? 'text-cyan-400' : 'text-violet-400'}`}>
                                        {msg.user}
                                    </span>
                                    {msg.isHighlight && (
                                        <span className="text-[7px] font-black bg-amber-500 text-black px-1.5 py-0.5 rounded-md">VIP</span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-200 leading-relaxed font-medium break-words">{msg.text}</p>
                                {msg.translation && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 p-2 bg-gradient-to-r from-violet-600/10 to-cyan-600/10 rounded-xl border border-white/5 backdrop-blur-md"
                                    >
                                        <p className="text-[10px] text-cyan-300 italic flex items-center gap-1.5 font-medium">
                                            <Globe size={10} className="text-cyan-400" /> {msg.translation}
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input */}
            <div className="px-4 py-4 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                <form onSubmit={handleSend} className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={isUniversal ? "Global Translate Mode..." : "Say something..."}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            title="Send Message"
                            className="p-3 bg-violet-600 rounded-2xl hover:bg-violet-500 hover:scale-105 active:scale-95 transition-all text-white shadow-lg shadow-violet-500/20"
                        >
                            <Zap size={16} fill="white" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between px-1">
                        <button
                            type="button"
                            onClick={() => setIsUniversal(!isUniversal)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
                                isUniversal 
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                                : 'bg-white/5 text-slate-500 border border-transparent hover:bg-white/10'
                            }`}
                        >
                            <Globe size={11} className={isUniversal ? 'animate-spin-slow' : ''} />
                            Universal Translation
                        </button>
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">Enter to send</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;
