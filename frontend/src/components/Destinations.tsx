import React, { useState } from 'react';
import { Share2, Plus, Twitch, Youtube, Facebook, Globe, Trash2, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { streamService } from '../services/api';

interface DestinationsProps {
    streamId?: string;
}

interface Destination {
    id: string;
    platform: string;
    name: string;
    url: string;
    isActive: boolean;
}

const Destinations: React.FC<DestinationsProps> = ({ streamId }) => {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (streamId) {
            setLoading(true);
            streamService.getDestinations(streamId)
                .then(res => setDestinations(res.data))
                .catch(err => console.error("Failed to load destinations", err))
                .finally(() => setLoading(false));
        }
    }, [streamId]);

    const toggleDestination = async (id: string) => {
        // Toggle logic (simulate for now as backend endpoint is simpler)
        setDestinations(prev => prev.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
    };

    const addDestination = async () => {
        if (!streamId) {
            alert("Start your stream first to add destinations!");
            return;
        }
        try {
            const res = await streamService.addDestination(streamId, {
                platform: 'custom_rtmp',
                rtmp_url: 'rtmp://',
                stream_key: '••••••••'
            });
            setDestinations([...destinations, res.data]);
        } catch (err) {
            console.error("Failed to add destination", err);
        }
    };

    const removeDestination = async (id: string) => {
        if (!streamId) return;
        try {
            await streamService.removeDestination(streamId, id);
            setDestinations(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error("Failed to remove", err);
        }
    };

    const getIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'twitch': return <Twitch className="text-violet-400" size={18} />;
            case 'youtube': return <Youtube className="text-red-500" size={18} />;
            case 'facebook': return <Facebook className="text-blue-500" size={18} />;
            default: return <Globe className="text-cyan-400" size={18} />;
        }
    };

    return (
        <div className="glass-panel p-6 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Share2 className="text-violet-500" size={20} />
                    <h3 className="font-bold text-lg text-white">Guest Destinations</h3>
                </div>
                <button 
                    onClick={addDestination}
                    className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all active:scale-95"
                    title="Add Destination"
                >
                    <Plus size={16} />
                </button>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {destinations.map((d, i) => (
                        <motion.div
                            key={d.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center">
                                        {getIcon(d.platform)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-none">{d.name}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{d.platform}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => toggleDestination(d.id)}
                                        className={`w-10 h-6 rounded-full relative transition-colors ${d.isActive ? 'bg-green-500' : 'bg-slate-700'}`}
                                        title={d.isActive ? "Deactivate destination" : "Activate destination"}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${d.isActive ? 'left-5' : 'left-1'}`} />
                                    </button>
                                    <button 
                                        onClick={() => removeDestination(d.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete this destination"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-lg border border-white/5">
                                <ShieldCheck size={10} className="text-slate-600" />
                                <span className="text-[9px] font-mono text-slate-500 truncate">{d.url}••••••••</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {destinations.length === 0 && (
                    <div className="py-10 text-center">
                        <p className="text-xs text-slate-600 italic">No active destinations. Your stream is currently local.</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Zap size={12} className="fill-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Multi-Stream Engine Active</span>
                </div>
            </div>
        </div>
    );
};

export default Destinations;
