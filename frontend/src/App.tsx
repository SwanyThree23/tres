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

    // Real WebSocket Connection for Notifications
    useEffect(() => {
        // In a production app, the token would come from your Auth provider
        const token = 'demo-user-id';
        const wsUrl = `ws://${window.location.host}/api/ws?token=${token}`;

        const socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                addNotification(
                    data.title || 'New Notification',
                    data.body || 'You received an update.'
                );
            } catch (err) {
                console.error('Failed to parse WS message:', err);
            }
        };

        socket.onopen = () => console.log('WebSocket Connected to SwanyThree Brain');
        socket.onerror = (error) => console.log('WebSocket Error:', error);
        socket.onclose = () => console.log('WebSocket Disconnected');

        return () => socket.close();
    }, []);

    const addNotification = (title: string, body: string) => {
        const id = Date.now();
        const newNotif = { id, title, body };
        setNotifications(prev => [newNotif, ...prev]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Premium Navbar */}
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

            {/* Main Layout */}
            <main className="flex-1 p-6 grid grid-cols-12 gap-6">
                {/* Sidebar */}
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

                {/* Dashboard Panels */}
                <div className="col-span-11 grid grid-cols-12 gap-6">
                    <div className="col-span-8 space-y-6">
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
                                        onClick={() => setIsLive(true)}
                                        className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center hover:scale-110 transition-transform shadow-2xl shadow-violet-500/50"
                                    >
                                        <Play className="text-white fill-white ml-1" size={28} />
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
                                onClick={() => addNotification('Simulation', 'Tip received: $20.00')}
                                className="glass-panel p-5 hover:border-violet-500/50 transition-all group text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                                    <DollarSign size={20} />
                                </div>
                                <h3 className="font-semibold text-white mb-1">Stripe Payouts</h3>
                                <p className="text-[11px] text-slate-400">Integrated with Connect accounts.</p>
                            </button>

                            <button
                                className="glass-panel p-5 hover:border-cyan-500/50 transition-all group text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
                                    <Zap size={20} />
                                </div>
                                <h3 className="font-semibold text-white mb-1">AI Highlights</h3>
                                <p className="text-[11px] text-slate-400">Mint 4K clips as NFTs automatically.</p>
                            </button>

                            <button
                                className="glass-panel p-5 hover:border-violet-500/50 transition-all group text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 text-violet-500">
                                    <BarChart3 size={20} />
                                </div>
                                <h3 className="font-semibold text-white mb-1">Advanced Analytics</h3>
                                <p className="text-[11px] text-slate-400">Real-time viewer behavior metrics.</p>
                            </button>
                        </div>
                    </div>

                    {/* Stats & Tools */}
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
            </main>

            {/* Real-time Notifications */}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
                <AnimatePresence>
                    {notifications.map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ x: 100, opacity: 0, scale: 0.9 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            exit={{ x: 100, opacity: 0, scale: 0.9 }}
                            className="glass-panel p-5 w-80 shadow-2xl border-l-4 border-l-violet-500"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                                    <Bell className="text-violet-400" size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">{n.title}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed mt-1">{n.body}</p>
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
