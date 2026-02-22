import React from 'react';
import { BarChart3, TrendingUp, Users, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Analytics: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-4 gap-6">
                {[
                    { label: 'Total Viewers', value: '42.8K', icon: Users, color: 'text-violet-400', trend: '+12%' },
                    { label: 'Avg Watch Time', value: '18:42', icon: Clock, color: 'text-cyan-400', trend: '+5%' },
                    { label: 'Peak Concurrency', value: '2,481', icon: Zap, color: 'text-emerald-400', trend: '+24%' },
                    { label: 'Growth Rate', value: '8.4%', icon: TrendingUp, color: 'text-amber-400', trend: '+2%' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-6"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 glass-panel p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-bold text-lg">Audience Engagement</h3>
                        <div className="flex gap-2">
                            {['24H', '7D', '30D'].map(t => (
                                <button key={t} className="px-3 py-1 text-[10px] font-bold rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-64 flex items-end gap-3 px-4">
                        {[40, 65, 45, 90, 75, 55, 85, 30, 45, 60, 95, 80].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                className="flex-1 bg-gradient-to-t from-violet-600/40 to-cyan-400/60 rounded-t-lg relative group"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {h}K Viewers
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    <div className="flex justify-between pt-4 border-t border-white/5 mt-4 text-[10px] text-slate-500 font-medium">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>23:59</span>
                    </div>
                </div>

                <div className="col-span-4 space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="font-bold mb-4">Traffic Sources</h3>
                        <div className="space-y-4">
                            {[
                                { name: 'External Referrals', value: 45, color: 'bg-violet-500' },
                                { name: 'Platform Browse', value: 30, color: 'bg-cyan-500' },
                                { name: 'Social Shares', value: 15, color: 'bg-emerald-500' },
                                { name: 'Direct Links', value: 10, color: 'bg-slate-500' },
                            ].map(source => (
                                <div key={source.name}>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-slate-400">{source.name}</span>
                                        <span className="text-white font-mono">{source.value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${source.color}`}
                                            style={{ '--bar-width': `${source.value}%`, width: 'var(--bar-width)' } as React.CSSProperties}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6 bg-violet-600/5 border-violet-500/20">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="text-violet-400" size={20} />
                            <h3 className="font-bold">AI Suggestion</h3>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Based on recent 4K highlights, your audience engagement peaks during **High-Action Combat** scenes. Consider more frequent AI Highlight minting in the next broadcast.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
