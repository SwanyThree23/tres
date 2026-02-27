"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Star,
  ShieldCheck,
  Zap,
  Sparkles,
  Globe,
  ArrowRight,
} from "lucide-react";
import { BroadcastCard } from "@/components/primitives/BroadcastCard";

export default function GoldTierCard() {
  return (
    <BroadcastCard className="border-gold bg-gradient-to-br from-gold/5 via-transparent to-gold/10 relative overflow-hidden group">
      {/* Background flare */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold/10 blur-[80px] group-hover:bg-gold/20 transition-all duration-700" />

      <div className="relative z-10 p-2">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold flex items-center justify-center shadow-lg shadow-gold/20">
              <Star className="text-black fill-black" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-widest uppercase">
                Gold Tier
              </h3>
              <p className="text-readout-sm text-gold font-bold">
                THE INNER CIRCLE
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-stat text-3xl text-white">$49.99</p>
            <p className="text-readout-sm text-text-dim uppercase">Per Month</p>
          </div>
        </div>

        <h4 className="text-hero-sm text-white mb-6 leading-tight">
          STOP STREAMING.
          <br />
          <span className="text-gold">START DOMINATING.</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {[
            {
              icon: ShieldCheck,
              label: "Guardian AI Protection",
              desc: "Real-time privacy & moderation",
            },
            {
              icon: Globe,
              label: "Multi-Platform Fanout",
              desc: "Broadcast to 10+ endpoints",
            },
            {
              icon: Sparkles,
              label: "AI Highlight Generation",
              desc: "Auto-clipped viral moments",
            },
            {
              icon: Zap,
              label: "Ultra-Low Latency",
              desc: "Sub-500ms global grid delay",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <feature.icon size={18} className="text-gold mt-0.5" />
              <div>
                <p className="text-readout-sm text-white font-bold">
                  {feature.label}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-gold w-full py-4 text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform">
          UPGRADE TO GOLD
          <ArrowRight size={20} />
        </button>

        <p className="text-center text-[10px] text-text-dim mt-4 uppercase tracking-widest font-bold">
          Unlock the full circuit potential
        </p>
      </div>
    </BroadcastCard>
  );
}
