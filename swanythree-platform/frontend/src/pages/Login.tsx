/**
 * SwanyThree Login/Register Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Tv } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  display_name: z.string().max(100).optional(),
});

type FormData = z.infer<typeof registerSchema>;

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);
    try {
      const result = isRegister
        ? await authApi.register(data)
        : await authApi.login({ email: data.email, password: data.password });
      login(result.user, result.access_token, result.refresh_token);
      navigate('/');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-st3-dark p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <Tv className="w-10 h-10 text-st3-gold" />
            <h1 className="text-4xl font-black text-st3-gold">SwanyThree</h1>
          </div>
          <p className="text-st3-cream/60">Creator-first streaming platform</p>
        </div>

        <div className="card border-st3-burgundy/30">
          <h2 className="text-xl font-bold text-st3-cream mb-6">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-st3-cream/70 mb-1">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com" className="w-full" />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-st3-cream/70 mb-1">Username</label>
                  <input {...register('username')} placeholder="coolstreamer" className="w-full" />
                  {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-st3-cream/70 mb-1">Display Name</label>
                  <input {...register('display_name')} placeholder="Cool Streamer" className="w-full" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-st3-cream/70 mb-1">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-st3-cream/40 hover:text-st3-cream"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
                reset();
              }}
              className="text-sm text-st3-gold hover:text-st3-gold-dim transition-colors"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        <p className="text-center text-st3-cream/30 text-xs mt-6">90% revenue goes to creators. Always.</p>
      </motion.div>
    </div>
  );
}
