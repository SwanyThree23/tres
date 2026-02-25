// ──────────────────────────────────────────────────────────────────────────────
// CYLive — Register Page
//
// TYPOGRAPHY:
//   Bebas Neue       → hero heading
//   Barlow Condensed → body, inputs, buttons
//   DM Mono          → labels, errors, readouts
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SignalBars } from "@/components/primitives/SignalBars";
import { Eye, EyeOff, UserPlus, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.username || !form.password || !form.displayName) {
      setError("All fields are required");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Redirect to login after successful registration
      router.push("/login?registered=true");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--bg-deep)" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-[100px]"
        style={{
          background: "radial-gradient(circle, var(--cyan), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel-elevated p-8 w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {/* Status readout */}
            <SignalBars size="sm" />
            <span className="text-readout-sm" style={{ color: "var(--green)" }}>
              Creating Account
            </span>
          </div>
          <h1
            className="font-display text-white"
            style={{ fontSize: "36px", letterSpacing: "0.04em" }}
          >
            JOIN CYLIVE
          </h1>
          <p
            className="text-body-sm mt-2"
            style={{ color: "var(--text-muted)" }}
          >
            Create your creator account and start streaming
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-displayname" className="input-label">
              Display Name
            </label>
            <input
              id="reg-displayname"
              type="text"
              placeholder="Your Name"
              value={form.displayName}
              onChange={(e) => updateField("displayName", e.target.value)}
              className="input-field"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="reg-username" className="input-label">
              Username
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-readout-sm"
                style={{ color: "var(--text-dim)" }}
              >
                @
              </span>
              <input
                id="reg-username"
                type="text"
                placeholder="username"
                value={form.username}
                onChange={(e) =>
                  updateField(
                    "username",
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                className="input-field pl-8"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="input-label">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="input-field"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="input-label">
              Password
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="input-field pr-12"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p
              className="text-readout-sm mt-1.5 ml-1"
              style={{ color: "var(--text-dim)" }}
            >
              Use 8+ characters with a mix of letters, numbers & symbols
            </p>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-readout-sm p-3 rounded-lg"
              style={{
                background: "rgba(255,59,48,0.1)",
                color: "var(--accent)",
                border: "1px solid rgba(255,59,48,0.15)",
              }}
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={16} />
                Create Account
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-body-sm" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--cyan)] hover:underline font-bold"
            >
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
