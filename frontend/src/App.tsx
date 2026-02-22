import React, { useState, useEffect } from 'react';
import {
    Zap,
    Bell,
    LayoutDashboard,
    BarChart3,
    Wallet,
    Clapperboard,
    Compass,
    Search,
    Settings as SettingsIcon,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Studio from './components/Studio';
import Analytics from './components/Analytics';
import Payouts from './components/Payouts';
import NFTs from './components/NFTs';
import Browse from './components/Browse';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('studio');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLive, setIsLive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // WebSocket Integration
    useEffect(() => {
        const token = localStorage.getItem('token') || 'demo-user-id';
        const wsUrl = `ws://${window.location.host}/api/ws?token=${token}`;

        // In local development without the full backend running, we silenty fail or use a heartbeat 
        // to avoid console noise if the server isn't ready.
        let socket: WebSocket;
        try {
            socket = new WebSocket(wsUrl);
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    addNotification(data.title || 'New Alert', data.body || 'You received a notification.');
                } catch (e) {
                    console.error('WS Data Parse Err:', e);
                }
            };

            socket.onerror = () => {
                // Fallback for demonstration when developer isn't running the backend service
                console.log('Connecting to SwanyThree Brain...');
            };
        } catch (e) {
            console.log('WS Setup Error');
        }

        return () => socket?.close();
    }, []);

    const addNotification = (title: string, body: string) => {
        const id = Date.now();
        setNotifications(prev => [{ id, title, body }, ...prev]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 6000);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'studio': return <Studio isLive={isLive} setIsLive={setIsLive} onAction={addNotification} />;
            case 'browse': return <Browse />;
            case 'analytics': return <Analytics />;
            case 'payouts': return <Payouts />;
            case 'nfts': return <NFTs />;
            default: return <Studio isLive={isLive} setIsLive={setIsLive} onAction={addNotification} />;
        }
    };

    const navItems = [
        { id: 'browse', icon: Compass, label: 'Explore' },
        { id: 'studio', icon: LayoutDashboard, label: 'Studio' },
        { id: 'analytics', icon: BarChart3, label: 'Insights' },
        { id: 'payouts', icon: Wallet, label: 'Finance' },
        { id: 'nfts', icon: Clapperboard, label: 'Vault' },
    ];

    return (
        <div className="flex h-screen bg-deep-dark overflow-hidden text-slate-200">

            {/* Sidebar Navigation */}
            <aside className="w-24 flex flex-col items-center py-8 border-r border-white/5 bg-surface-dark z-50">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 mb-12">
                    <Zap className="text-white fill-white" size={24} />
                </div>

                <nav className="flex-1 space-y-4">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            aria-label={item.label}
                            title={item.label}
                            className={`p-4 rounded-2xl transition-all duration-300 relative group ${activeTab === item.id
                                    ? 'bg-violet-600 text-white shadow-2xl shadow-violet-500/40'
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={22} />
                            {activeTab === item.id && (
                                <motion.div layoutId="nav-glow" className="absolute inset-0 bg-violet-400/20 blur-xl rounded-full z-[-1]" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-white/5 space-y-4">
                    <button className="p-4 text-slate-500 hover:text-white transition-colors" title="Settings">
                        <SettingsIcon size={22} />
                    </button>
                    <button className="p-4 text-slate-500 hover:text-red-400 transition-colors" title="Sign Out">
                        <LogOut size={22} />
                    </button>
                </div>
            </aside>

            {/* Main Layout Area */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Top Header */}
                <header className="h-20 px-10 flex items-center justify-between border-b border-white/5 bg-surface-dark/50 backdrop-blur-xl shrink-0">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search streams, clips, or creators..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors relative"
                            aria-label="Notifications"
                        >
                            <Bell size={20} className="text-slate-400" />
                            {notifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-[#030303]" />
                            )}
                        </button>
                        <div className="h-10 w-px bg-white/5 mx-2" />
                        <div className="flex items-center gap-3 pr-2">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white">Swany_Dev</p>
                                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Master Affiliate</p>
                            </div>
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-0.5 shadow-xl shadow-violet-500/10">
                                <img
                                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                    className="rounded-2xl bg-slate-900 h-full w-full object-cover"
                                    alt="User Avatar"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                {/* View Scrolling Content */}
                <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {renderContent()}
                </main>
            </div>

            {/* Floating Notification Popovers */}
            <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
                <AnimatePresence>
                    {notifications.map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 50, scale: 0.8 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="glass-panel p-5 w-80 pointer-events-auto shadow-2xl border-l-4 border-l-violet-500 bg-surface-dark"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <Bell className="text-violet-400" size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white leading-tight">{n.title}</h4>
                                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{n.body}</p>
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
