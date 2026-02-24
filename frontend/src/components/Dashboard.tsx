import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Users, Eye, DollarSign, Zap, Star,
    Radio, ArrowUpRight, Crown, Sparkles, Globe, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
    label: string;
    value: string;
    subValue?: string;
    trend: string;
    icon: React.ElementType;
    color: string;
    glowClass: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subValue, trend, icon: Icon, color, glowClass, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className={`glass-panel p-6 ${glowClass}`}
    >
        <div className="flex justify-between items-start mb-5">
            <div className={`p-2.5 rounded-xl bg-white/5 ${color}`}>
                <Icon size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                {trend}
            </span>
        </div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">{label}</p>
        <p className="text-2xl font-bold text-white font-mono">{value}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
    </motion.div>
);

const leaderboard = [
    { rank: 1, user: 'NeonVibe', avatar: 'Felix', revenue: '$8,420', viewers: '12.4K', category: 'Gaming', badge: 'Legendary' },
    { rank: 2, user: 'SynthWaveMaster', avatar: 'Dusty', revenue: '$5,120', viewers: '8.1K', category: 'Music', badge: 'Epic' },
    { rank: 3, user: 'CodeWizard', avatar: 'Ace', revenue: '$3,840', viewers: '6.7K', category: 'Tech', badge: 'Rare' },
    { rank: 4, user: 'PixelArtiste', avatar: 'Misty', revenue: '$2,100', viewers: '4.2K', category: 'Creative', badge: 'Rare' },
    { rank: 5, user: 'Starlight', avatar: 'Lucky', revenue: '$1,800', viewers: '3.9K', category: 'Chatting', badge: 'Common' },
];

const recentActivity = [
    { user: 'TechnoMage', action: 'tipped you', amount: '$50', time: '2m ago', avatar: 'Alpha' },
    { user: 'CyberPunker', action: 'bought your NFT', amount: '$420', time: '18m ago', avatar: 'Beta' },
    { user: 'GhostWalker', action: 'subscribed', amount: '$9.99', time: '1h ago', avatar: 'Gamma' },
    { user: 'NeonNights', action: 'shared your stream', amount: '', time: '2h ago', avatar: 'Delta' },
    { user: 'IronGamer', action: 'followed you', amount: '', time: '3h ago', avatar: 'Epsilon' },
];

const Dashboard: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const stats = [
        { label: 'Total Revenue', value: '$12,480', subValue: 'This month', trend: '+24%', icon: DollarSign, color: 'text-violet-400', glowClass: 'stat-glow-violet' },
        { label: 'Total Viewers', value: '42.8K', subValue: 'Lifetime', trend: '+12%', icon: Users, color: 'text-cyan-400', glowClass: 'stat-glow-cyan' },
        { label: 'Live Viewers', value: '1,248', subValue: 'Right now', trend: '+8%', icon: Eye, color: 'text-emerald-400', glowClass: 'stat-glow-emerald' },
        { label: 'Growth Rate', value: '8.4%', subValue: '30-day avg', trend: '+2%', icon: TrendingUp, color: 'text-amber-400', glowClass: 'stat-glow-amber' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Welcome Banner */}
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 relative overflow-hidden rounded-3xl"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900/30 via-transparent to-cyan-900/20" />
                <div className="absolute -right-10 -top-10 w-80 h-80 bg-violet-600/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-cyan-400/8 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-[0.2em] mb-3">
                            <Sparkles size={13} />
                            SwanyThree Platform
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                            Welcome back, <span className="gradient-text">Swany_Dev</span>
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Your platform is running at peak performance. Here's your real-time overview.
                        </p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1 justify-end">
                            <Clock size={12} />
                            Local Time
                        </div>
                        <p className="text-3xl font-bold font-mono text-white">
                            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3 mt-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-2xl">
                        <span className="w-2 h-2 bg-red-500 rounded-full live-pulse" />
                        <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Live Now</span>
                        <span className="text-white text-xs font-mono">1,248 watching</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
                        <Globe size={12} className="text-violet-400" />
                        <span className="text-violet-400 text-xs font-bold">Master Affiliate</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
                        <Radio size={12} className="text-cyan-400" />
                        <span className="text-cyan-400 text-xs font-bold">4K Stream Active</span>
                    </div>
                </div>
            </motion.section>

            {/* Stat Cards */}
            <div className="grid grid-cols-4 gap-5">
                {stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.08} />)}
            </div>

            {/* Leaderboard + Activity */}
            <div className="grid grid-cols-12 gap-6">

                {/* Leaderboard */}
                <div className="col-span-7 glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Crown className="text-amber-400" size={20} />
                            <h3 className="font-bold text-lg">Creator Leaderboard</h3>
                        </div>
                        <button className="text-xs text-violet-400 font-bold hover:text-violet-300 transition-colors flex items-center gap-1">
                            View All <ArrowUpRight size={13} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {leaderboard.map((creator, i) => (
                            <motion.div
                                key={creator.user}
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.07 }}
                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
                            >
                                <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-black shrink-0 ${creator.rank === 1 ? 'bg-amber-500/20 text-amber-400' :
                                        creator.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                                            creator.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-white/5 text-slate-500'
                                    }`}>
                                    {creator.rank}
                                </span>
                                <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 p-0.5 shrink-0">
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar}`}
                                        className="rounded-full"
                                        alt={creator.user}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-white group-hover:text-violet-400 transition-colors">{creator.user}</p>
                                    <p className="text-[10px] text-slate-500">{creator.category}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold font-mono text-white">{creator.revenue}</p>
                                    <p className="text-[10px] text-slate-500">{creator.viewers} viewers</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 ${creator.badge === 'Legendary' ? 'bg-amber-500/20 text-amber-400' :
                                        creator.badge === 'Epic' ? 'bg-violet-500/20 text-violet-400' :
                                            creator.badge === 'Rare' ? 'bg-cyan-500/20 text-cyan-400' :
                                                'bg-slate-700 text-slate-400'
                                    }`}>
                                    {creator.badge}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="col-span-5 glass-panel p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Zap className="text-cyan-400" size={18} />
                            <h3 className="font-bold text-lg">Live Activity</h3>
                        </div>
                        <span className="w-2 h-2 bg-cyan-400 rounded-full live-pulse" />
                    </div>

                    <div className="space-y-4">
                        {recentActivity.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.25 + i * 0.07 }}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 p-0.5 shrink-0">
                                    <img
                                        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.avatar}`}
                                        className="rounded-lg"
                                        alt={item.user}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white leading-tight">
                                        <span className="text-violet-400">{item.user}</span> {item.action}
                                        {item.amount && <span className="text-green-400"> {item.amount}</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-600 mt-0.5">{item.time}</p>
                                </div>
                                {item.amount && (
                                    <Star size={12} className="text-amber-400 shrink-0" />
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5">
                        <div className="glass-panel p-4 bg-violet-600/5 border-violet-500/15">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={13} className="text-violet-400" />
                                <p className="text-xs font-bold text-violet-400">AI Director Tip</p>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Engagement peaks detected between 8PM–11PM EST. Your next broadcast window is optimal for NFT minting.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
