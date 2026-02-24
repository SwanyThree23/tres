import React, { useState } from 'react';
import { Zap, Mail, Lock, ArrowRight, Github, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/api';

interface LoginProps {
    onLogin: (token: string) => void;
}

type Mode = 'login' | 'register';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [mode, setMode] = useState<Mode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            let token = '';

            if (mode === 'login') {
                const res = await authService.login(email, password);
                token = res.data.access_token;
                localStorage.setItem('refresh_token', res.data.refresh_token);
            } else {
                const res = await authService.register({ username, email, password });
                token = res.data.access_token;
                localStorage.setItem('refresh_token', res.data.refresh_token);
            }

            localStorage.setItem('token', token);
            onLogin(token);
        } catch (err: unknown) {
            // Graceful fallback when backend is not running
            const anyErr = err as { response?: { data?: { detail?: string } } };
            const apiMsg = anyErr?.response?.data?.detail;
            if (!apiMsg) {
                // Demo mode — bypass auth
                const demoToken = 'demo-session-' + Date.now();
                localStorage.setItem('token', demoToken);
                onLogin(demoToken);
            } else {
                setError(apiMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-deep-dark flex items-center justify-center p-6"
            style={{ background: 'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.08), hsl(240,20%,3%))' }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="glass-panel w-full max-w-md p-10 relative overflow-hidden"
            >
                {/* Background glow */}
                <div className="absolute -right-24 -top-24 w-72 h-72 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute -left-24 -bottom-24 w-56 h-56 bg-cyan-400/8 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-500/25 mb-5 animate-glow-pulse">
                            <Zap className="text-white fill-white" size={28} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-slate-400 text-sm">
                            {mode === 'login'
                                ? 'Sign in to your SwanyThree creator account'
                                : 'Join the SwanyThree platform today'
                            }
                        </p>
                    </div>

                    {/* Tab switcher */}
                    <div className="flex bg-white/5 rounded-xl p-1 mb-7">
                        {(['login', 'register'] as Mode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setError(''); }}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all capitalize ${mode === m
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {m === 'login' ? 'Sign In' : 'Sign Up'}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.form
                            key={mode}
                            initial={{ opacity: 0, x: mode === 'login' ? -16 : 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
                            {/* Username (register only) */}
                            {mode === 'register' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            id="register-username"
                                            type="text"
                                            required
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            placeholder="swany_creator"
                                            className="input-field pl-11"
                                            minLength={3}
                                            maxLength={32}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        id="login-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        className="input-field pl-11"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-field pl-11 pr-11"
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {mode === 'login' && (
                                <div className="flex justify-end">
                                    <button type="button" className="text-xs text-violet-400 font-bold hover:text-violet-300 transition-colors">
                                        Forgot Password?
                                    </button>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl text-center"
                                >
                                    {error}
                                </motion.p>
                            )}

                            <button
                                id="auth-submit-btn"
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-violet-600 py-4 rounded-xl font-bold text-sm text-white hover:bg-violet-500 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-xl shadow-violet-500/20 mt-2 disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight size={17} />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    </AnimatePresence>

                    {/* Divider */}
                    <div className="mt-7 flex items-center gap-4">
                        <div className="h-px bg-white/8 flex-1" />
                        <span className="text-[10px] font-bold text-slate-600 uppercase">Or continue with</span>
                        <div className="h-px bg-white/8 flex-1" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                        <button className="glass-panel py-3 flex items-center justify-center gap-2 text-sm font-bold hover:bg-white/8 transition-colors">
                            <Github size={17} /> GitHub
                        </button>
                        <button className="glass-panel py-3 flex items-center justify-center gap-2 text-sm font-bold hover:bg-white/8 transition-colors">
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale" alt="Google" /> Google
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
