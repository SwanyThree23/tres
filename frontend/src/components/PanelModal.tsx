import React, { useState } from 'react';
import { X, Zap, Layout, Link as LinkIcon, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PanelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (panel: string) => void;
}

const PanelModal: React.FC<PanelModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('info');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name);
        setName('');
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
                            <div className="p-2 bg-cyan-400/20 rounded-xl text-cyan-400">
                                <Layout size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Create Profile Panel</h2>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Deep Integration Module</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors" title="Close modal">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Panel Identifier</label>
                            <input 
                                type="text"
                                placeholder="E.g. Weekly Stream Schedule"
                                className="input-field"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Panel Template</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'info', label: 'Rich Information', icon: Info, color: 'text-blue-400' },
                                    { id: 'schedule', label: 'Stream Schedule', icon: Calendar, color: 'text-emerald-400' },
                                    { id: 'links', label: 'Social Hub', icon: LinkIcon, color: 'text-violet-400' },
                                    { id: 'stats', label: 'Live Metrics', icon: Zap, color: 'text-amber-400' },
                                ].map(item => (
                                    <button 
                                        key={item.id}
                                        type="button"
                                        onClick={() => setType(item.id)}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${type === item.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <item.icon size={20} className={type === item.id ? 'text-white' : item.color} />
                                        <span className="text-[10px] font-bold text-white">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-violet-600/5 border border-violet-600/10 flex items-start gap-4">
                            <div className="p-2 bg-violet-600/20 rounded-lg text-violet-400 shrink-0">
                                <Zap size={16} fill="currentColor" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-violet-400">Universal Translation Enabled</h4>
                                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">This panel will be automatically translated for global viewers based on their locale.</p>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                        >
                            <Zap size={16} fill="white" /> Initialize Module
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PanelModal;
