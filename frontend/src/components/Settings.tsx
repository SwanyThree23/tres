import React, { useState } from 'react';
import {
    User, Shield, Bell, Palette, Webhook, Key,
    Save, Eye, EyeOff, CheckCircle2, Moon,
    Sliders, Globe, CreditCard, Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';

type Tab = 'profile' | 'security' | 'notifications' | 'integrations' | 'appearance';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);
    const [darkMode] = useState(true);
    const [notifications, setNotifications] = useState({
        tips: true,
        subscriptions: true,
        nftSales: true,
        mentions: false,
        broadcasts: true,
        analytics: false,
    });

    const [profile, setProfile] = useState({
        displayName: 'Swany_Dev',
        bio: 'Master affiliate. AI-powered livestreaming pioneer.',
        location: 'San Francisco, CA',
        website: 'https://swanythree.io',
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'security', icon: Shield, label: 'Security' },
        { id: 'notifications', icon: Bell, label: 'Notifications' },
        { id: 'integrations', icon: Webhook, label: 'Integrations' },
        { id: 'appearance', icon: Palette, label: 'Appearance' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 text-sm mt-1">Manage your platform preferences and account.</p>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Sidebar */}
                <nav className="col-span-3">
                    <div className="glass-panel p-2 space-y-1">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeTab === t.id
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Content */}
                <div className="col-span-9">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="glass-panel p-7 space-y-6"
                    >
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold mb-1">Profile Information</h2>
                                    <p className="text-sm text-slate-400">Update your public creator profile.</p>
                                </div>

                                {/* Avatar */}
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 p-0.5">
                                            <img
                                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                                                className="w-full h-full rounded-2xl bg-slate-900"
                                                alt="Avatar"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <button className="btn-primary text-xs px-4 py-2 mb-2 block">Upload Photo</button>
                                        <p className="text-[10px] text-slate-500">Recommended: 400×400px. JPG, PNG, GIF.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label htmlFor="display-name" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Display Name</label>
                                        <input
                                            id="display-name"
                                            type="text"
                                            value={profile.displayName}
                                            onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                                            placeholder="Your display name"
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="location" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Location</label>
                                        <input
                                            id="location"
                                            type="text"
                                            value={profile.location}
                                            onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                                            placeholder="City, Country"
                                            className="input-field"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label htmlFor="bio" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bio</label>
                                        <textarea
                                            id="bio"
                                            value={profile.bio}
                                            onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                            rows={3}
                                            placeholder="Tell viewers about yourself..."
                                            className="input-field resize-none"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label htmlFor="website" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                                            <input
                                                id="website"
                                                type="url"
                                                value={profile.website}
                                                onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                                                placeholder="https://example.com"
                                                className="input-field pl-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                                    <button
                                        onClick={handleSave}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${saved
                                            ? 'bg-green-600 text-white'
                                            : 'bg-violet-600 text-white hover:bg-violet-500'
                                            }`}
                                    >
                                        {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                                        {saved ? 'Saved!' : 'Save Changes'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold mb-1">Security & Access</h2>
                                    <p className="text-sm text-slate-400">Manage your password, tokens, and 2FA.</p>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Password</label>
                                        <input type="password" placeholder="••••••••" className="input-field" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New Password</label>
                                            <input type="password" placeholder="••••••••" className="input-field" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirm Password</label>
                                            <input type="password" placeholder="••••••••" className="input-field" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/8">
                                        <div className="flex items-center gap-3">
                                            <Shield size={18} className="text-violet-400" />
                                            <div>
                                                <p className="text-sm font-semibold text-white">Two-Factor Auth</p>
                                                <p className="text-xs text-slate-400">Extra layer of security for your account.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-green-400 font-bold">Enabled</span>
                                            <div className="w-10 h-5 bg-green-600 rounded-full relative cursor-pointer">
                                                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white flex items-center gap-2">
                                                <Key size={14} className="text-amber-400" /> Stream Key
                                            </p>
                                            <p className="text-xs text-slate-400">Use this in OBS or any streaming software.</p>
                                        </div>
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                                        >
                                            {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                                            {showKey ? 'Hide' : 'Reveal'}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            id="stream-key"
                                            type={showKey ? 'text' : 'password'}
                                            value="sk-swany3-live-abc123def456xyz789"
                                            readOnly
                                            title="Stream key"
                                            placeholder="Stream key hidden"
                                            aria-label="Stream key"
                                            className="input-field font-mono text-xs flex-1"
                                        />
                                        <button className="btn-ghost px-4 text-xs py-0">Copy</button>
                                        <button className="btn-danger px-4 text-xs py-0">Reset</button>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2 border-t border-white/5">
                                    <button onClick={handleSave} className="btn-primary">
                                        {saved ? 'Saved!' : 'Update Password'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold mb-1">Notification Preferences</h2>
                                    <p className="text-sm text-slate-400">Choose what events trigger real-time alerts.</p>
                                </div>

                                <div className="space-y-3">
                                    {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                                            <div>
                                                <p className="text-sm font-semibold text-white capitalize">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {key === 'tips' && 'Get notified when viewers send you tips.'}
                                                    {key === 'subscriptions' && 'Alert on new subscriber events.'}
                                                    {key === 'nftSales' && 'NFT marketplace sale confirmations.'}
                                                    {key === 'mentions' && 'When another creator mentions you.'}
                                                    {key === 'broadcasts' && 'Your scheduled broadcast reminders.'}
                                                    {key === 'analytics' && 'Weekly analytics digest emails.'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setNotifications(n => ({ ...n, [key]: !value }))}
                                                aria-label={`Toggle ${key} notifications`}
                                                className={`w-11 h-6 rounded-full relative transition-all duration-300 ${value ? 'bg-violet-600' : 'bg-slate-700'}`}
                                            >
                                                <div className={`toggle-knob ${value ? 'right-0.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 pt-2 border-t border-white/5">
                                    <button onClick={handleSave} className="btn-primary">
                                        {saved ? 'Saved!' : 'Save Preferences'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Integrations Tab */}
                        {activeTab === 'integrations' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold mb-1">Platform Integrations</h2>
                                    <p className="text-sm text-slate-400">Connect external services to power your stream.</p>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { name: 'Stripe Connect', desc: 'Payment processing & payouts', status: 'Connected', color: 'text-green-400', icon: CreditCard },
                                        { name: 'OpenRouter AI', desc: 'LLM-powered transcript & highlights', status: 'Active', color: 'text-cyan-400', icon: Sliders },
                                        { name: 'Polygon NFT', desc: 'On-chain NFT minting contract', status: 'Deployed', color: 'text-violet-400', icon: Globe },
                                    ].map(item => (
                                        <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/3 border border-white/7 hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-xl bg-white/5 ${item.color}`}>
                                                    <item.icon size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{item.name}</p>
                                                    <p className="text-xs text-slate-400">{item.desc}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-bold ${item.color}`}>{item.status}</span>
                                                <button className="btn-ghost px-3 py-1.5 text-xs">Manage</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <>
                                <div>
                                    <h2 className="text-lg font-bold mb-1">Appearance</h2>
                                    <p className="text-sm text-slate-400">Customize how the platform looks for you.</p>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Color Theme</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { name: 'Cosmic (Default)', from: 'from-violet-600', to: 'to-cyan-500', active: true },
                                                { name: 'Neon Ember', from: 'from-orange-500', to: 'to-pink-600', active: false },
                                                { name: 'Emerald Tech', from: 'from-emerald-500', to: 'to-cyan-600', active: false },
                                            ].map(theme => (
                                                <button
                                                    key={theme.name}
                                                    className={`p-4 rounded-2xl border text-left transition-all ${theme.active
                                                        ? 'border-violet-500/50 bg-violet-500/10'
                                                        : 'border-white/8 glass-panel hover:border-white/20'
                                                        }`}
                                                >
                                                    <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${theme.from} ${theme.to} mb-2`} />
                                                    <p className="text-xs font-semibold text-white">{theme.name}</p>
                                                    {theme.active && <p className="text-[10px] text-violet-400 mt-0.5">Active</p>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/8">
                                        <div className="flex items-center gap-3">
                                            <Moon size={18} className="text-violet-400" />
                                            <div>
                                                <p className="text-sm font-semibold text-white">Dark Mode</p>
                                                <p className="text-xs text-slate-400">Always-on dark interface.</p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 bg-violet-600 rounded-full relative`}>
                                            <div className="w-[18px] h-[18px] bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
                                        <div className="flex items-center gap-3">
                                            <Trash2 size={16} className="text-red-400" />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-red-400">Delete Account</p>
                                                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
                                            </div>
                                            <button className="btn-danger px-4 py-2 text-xs">Delete</button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
