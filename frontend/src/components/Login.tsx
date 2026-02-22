import React, { useState } from 'react';
import { Zap, Mail, Lock, ArrowRight, Github } from 'lucide-react';
import { motion } from 'framer-motion';

interface LoginProps {
    onLogin: (token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulation of a login process
        setTimeout(() => {
            localStorage.setItem('token', 'demo-session-token-' + Date.now());
            onLogin('demo-session-token');
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-deep-dark flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent)]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel w-full max-w-md p-10 relative overflow-hidden"
            >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-violet-600/10 blur-[80px] rounded-full" />

                <div className="relative z-10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 mb-6">
                            <Zap className="text-white fill-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
                        <p className="text-slate-400 text-sm">Sign in to your SwanyThree account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-violet-600 transition-all" />
                                <span className="text-slate-400 group-hover:text-slate-200 transition-colors">Remember me</span>
                            </label>
                            <button type="button" className="text-violet-400 font-bold hover:text-violet-300 transition-colors">Forgot Password?</button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-violet-600 py-4 rounded-xl font-bold text-sm text-white hover:bg-violet-500 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center gap-4">
                        <div className="h-px bg-white/5 flex-1" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Or continue with</span>
                        <div className="h-px bg-white/5 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button className="glass-panel py-3 flex items-center justify-center gap-2 text-sm font-bold hover:bg-white/5 transition-colors">
                            <Github size={18} /> Github
                        </button>
                        <button className="glass-panel py-3 flex items-center justify-center gap-2 text-sm font-bold hover:bg-white/5 transition-colors">
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale" alt="Google" /> Google
                        </button>
                    </div>

                    <p className="text-center text-xs text-slate-500 mt-10 font-medium">
                        Don't have an account?
                        <button className="text-cyan-400 font-bold ml-1 hover:text-cyan-300 transition-colors">Create Account</button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
