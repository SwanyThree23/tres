"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Scale, FileText } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className="text-center space-y-4"
      >
        <h1 className="text-hero-sm text-white flex items-center justify-center gap-4">
          <Scale size={40} className="text-gold" />
          Beta Participation Agreement
        </h1>
        <p className="text-readout text-text-muted">
          Last Updated: February 27, 2026
        </p>
      </motion.div>

      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="glass-panel p-8 space-y-6 text-body leading-relaxed text-text-secondary"
      >
        <section className="space-y-4">
          <h2 className="text-section-header-sm text-white">
            1. Beta Nature of Software
          </h2>
          <p>
            The User acknowledges that the CYLive platform is currently in
            "Beta" status. This means the software is provided
            <strong> "AS-IS"</strong> and <strong>"AS AVAILABLE"</strong>.
            CYLive makes no warranties, express or implied, regarding the
            stability, reliability, or accuracy of the platform during this
            period.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-section-header-sm text-white">
            2. Liability Limits
          </h2>
          <p>
            To the maximum extent permitted by law, CYLive and its developers
            (Inner Circle) shall not be liable for any direct, indirect,
            incidental, or consequential damages arising from the use or
            inability to use the platform. This includes, but is not limited to,
            loss of streaming data, financial discrepancies, or hardware
            malfunctions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-section-header-sm text-white">
            3. Feedback and Ownership
          </h2>
          <p>
            By participating in the beta, you agree that any feedback, bug
            reports, or suggestions you provide become the exclusive property of
            CYLive. You grant CYLive a perpetual, royalty-free, worldwide
            license to use and implement such feedback without compensation.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-section-header-sm text-white">
            4. Feedback Guidelines
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Reports must be submitted through the official Bug Report Portal.
            </li>
            <li>
              Constructive criticism is encouraged; derogatory language towards
              the development team is not.
            </li>
            <li>
              Confidentiality: Do not share internal beta features outside of
              the CYLive Discord or platform.
            </li>
          </ul>
        </section>

        <div className="pt-8 border-t border-border">
          <p className="text-readout-sm italic text-gold">
            By continuing to use this platform, you signify your acceptance of
            these terms.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
