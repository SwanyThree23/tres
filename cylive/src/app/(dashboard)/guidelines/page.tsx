"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, ShieldAlert, Zap } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="text-center space-y-4"
      >
        <h1 className="text-hero-sm text-white flex items-center justify-center gap-4">
          <Users size={40} className="text-accent" />
          Community Guidelines
        </h1>
        <p className="text-readout text-text-muted">
          Standards for the Inner Circle
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="glass-panel p-8 space-y-8 text-body leading-relaxed text-text-secondary"
      >
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-red" size={24} />
            <h2 className="text-section-header-sm text-white uppercase tracking-widest">
              Zero Tolerance Policy
            </h2>
          </div>
          <p className="border-l-4 border-red pl-4 bg-red/5 py-3 rounded-r-lg">
            CYLive maintains a strict zero-tolerance policy for harassment, hate
            speech, explicit illegal content, and targeted abuse. Violations
            result in an immediate and permanent "Shadow Ban" across the entire
            network.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="text-purple" size={24} />
            <h2 className="text-section-header-sm text-white uppercase tracking-widest">
              Guardian AI Moderation
            </h2>
          </div>
          <p>
            Every stream is monitored by <strong>Guardian AI</strong>. This
            system processes real-time audio and chat to detect policy
            violations.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Privacy Shield:</strong> Guardian AI automatically blurs
              sensitive data (passwords, addresses) if detected on screen.
            </li>
            <li>
              <strong>Auto-Mute:</strong> Excessive toxic language will trigger
              a temporary channel mute.
            </li>
            <li>
              <strong>Dox Protection:</strong> Intentional sharing of private
              information about others is a Tier 1 violation.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-section-header-sm text-white uppercase tracking-widest">
            Aura Etiquette
          </h2>
          <p>
            The "Aura" system reflects your standing in the community. Boost
            your Aura by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Engaging positively with new creators.</li>
            <li>Providing accurate bug reports.</li>
            <li>Participating in voice nodes with respect.</li>
          </ul>
        </section>

        <div className="pt-8 border-t border-border">
          <p className="text-readout-sm italic text-accent">
            Protect the circuit. Respect the grid.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
