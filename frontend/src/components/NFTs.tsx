import React from 'react';
import { Clapperboard, Layers, Share2, ShoppingCart, Zap, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const NFTs: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold">Stream Highlights</h2>
                    <p className="text-slate-400 text-sm">Review, share, and sell your AI-minted 4K clips.</p>
                </div>
                <div className="flex gap-3">
                    <button className="glass-panel px-4 py-2 text-xs font-bold hover:bg-white/5 transition-colors">
                        Collections
                    </button>
                    <button className="bg-cyan-500 text-black px-4 py-2 text-xs font-bold rounded-xl hover:scale-105 transition-transform">
                        Browse Marketplace
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
                {[
                    { title: 'Triple Kill Spree', date: 'Oct 20, 2026', price: '0.42 ETH', video: 'https://api.dicebear.com/7.x/shapes/svg?seed=123', tag: 'Legacy' },
                    { title: 'Epic Clutch Moment', date: 'Oct 18, 2026', price: '0.15 ETH', video: 'https://api.dicebear.com/7.x/shapes/svg?seed=456', tag: 'Rare' },
                    { title: 'Victory Dance', date: 'Oct 15, 2026', price: '0.08 ETH', video: 'https://api.dicebear.com/7.x/shapes/svg?seed=789', tag: 'Common' },
                    { title: 'The Great Glitch', date: 'Oct 14, 2026', price: '1.20 ETH', video: 'https://api.dicebear.com/7.x/shapes/svg?seed=012', tag: 'Legendary' },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel overflow-hidden group border-white/5 hover:border-cyan-500/30 transition-all"
                    >
                        <div className="aspect-video relative bg-slate-900">
                            <img src={item.video} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={item.title} />
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
                                {item.tag}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <Clapperboard className="text-white" size={32} />
                            </div>
                        </div>
                        <div className="p-4">
                            <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                            <p className="text-[10px] text-slate-500 mb-4">{item.date} • #SY-{9000 + i}</p>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Market Price</p>
                                    <p className="text-xs font-bold text-cyan-400 font-mono italic">{item.price}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors" title="Share NFT">
                                        <Share2 size={16} />
                                    </button>
                                    <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors" title="List on Marketplace">
                                        <ShoppingCart size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="glass-panel p-6 border-cyan-500/20 bg-cyan-600/5">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 shrink-0">
                        <Info size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold mb-1">AI Minting Engine Status</h3>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                            Your AI Director is monitoring the live feed. It's currently calibrated to detect **Viral Potential** over 80%. When a clip is minted, metadata is enhanced using **OpenRouter models** and stored on the permanent ledger.
                        </p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full mb-2">OPERATIONAL</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-1.5 h-6 bg-cyan-500/20 rounded-full" />)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NFTs;
