"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Bug,
  Send,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function BugReportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    device: "",
    steps: "",
    severity: "LOW",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/support/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 rounded-full bg-green/10 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-green" />
        </div>
        <h2 className="text-3xl text-white font-bold">Vector Logged</h2>
        <p className="text-text-muted max-w-sm">
          Your report has been transmitted to the Inner Circle. Thank you for
          securing the grid.
        </p>
        <button onClick={() => setSubmitted(false)} className="btn-ghost">
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="space-y-2"
      >
        <h1 className="text-page-title text-white flex items-center gap-3">
          <Bug size={24} className="text-accent" />
          Bug Report Portal
        </h1>
        <p className="text-readout text-text-muted">
          Direct uplink to the development hive
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="glass-panel p-8 space-y-6"
      >
        <div className="space-y-2">
          <label
            htmlFor="bug-title"
            className="text-readout-sm text-text-muted block"
          >
            Incident Title
          </label>
          <input
            id="bug-title"
            required
            placeholder="e.g., Stream lag on high panels"
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="bug-device"
            className="text-readout-sm text-text-muted block"
          >
            Terminal Device / OS
          </label>
          <input
            id="bug-device"
            required
            placeholder="e.g., Windows 11 / Chrome 121"
            className="input-field"
            value={form.device}
            onChange={(e) => setForm({ ...form, device: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="bug-severity"
            className="text-readout-sm text-text-muted block"
          >
            Threat Level
          </label>
          <select
            id="bug-severity"
            className="input-field"
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
          >
            <option value="LOW">Minor Glitch (User Interface)</option>
            <option value="MEDIUM">
              Functional Obstruction (Feature fail)
            </option>
            <option value="HIGH">Critical Vector (Platform crash)</option>
            <option value="CRITICAL">Security Breach (Data danger)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="bug-steps"
            className="text-readout-sm text-text-muted block"
          >
            Steps to Reproduce
          </label>
          <textarea
            id="bug-steps"
            required
            rows={5}
            placeholder="1. Navigate to Studio&#10;2. Click 'Go Live'&#10;3. Observe the hang..."
            className="input-field resize-none py-3"
            value={form.steps}
            onChange={(e) => setForm({ ...form, steps: e.target.value })}
          />
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            Submit Incident Report
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red/5 border border-red/10">
            <AlertTriangle size={14} className="text-red" />
            <span className="text-[10px] text-red uppercase tracking-tighter font-bold">
              Verified Node Only
            </span>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
