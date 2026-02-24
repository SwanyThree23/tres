import React, { useEffect, useState } from 'react';
import { Search, Radio, Users, Play, Heart, Star, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { streamService } from '../services/api';

interface Stream {
    id: string;
    title: string;
    viewer_count: number;
    category: string;
    user_id: string;
}

interface BrowseProps {
    onWatch?: (streamId: string) => void;
}

const Browse: React.FC<BrowseProps> = ({ onWatch }) => {
    const categories = ['Gaming', 'Music', 'Chatting', 'Creative', 'Tech', 'Events'];
    const [streams, setStreams] = useState<Stream[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        streamService.getStreams('live')
            .then((res) => setStreams(res.data))
            .catch((err) => console.error("Failed to fetch streams", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Featured Banner */}
            <section className="glass-panel h-80 relative overflow-hidden rounded-[2.5rem] p-12 flex flex-col justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900/40 to-cyan-500/20 z-0" />
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-violet-600/20 blur-[100px] rounded-full" />
                <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-cyan-400/10 blur-[100px] rounded-full" />

                <div className="relative z-10 space-y-4 max-w-xl">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-[0.2em]">
                        <Sparkles size={14} /> Featured Broadcast
                    </div>
                    <h2 className="text-5xl font-bold tracking-tight">The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-300">Social Entertainment</span></h2>
                    <p className="text-slate-300 text-lg leading-relaxed">
                        Discover thousands of creators leveraging AI-augmented streaming tools and deep community integrations.
                    </p>
                    <div className="flex gap-4 pt-4">
                        <button className="bg-violet-600 px-8 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                            Watch Now <Play size={16} fill="white" />
                        </button>
                        <button className="glass-panel px-8 py-3 rounded-2xl font-bold text-sm hover:bg-white/5 transition-all text-white">
                            Add to Library
                        </button>
                    </div>
                </div>
            </section>

            {/* Category Pills */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {categories.map(cat => (
                    <button key={cat} className="glass-panel px-6 py-2.5 rounded-2xl text-xs font-bold hover:border-violet-500/50 transition-all whitespace-nowrap">
                        {cat}
                    </button>
                ))}
            </div>

            {/* Streams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                {loading ? (
                    <div className="col-span-3 flex justify-center py-20">
                        <Loader2 className="animate-spin text-violet-500" size={48} />
                    </div>
                ) : streams.length === 0 ? (
                    <div className="col-span-3 text-center py-20 text-slate-400">
                        No creators are currently live. Check back soon!
                    </div>
                ) : streams.map((stream, i) => (
                    <motion.div
                        key={stream.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group cursor-pointer"
                    >
                        <div className="aspect-video relative rounded-3xl overflow-hidden glass-panel mb-4">
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${stream.id}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt={stream.title} />

                            <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                Live
                            </div>
                            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-white flex items-center gap-2">
                                <Users size={12} /> {stream.viewer_count}
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onWatch?.(stream.id); }}
                                    className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-500/40 hover:scale-105 transition-transform"
                                    aria-label={`Watch ${stream.id}`}
                                    title="Watch Now"
                                >
                                    <Play fill="white" size={20} className="ml-1" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 p-0.5 shrink-0">
                                <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${stream.user_id}`} className="rounded-full" alt="Creator Avatar" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1">{stream.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium">{stream.category}</p>
                            </div>
                            <button
                                className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                                aria-label="Follow Creator"
                                title="Follow Creator"
                            >
                                <Heart size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Browse;
