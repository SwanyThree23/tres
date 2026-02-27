"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lock, Eye, CheckCircle2, Database } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="text-center space-y-4"
      >
        <h1 className="text-hero-sm text-white flex items-center justify-center gap-4">
          <Lock size={40} className="text-cyan" />
          Privacy & Data Policy
        </h1>
        <p className="text-readout text-text-muted">
          How we handle your digital footprint
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
            <Eye className="text-cyan" size={24} />
            <h2 className="text-section-header-sm text-white uppercase tracking-widest">
              Biometric & Device Data
            </h2>
          </div>
          <p>
            CYLive processes camera and microphone data solely for the purpose
            of broadcasting. during the beta:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>No Permanent Storage:</strong> Stream video/audio packets
              are not stored permanently by CYLive unless explicitly saved as a
              "Clip" by the creator.
            </li>
            <li>
              <strong>AI Processing:</strong> Audio transcription and visual
              moderation are handled in real-time by ephemeral AI nodes. This
              data is discarded after the stream ends.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="text-gold" size={24} />
            <h2 className="text-section-header-sm text-white uppercase tracking-widest">
              Financial Transparency
            </h2>
          </div>
          <p>We utilize a 90/10 split tracking system.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Creator Earnings:</strong> 90% of all Tips and Marketplace
              purchases go directly to the creator.
            </li>
            <li>
              <strong>Platform Fee:</strong> 10% is retained for infrastructure
              and AI processing costs.
            </li>
            <li>
              <strong>Stripe Integration:</strong> All payment data is handled
              via Stripe. CYLive does not store credit card numbers on its
              servers.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green" size={24} />
            <h2 className="text-section-header-sm text-white uppercase tracking-widest">
              Guardian Privacy Mode
            </h2>
          </div>
          <p>
            When "Guardian AI" is active, it implements a privacy-first filter.
            If the camera detects faces or environments not explicitly cleared
            by the "Onboarding Sweep", it will apply a subtle algorithmic blur
            to maintain user privacy.
          </p>
        </section>

        <div className="pt-8 border-t border-border">
          <p className="text-readout-sm italic text-cyan">
            Your data is your legacy. We just broadcast it.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
