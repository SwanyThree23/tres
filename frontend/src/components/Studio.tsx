import React, { useState } from 'react';
import { Play, Radio, Users, Zap, DollarSign, BarChart3, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { streamService } from '../services/api';

interface StudioProps {
    isLive: boolean;
    setIsLive: (live: boolean) => void;
    onAction: (title: string, body: string) => void;
}

const Studio: React.FC<StudioProps> = ({ isLive, setIsLive, onAction }) => {
    const [isStarting, setIsStarting] = useState(false);

    const handleStartLive = async () => {
        setIsStarting(true);
        try {
            // Simulated first, then actual API call
            await streamService.createStream({ title: "My Awesome Stream", description: "Powered by SwanyThree" });
            setIsLive(true);
            onAction('Broadcast Started', 'Your stream is now live reaching thousands of viewers.');
        } catch (error) {
            onAction('Connection Error', 'Failed to reach the ingest server. Using local failover.');
            // Fallback for demo
            setIsLive(true);
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-full">
            <div className="col-span-8 space-y-6">
                {/* Video Player Area */}
                <section className="glass-panel p-1 relative overflow-hidden aspect-video group rounded-3xl">
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                        {isLive ? (
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 animate-pulse">
                                    <Radio className="text-red-500" size={40} />
                                </div>
                                <p className="text-lg font-medium text-white">Live Stream Active</p>
                            </div>
                        ) : (
                            <button
                                onClick={handleStartLive}
                                disabled={isStarting}
                                aria-label="Start live broadcast"
                                title="Go Live"
                                className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-violet-500/50 disabled:opacity-50"
                            >
                                {isStarting ? (
                                    <Loader2 className="text-white animate-spin" size={28} />
                                ) : (
                                    <Play className="text-white fill-white ml-1" size={28} />
                                )}
                            </button>
                        )}
                    </div>

                    <div className="absolute top-6 left-6 flex gap-3">
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${isLive ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                            {isLive ? 'Live' : 'Offline'}
                        </div>
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-2 text-white">
                            <Users size={12} /> {isLive ? '1,248' : '0'} Viewers
                        </div>
                    </div>
                </section>

                {/* Feature Quick Actions */}
                <div className="grid grid-cols-3 gap-4">
                    <button
                        onClick={() => onAction('Stripe Trace', 'Checking payout accounts...')}
                        className="glass-panel p-5 hover:border-violet-500/50 transition-all group text-left"
                        aria-label="View Stripe Payouts"
                    >
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                            <DollarSign size={20} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">Stripe Payouts</h3>
                        <p className="text-[11px] text-slate-400">Integrated with Connect accounts.</p>
                    </button>

                    <button
                        onClick={() => onAction('AI Orchestrator', 'Scanning stream for highlights...')}
                        className="glass-panel p-5 hover:border-cyan-500/50 transition-all group text-left"
                        aria-label="Manage AI Highlights"
                    >
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">AI Highlights</h3>
                        <p className="text-[11px] text-slate-400">Mint 4K clips as NFTs automatically.</p>
                    </button>

                    <button
                        className="glass-panel p-5 hover:border-violet-500/50 transition-all group text-left"
                        aria-label="View Advanced Analytics"
                    >
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 text-violet-500">
                            <BarChart3 size={20} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">Advanced Analytics</h3>
                        <p className="text-[11px] text-slate-400">Real-time viewer behavior metrics.</p>
                    </button>
                </div>
            </div>

            <div className="col-span-4 space-y-6">
                <div className="glass-panel p-6">
                    <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-6">Engine Integrations</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Stripe Connect', status: 'Verified', color: 'text-green-400' },
                            { name: 'Vault AES-256', status: 'Sealed', color: 'text-violet-400' },
                            { name: 'AI Director', status: 'Nominal', color: 'text-cyan-400' },
                            { name: 'WebRTC Mesh', status: 'Latent-Low', color: 'text-emerald-400' },
                        ].map(item => (
                            <div key={item.name} className="flex items-center justify-between">
                                <span className="text-xs text-slate-300 font-medium">{item.name}</span>
                                <span className={`text-[10px] font-bold ${item.color}`}>{item.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-6 bg-gradient-to-br from-violet-600/10 to-transparent">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estimated Revenue</h3>
                        <BarChart3 size={14} className="text-slate-500" />
                    </div>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-[11px] mb-2 text-slate-400">
                                <span>Tips & Donations</span>
                                <span className="text-white font-mono">$1,240</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full">
                                <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} className="h-full bg-violet-500 rounded-full" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[11px] mb-2 text-slate-400">
                                <span>NFT Royalties</span>
                                <span className="text-white font-mono">$840</span>
                            </div>
                            <div className="h-1.5 bg-slate-800 rounded-full">
                                <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} className="h-full bg-cyan-500 rounded-full" />
                            </div>
                        </div>
                        <div className="pt-6 border-t border-white/5 mt-4">
                            <p className="text-3xl font-bold text-white tracking-tight">$2,080<span className="text-slate-600 text-sm ml-1 font-normal">.50</span></p>
                            <p className="text-[10px] text-green-400 mt-2 flex items-center gap-1">
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
