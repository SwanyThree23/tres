import React, { useState } from 'react';
import { Shield, Lock, Globe, Users, Check, X, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: any) => void;
    title: string;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, onSave, title }) => {
    const [visibility, setVisibility] = useState('public');
    const [roles, setRoles] = useState({
        coHost: true,
        moderator: true,
        viewerChat: true,
        viewerReact: true
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass-panel w-full max-w-lg overflow-hidden shadow-2xl border-white/10"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">{title}</h2>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Access & Performance Settings</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400" title="Close settings">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Visibility Section */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Discovery & Privacy</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => setVisibility('public')}
                                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${visibility === 'public' ? 'border-violet-500 bg-violet-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                            >
                                <Globe size={18} className={visibility === 'public' ? 'text-violet-400' : 'text-slate-500'} />
                                <span className="text-[10px] font-bold text-white">Public</span>
                            </button>
                            <button 
                                onClick={() => setVisibility('unlisted')}
                                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${visibility === 'unlisted' ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                            >
                                <Users size={18} className={visibility === 'unlisted' ? 'text-cyan-400' : 'text-slate-500'} />
                                <span className="text-[10px] font-bold text-white">Guest Only</span>
                            </button>
                            <button 
                                onClick={() => setVisibility('private')}
                                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${visibility === 'private' ? 'border-red-500 bg-red-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                            >
                                <Lock size={18} className={visibility === 'private' ? 'text-red-400' : 'text-slate-500'} />
                                <span className="text-[10px] font-bold text-white">Closed</span>
                            </button>
                        </div>
                    </div>

                    {/* Features Permissions */}
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Interactive Controls</p>
                        <div className="space-y-3">
                            {[
                                { id: 'coHost', label: 'Allow Co-Hosts to Sync Video', icon: Shield },
                                { id: 'viewerChat', label: 'Allow Real-time Chatting', icon: Zap },
                                { id: 'viewerReact', label: 'Allow Floating Reactions (Hearts)', icon: Users },
                            ].map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <item.icon size={16} className="text-violet-400" />
                                        <span className="text-sm text-slate-200">{item.label}</span>
                                    </div>
                                    <button 
                                        onClick={() => setRoles((r: any) => ({ ...r, [item.id]: !r[item.id] }))}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${roles[item.id as keyof typeof roles] ? 'bg-green-500' : 'bg-slate-700'}`}
                                        title={`Toggle ${item.label}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${roles[item.id as keyof typeof roles] ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-white/5 border-t border-white/5 flex gap-3">
                    <button 
                        onClick={onClose}
                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={() => { onSave({ visibility, roles }); onClose(); }}
                        className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        Save Configuration
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PermissionModal;
