import React, { useState } from 'react';
import { X, Tv2, Users, Globe, Lock, Shield, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WatchPartyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (party: any) => void;
}

const WatchPartyModal: React.FC<WatchPartyModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState('');
    const [visibility, setVisibility] = useState('public');
    const [category, setCategory] = useState('Tech');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        onCreate({
            title,
            host: 'You',
            viewers: '0',
            color: 'border-violet-500/30',
            category,
            visibility
        });
        setTitle('');
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass-panel w-full max-w-lg overflow-hidden shadow-2xl border-white/10 bg-surface-dark"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-600/20 rounded-xl text-violet-400">
                                <Tv2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Initiate Watch Party</h2>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Shared Reality Experience</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors" title="Close modal">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Session Title</label>
                            <input 
                                type="text"
                                placeholder="E.g. Apple Keynote Reaction"
                                className="input-field"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Primary Category</label>
                                <select 
                                    id="party-category"
                                    title="Session Category"
                                    className="input-field appearance-none cursor-pointer"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="Tech">Tech & Future</option>
                                    <option value="Gaming">Gaming Hub</option>
                                    <option value="Creative">Creative Arts</option>
                                    <option value="Music">Live Beats</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Initial Visibility</label>
                                <div className="flex gap-2">
                                    <button 
                                        type="button"
                                        onClick={() => setVisibility('public')}
                                        className={`flex-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${visibility === 'public' ? 'border-violet-500 bg-violet-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-400'}`}
                                    >
                                        Public
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setVisibility('private')}
                                        className={`flex-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${visibility === 'private' ? 'border-red-500 bg-red-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-400'}`}
                                    >
                                        Private
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-start gap-4">
                            <div className="p-2 bg-cyan-400/20 rounded-lg text-cyan-400 shrink-0">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-cyan-400">AI Director Active</h4>
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">System will automatically handle scene transitions and chat highlights for this session.</p>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Zap size={16} fill="white" /> Launch Experience
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default WatchPartyModal;
