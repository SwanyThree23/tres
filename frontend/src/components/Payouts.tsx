import React from 'react';
import { Wallet, CreditCard, Building, History, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Payouts: React.FC = () => {
    return (
        <div className="grid grid-cols-12 gap-6 animate-fade-in">
            <div className="col-span-8 space-y-6">
                <div className="glass-panel p-8 bg-gradient-to-br from-violet-600/5 to-cyan-400/5">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-1">Available Balance</h3>
                            <p className="text-slate-400 text-sm italic">Next payout scheduled for Oct 24, 2026</p>
                        </div>
                        <button className="bg-white text-black px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2">
                            Withdraw Funds <ExternalLink size={14} />
                        </button>
                    </div>

                    <div className="flex items-baseline gap-2 mb-8">
                        <span className="text-5xl font-bold">$12,480</span>
                        <span className="text-2xl text-slate-500 font-medium">.42</span>
                        <span className="ml-4 text-green-400 text-xs font-bold px-2 py-0.5 bg-green-500/10 rounded-full">Ready for payout</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/5">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Tips</p>
                            <p className="text-xl font-bold">$4,281.50</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">NFT Residuals</p>
                            <p className="text-xl font-bold">$6,108.92</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Sub Revenue</p>
                            <p className="text-xl font-bold">$2,090.00</p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold">Recent Ledger Transactions</h3>
                        <button className="text-xs text-violet-400 font-bold hover:underline">Download CSV</button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { type: 'Tip', user: 'TechnoMage', amount: 50.00, date: '2 min ago', status: 'Succeeded' },
                            { type: 'NFT Sale', user: 'CyberPunker', amount: 420.00, date: '1 hour ago', status: 'Pending' },
                            { type: 'Tip', user: 'GhostWalker', amount: 15.00, date: '3 hours ago', status: 'Succeeded' },
                            { type: 'Subscription', user: 'NeonNights', amount: 9.99, date: '5 hours ago', status: 'Succeeded' },
                        ].map((tx, i) => (
                            <div key={i} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tx.type === 'Tip' ? 'bg-green-500/10 text-green-500' : 'bg-cyan-500/10 text-cyan-500'
                                        }`}>
                                        {tx.type === 'Tip' ? <CreditCard size={18} /> : <Building size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold">{tx.type} from {tx.user}</h4>
                                        <p className="text-[10px] text-slate-500">{tx.date} • ID: TX-90210-{i}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold font-mono">+${tx.amount.toFixed(2)}</p>
                                    <p className={`text-[10px] font-bold ${tx.status === 'Succeeded' ? 'text-green-500' : 'text-amber-500'}`}>
                                        {tx.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="col-span-4 space-y-6">
                <div className="glass-panel p-6 border-violet-500/20 bg-violet-600/5">
                    <div className="flex items-center gap-3 mb-6">
                        <ShieldCheck className="text-violet-400" size={24} />
                        <h3 className="font-bold">Connect Identity</h3>
                    </div>
                    <div className="space-y-4 mb-6 text-sm text-slate-400">
                        <div className="flex justify-between">
                            <span>Account ID</span>
                            <span className="text-white font-mono">acct_1H2...X42</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Type</span>
                            <span className="text-white">Express Connect</span>
                        </div>
                        <div className="flex justify-between">
                            <span>KYC Status</span>
                            <span className="text-green-400 font-bold">Verified</span>
                        </div>
                    </div>
                    <button className="w-full py-3 bg-violet-600 rounded-xl font-bold text-sm hover:bg-violet-500 transition-colors">
                        Manage Connect Portal
                    </button>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <History size={18} className="text-slate-400" /> Payout History
                    </h3>
                    <div className="space-y-4">
                        {[
                            { date: 'Oct 01, 2026', amount: 8420.00 },
                            { date: 'Sep 01, 2026', amount: 5120.50 },
                        ].map((p, i) => (
                            <div key={i} className="flex justify-between items-center py-2">
                                <span className="text-xs text-slate-400">{p.date}</span>
                                <span className="text-xs font-bold font-mono text-white">${p.amount.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payouts;
