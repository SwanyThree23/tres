// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Login Page
//
// TYPOGRAPHY:
//   Bebas Neue       → hero headline, page title
//   Barlow Condensed → body, buttons, inputs, descriptions
//   DM Mono          → labels, error readouts, metadata
//
// Both brand signatures are always present via root layout
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SignalBars } from "@/components/primitives/SignalBars";
import {
  Zap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      try {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result?.error) {
          setError("Invalid email or password. Please try again.");
        } else {
          router.push(callbackUrl);
        }
      } catch {
        setError("Connection failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, callbackUrl, router],
  );

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel-elevated p-10">
          {/* ── Logo & Brand ─────────────────────────────────────── */}
          <div className="text-center mb-10">
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 animate-glow-pulse"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent), var(--cyan))",
                boxShadow: "var(--glow-accent)",
              }}
            >
              <Zap className="text-white fill-white" size={32} />
            </div>

            {/* Display headline — Bebas Neue */}
            <h1
              className="text-hero-sm text-white"
              style={{ fontSize: "36px" }}
            >
              CYLive
            </h1>
            {/* Body — Barlow Condensed */}
            <p
              className="text-body mt-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign in to your broadcast command center
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <SignalBars size="sm" color="green" />
              {/* DM Mono readout */}
              <span
                className="text-readout-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Platform Online
              </span>
            </div>
          </div>

          {/* ── Error State ──────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-3 p-3.5 rounded-xl mb-6"
                style={{
                  background: "rgba(255, 59, 48, 0.08)",
                  border: "1px solid rgba(255, 59, 48, 0.2)",
                }}
              >
                <AlertCircle
                  size={16}
                  className="shrink-0 mt-0.5"
                  style={{ color: "var(--red)" }}
                />
                {/* DM Mono error readout */}
                <span
                  className="text-readout-sm"
                  style={{ color: "var(--red)" }}
                >
                  {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Login Form ───────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              {/* DM Mono label */}
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="artist@cylive.app"
                  className="input-field pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: "var(--text-muted)" }}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="•••••••••"
                  className="input-field pl-11 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={16} style={{ color: "var(--text-muted)" }} />
                  ) : (
                    <Eye size={16} style={{ color: "var(--text-muted)" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit — Barlow Condensed Semibold */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* ── Social Divider ───────────────────────────────────── */}
          <div className="flex items-center gap-4 my-7">
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
            {/* DM Mono label */}
            <span
              className="text-readout-sm"
              style={{ color: "var(--text-dim)" }}
            >
              Or continue with
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--border)" }}
            />
          </div>

          {/* ── OAuth Buttons — Barlow Condensed ─────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl })}
              className="btn-ghost"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 mr-1.5"
                fill="currentColor"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => signIn("apple", { callbackUrl })}
              className="btn-ghost"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 mr-1.5"
                fill="currentColor"
              >
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Apple
            </button>
          </div>

          {/* ── Register CTA ─────────────────────────────────────── */}
          <div
            className="text-center mt-8 pt-6"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            {/* Barlow Condensed */}
            <p className="text-body-sm" style={{ color: "var(--text-muted)" }}>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold hover:underline transition-colors"
                style={{ color: "var(--accent)" }}
              >
                Join CYLive
              </Link>
            </p>
          </div>
        </div>

        {/* ── Footer — DM Mono ──────────────────────────────────── */}
        <p
          className="text-center mt-6 text-readout-sm"
          style={{ color: "var(--text-dim)" }}
        >
          © {new Date().getFullYear()} CYLive • Culture Creator Platform
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#03030A]">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
