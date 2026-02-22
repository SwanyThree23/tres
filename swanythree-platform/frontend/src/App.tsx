import React, { useState, useEffect } from 'react';
import {
    Radio,
    Wallet,
    BarChart3,
    Zap,
    Bell,
    LayoutDashboard,
    Play,
    Users,
    DollarSign,
    Clapperboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('studio');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLive, setIsLive] = useState(false);

    // Mock Notification Trigger
    const simulateNotification = (title: string, body: string) => {
        const id = Date.now();
        const newNotif = { id, title, body };
        setNotifications(prev => [newNotif, ...prev]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 glass-panel mx-4 mt-4 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Zap className="text-white fill-white" size={20} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">SwanyThree<span className="text-cyan-400">.</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors relative">
                        <Bell size={20} className="text-slate-400" />
                        {notifications.length > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                    </button>
                    <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 p-0.5">
                        <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                            className="rounded-full bg-slate-800"
                            alt="Avatar"
                        />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-6 grid grid-cols-12 gap-6">
                {/* Sidebar Nav */}
                <div className="col-span-1 flex flex-col items-center gap-6 py-4">
                    {[
                        { id: 'studio', icon: LayoutDashboard },
                        { id: 'analytics', icon: BarChart3 },
                        { id: 'payouts', icon: Wallet },
                        { id: 'nfts', icon: Clapperboard },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-3 rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-violet-600 text-white shadow-xl shadow-violet-500/40'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={24} />
                        </button>
                    ))}
                </div>

                {/* Dynamic Panel */}
                <div className="col-span-11 grid grid-cols-12 gap-6">

                    {/* Left Side: Main View */}
                    <div className="col-span-8 space-y-6">
                        <section className="glass-panel p-1 relative overflow-hidden aspect-video group">
                            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                                {isLive ? (
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 animate-pulse">
                                            <Radio className="text-red-500" size={40} />
                                        </div>
                                        <p className="text-lg font-medium">Broadcast Live</p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsLive(true)}
                                        className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-violet-500/50"
                                    >
                                        <Play className="text-white fill-white ml-1" size={28} />
                                    </button>
                                )}
                            </div>

                            {/* Overlay Tags */}
                            <div className="absolute top-6 left-6 flex gap-3">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${isLive ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                                    {isLive ? 'Live' : 'Offline'}
                                </div>
                                <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                                    <Users size={14} /> {isLive ? '1,248' : '0'}
                                </div>
                            </div>
                        </section>

                        {/* Quick Actions Integration */}
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                onClick={() => simulateNotification('New Tip!', 'User1tipped you $10.00')}
                                className="glass-panel p-4 hover:border-violet-500/50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20">
                                    <DollarSign className="text-green-500" size={20} />
                                </div>
                                <h3 className="font-semibold mb-1">Send Mock Tip</h3>
                                <p className="text-xs text-slate-400">Test Stripe & Notification flow</p>
                            </button>

                            <button
                                onClick={() => simulateNotification('Minting Started', 'AI is enhancing highlight metadata...')}
                                className="glass-panel p-4 hover:border-cyan-500/50 transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:bg-cyan-500/20">
                                    <Zap className="text-cyan-400" size={20} />
                                </div>
                                <h3 className="font-semibold mb-1">Mint NFT</h3>
                                <p className="text-xs text-slate-400">AI Metadata + Blockchain record</p>
                            </button>

                            <div className="glass-panel p-4 opacity-50 cursor-not-allowed">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
                                    <Radio className="text-violet-500" size={20} />
                                </div>
                                <h3 className="font-semibold mb-1">Studio Controls</h3>
                                <p className="text-xs text-slate-400">Coming Soon</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Status & Small Stats */}
                    <div className="col-span-4 space-y-6">
                        <div className="glass-panel p-6">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Account Status</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Stripe Connect</span>
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded-md">ACTIVE</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Vault Security</span>
                                    <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-bold rounded-md">ENCRYPTED</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">AI Orchestrator</span>
                                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold rounded-md">OLLAMA-3.2</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Revenue Analysis</h3>
                                <BarChart3 size={16} className="text-slate-500" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-slate-400">Direct Tips</span>
                                        <span className="text-xs font-medium">$1,240.00</span>
                                    </div>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-violet-500 w-[65%]" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-slate-400">Subscriptions</span>
                                        <span className="text-xs font-medium">$3,850.50</span>
                                    </div>
                                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 w-[85%]" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5 mt-4">
                                    <p className="text-2xl font-bold font-mono">$5,090.50</p>
                                    <p className="text-[10px] text-green-400 mt-1">+12% from last broadcast</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Real-time Notification Popups */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {notifications.map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className="glass-panel p-4 w-72 pointer-events-auto border-l-4 border-l-violet-500"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                                    <Bell className="text-violet-400" size={16} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                                    <p className="text-xs text-slate-400">{n.body}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default App;
