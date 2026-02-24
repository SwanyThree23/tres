import React, { useState } from 'react';
import { Share2, Plus, Twitch, Youtube, Facebook, Globe, Trash2, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Destination {
    id: string;
    platform: string;
    name: string;
    url: string;
    isActive: boolean;
}

const Destinations: React.FC = () => {
    const [destinations, setDestinations] = useState<Destination[]>([
        { id: '1', platform: 'Twitch', name: 'Twitch Sync', url: 'rtmp://live.twitch.tv/app/', isActive: true },
        { id: '2', platform: 'YouTube', name: 'YT Main Hub', url: 'rtmp://a.rtmp.youtube.com/live2', isActive: false },
    ]);

    const toggleDestination = (id: string) => {
        setDestinations(prev => prev.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
    };

    const addDestination = () => {
        const id = Date.now().toString();
        setDestinations([...destinations, {
            id,
            platform: 'Custom',
            name: 'New Destination',
            url: 'rtmp://',
            isActive: true
        }]);
    };

    const removeDestination = (id: string) => {
        setDestinations(prev => prev.filter(d => d.id !== id));
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
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${d.isActive ? 'left-5' : 'left-1'}`} />
                                    </button>
                                    <button 
                                        onClick={() => removeDestination(d.id)}
                                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
