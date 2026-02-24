// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Login Page
// Email/Password + Google OAuth + Apple OAuth
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/schemas";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, Chrome } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent to-cyan rounded-3xl flex items-center justify-center shadow-2xl shadow-accent/30 mb-6 animate-glow-pulse">
            <Zap className="text-white fill-white" size={30} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Enter the Grid
          </h1>
          <p className="text-text-muted text-sm mt-2">
            Sign in to your CYLive account
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-panel-elevated p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="input-field pl-11"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                  size={16}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input-field pl-11 pr-11"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              or continue with
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="btn-ghost flex items-center justify-center gap-2 text-sm"
              type="button"
            >
              <Chrome size={16} />
              Google
            </button>
            <button
              onClick={() => signIn("apple", { callbackUrl: "/" })}
              className="btn-ghost flex items-center justify-center gap-2 text-sm"
              type="button"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </button>
          </div>
        </div>

        {/* Register Link */}
        <p className="text-center text-text-muted text-sm mt-6">
          New to CYLive?{" "}
          <Link
            href="/register"
            className="text-accent font-bold hover:text-accent-400 transition-colors"
          >
            Create Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
