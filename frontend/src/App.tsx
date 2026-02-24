import React, { useState, useCallback } from 'react';
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
    LogOut,
    Tv2,
    Home,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Dashboard from './components/Dashboard';
import Studio from './components/Studio';
import Analytics from './components/Analytics';
import Payouts from './components/Payouts';
import NFTs from './components/NFTs';
import Browse from './components/Browse';
import Watch from './components/Watch';
import Settings from './components/Settings';
import Login from './components/Login';

// Hooks
import { useWebSocket, type WebSocketMessage } from './hooks/useWebSocket';
import { useAuth } from './hooks/useAuth';

type Tab = 'home' | 'browse' | 'studio' | 'analytics' | 'payouts' | 'nfts' | 'watch' | 'settings';

interface Notification {
    id: number;
    title: string;
    body: string;
}

const App: React.FC = () => {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [activeStreamId, setActiveStreamId] = useState<string | undefined>(undefined);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLive, setIsLive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const requestMedia = async (targetTab?: Tab) => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            addNotification('Access Granted', 'Camera and Microphone are ready for production.');
        } catch (err) {
            console.warn('Media access denied or not provided:', err);
        } finally {
            setHasInteracted(true);
            if (targetTab) setActiveTab(targetTab);
        }
    };

    const addNotification = useCallback((title: string, body: string) => {
        const id = Date.now();
        setNotifications(prev => [{ id, title, body }, ...prev.slice(0, 9)]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 6000);
    }, []);

    // WebSocket with auto-reconnect
    const { isConnected } = useWebSocket(useCallback((msg: WebSocketMessage) => {
        addNotification(msg.title || 'New Alert', msg.body || 'You received a notification.');
    }, [addNotification]));

    const renderContent = () => {
        switch (activeTab) {
            case 'home': return <Dashboard />;
            case 'browse': return <Browse onWatch={(id) => { setActiveStreamId(id); setActiveTab('watch'); }} />;
            case 'studio': return <Studio isLive={isLive} setIsLive={setIsLive} onAction={addNotification} />;
            case 'analytics': return <Analytics />;
            case 'payouts': return <Payouts />;
            case 'nfts': return <NFTs />;
            case 'watch': return <Watch streamId={activeStreamId} onAction={addNotification} onClose={() => { setActiveTab('browse'); setActiveStreamId(undefined); }} />;
            case 'settings': return <Settings />;
            default: return <Dashboard />;
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen bg-deep-dark flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
            </div>
        );
    }

    /* if (!isAuthenticated) {
        return <Login />;
    } */

    const navItems: { id: Tab; icon: React.ElementType; label: string }[] = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'browse', icon: Compass, label: 'Explore' },
        { id: 'studio', icon: LayoutDashboard, label: 'Studio' },
        { id: 'watch', icon: Tv2, label: 'Watch' },
        { id: 'analytics', icon: BarChart3, label: 'Insights' },
        { id: 'payouts', icon: Wallet, label: 'Finance' },
        { id: 'nfts', icon: Clapperboard, label: 'Vault' },
    ];

    const pageTitle: Record<Tab, string> = {
        home: 'Overview',
        browse: 'Explore Streams',
        studio: 'Creator Studio',
        analytics: 'Analytics & Insights',
        payouts: 'Finance & Payouts',
        nfts: 'NFT Vault',
        watch: 'Watch Now',
        settings: 'Settings',
    };

    return (
            {/* ── Sidebar Navigation (Desktop) ────────────────────────── */}
            <aside className="hidden md:flex w-24 flex-col items-center py-8 border-r border-white/5 bg-surface-dark z-50 shrink-0">
                {/* Logo */}
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/25 mb-10 animate-glow-pulse shrink-0">
                    <Zap className="text-white fill-white" size={24} />
                </div>

                {/* Nav Items */}
                <nav className="flex-1 flex flex-col items-center gap-2 w-full px-3">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            id={`nav-${item.id}`}
                            onClick={() => setActiveTab(item.id)}
                            aria-label={item.label}
                            title={item.label}
                            className={`relative w-full p-3.5 rounded-2xl transition-all duration-200 flex flex-col items-center gap-1.5 group ${activeTab === item.id
                                ? 'nav-active text-white'
                                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="text-[9px] font-bold uppercase tracking-wider leading-none">
                                {item.label}
                            </span>
                            {activeTab === item.id && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className="absolute inset-0 rounded-2xl pointer-events-none"
                                    style={{ boxShadow: '0 0 28px rgba(124,58,237,0.35)' }}
                                />
                            )}
                        </button>
                    ))}
                </nav>

                {/* Bottom actions */}
                <div className="flex flex-col items-center gap-2 mt-4 w-full px-3 pt-4 border-t border-white/5">
                    <button
                        id="nav-settings"
                        onClick={() => setActiveTab('settings')}
                        aria-label="Settings"
                        title="Settings"
                        className={`w-full p-3.5 rounded-2xl transition-all flex flex-col items-center gap-1.5 ${activeTab === 'settings'
                            ? 'nav-active text-white'
                            : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                            }`}
                    >
                        <SettingsIcon size={20} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Settings</span>
                    </button>
                    <button
                        id="nav-signout"
                        onClick={logout}
                        title="Sign Out"
                        aria-label="Sign Out"
                        className="w-full p-3.5 rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all flex flex-col items-center gap-1.5"
                    >
                        <LogOut size={20} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Exit</span>
                    </button>
                </div>
            </aside>

            {/* ── Mobile Bottom Navigation ──────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-dark/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-[100]">
                {navItems.slice(0, 5).map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`p-2 flex flex-col items-center gap-1 rounded-xl transition-all ${activeTab === item.id ? 'text-violet-400' : 'text-slate-500'}`}
                        aria-label={item.label}
                    >
                        <item.icon size={20} />
                        <span className="text-[8px] font-bold uppercase tracking-tighter">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* ── Main Content Area ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Top Header */}
                <header className="h-[68px] px-4 md:px-8 flex items-center justify-between border-b border-white/5 bg-surface-dark/60 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="md:hidden w-8 h-8 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-lg flex items-center justify-center">
                            <Zap className="text-white fill-white" size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm md:text-base font-bold text-white truncate max-w-[120px] md:max-w-none">{pageTitle[activeTab]}</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                {isConnected ? (
                                    <Wifi size={9} className="text-emerald-400" />
                                ) : (
                                    <WifiOff size={9} className="text-slate-600" />
                                )}
                                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-widest text-slate-600">
                                    {isConnected ? 'Connected' : 'Demo Online'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex flex-1 max-w-sm mx-6">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                            <input
                                id="global-search"
                                type="text"
                                placeholder="Search streams, creators, clips..."
                                className="w-full bg-white/5 border border-white/8 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button
                                id="notifications-btn"
                                onClick={() => setShowNotifPanel(p => !p)}
                                aria-label="Notifications"
                                title="Notifications"
                                className="p-2.5 bg-white/5 border border-white/8 rounded-xl hover:bg-white/10 transition-colors relative"
                            >
                                <Bell size={18} className="text-slate-400" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-[hsl(240,20%,3%)]" />
                                )}
                            </button>

                            <AnimatePresence>
                                {showNotifPanel && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-80 glass-panel shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                                            <span className="text-sm font-bold text-white">Notifications</span>
                                            {notifications.length > 0 && (
                                                <button
                                                    onClick={() => setNotifications([])}
                                                    className="text-[10px] text-slate-500 hover:text-red-400 font-bold transition-colors"
                                                >
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div className="px-5 py-8 text-center text-slate-500 text-xs">
                                                No notifications yet
                                            </div>
                                        ) : (
                                            <div className="max-h-72 overflow-y-auto custom-scrollbar">
                                                {notifications.map(n => (
                                                    <div key={n.id} className="px-5 py-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                                                        <p className="text-xs font-bold text-white">{n.title}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{n.body}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-8 w-px bg-white/8" />

                        {/* User profile */}
                        <button
                            id="profile-btn"
                            className="flex items-center gap-3 hover:bg-white/5 pl-1 pr-3 py-1 rounded-2xl transition-colors"
                            onClick={() => setActiveTab('settings')}
                            title="Profile Settings"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-xs font-bold text-white leading-tight">{user?.display_name || user?.username || 'Guest'}</p>
                                <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest">{user?.role || 'Viewer'}</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 p-0.5 shrink-0">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`}
                                    className="rounded-xl bg-slate-900 h-full w-full object-cover"
                                    alt="User Avatar"
                                />
                            </div>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.18 }}
                            className="h-full"
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* ── Floating Toast Notifications ─────────────────────── */}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none max-w-xs w-full">
                <AnimatePresence>
                    {notifications.slice(0, 3).map(n => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: 60, scale: 0.85 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 60, scale: 0.85 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="glass-panel p-4 pointer-events-auto shadow-2xl border-l-[3px] border-l-violet-500 bg-surface-dark"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                                    <Bell className="text-violet-400" size={14} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-white leading-tight truncate">{n.title}</h4>
                                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Click-away for notif panel */}
            {showNotifPanel && (
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
            )}
        </div>
    );
};

export default App;
