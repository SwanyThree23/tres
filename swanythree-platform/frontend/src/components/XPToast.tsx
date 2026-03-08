/**
 * SwanyThree XP Toast — Animated XP gain notification.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, TrendingUp } from 'lucide-react';
import { useGamificationStore } from '@/stores/gamificationStore';
import type { GamificationEvent } from '@/types';
import { fireHigh, fireMedium } from '@/components/ConfettiEffect';

export default function XPToast() {
  const [currentEvent, setCurrentEvent] = useState<GamificationEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const { pendingEvents, shiftEvent } = useGamificationStore();

  useEffect(() => {
    if (pendingEvents.length > 0 && !visible) {
      const event = shiftEvent();
      if (event) {
        setCurrentEvent(event);
        setVisible(true);

        // Trigger confetti for level-ups and badges
        if (event.type === 'level_up') {
          fireHigh();
        } else if (event.type === 'badge_earned') {
          fireMedium();
        }

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          setVisible(false);
          setCurrentEvent(null);
        }, 3000);
      }
    }
  }, [pendingEvents, visible, shiftEvent]);

  return (
    <AnimatePresence>
      {visible && currentEvent && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          {currentEvent.type === 'xp_gained' && (
            <div className="bg-st3-panel border border-st3-gold/30 rounded-xl px-6 py-3 shadow-lg shadow-st3-gold/10 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-st3-gold" />
              <div>
                <p className="text-lg font-black text-st3-gold">+{currentEvent.xp_earned} XP</p>
                {currentEvent.multiplier > 1 && (
                  <p className="text-[10px] text-st3-cream/50">{currentEvent.multiplier}x streak bonus</p>
                )}
              </div>
            </div>
          )}

          {currentEvent.type === 'level_up' && (
            <div className="bg-gradient-to-r from-st3-gold/20 to-yellow-500/20 border border-st3-gold rounded-xl px-8 py-4 shadow-lg shadow-st3-gold/20 text-center">
              <Star className="w-8 h-8 text-st3-gold mx-auto mb-1" />
              <p className="text-xl font-black text-st3-gold">LEVEL UP!</p>
              <p className="text-sm text-st3-cream">
                Level {currentEvent.new_level} — {currentEvent.new_title}
              </p>
            </div>
          )}

          {currentEvent.type === 'badge_earned' && (
            <div className="bg-st3-panel border border-purple-400/30 rounded-xl px-6 py-3 shadow-lg shadow-purple-400/10 flex items-center gap-3">
              <span className="text-3xl">{currentEvent.badge.icon}</span>
              <div>
                <p className="text-sm font-bold text-purple-400">Badge Earned!</p>
                <p className="text-sm text-st3-cream">{currentEvent.badge.name}</p>
              </div>
            </div>
          )}

          {currentEvent.type === 'challenge_completed' && (
            <div className="bg-st3-panel border border-green-400/30 rounded-xl px-6 py-3 shadow-lg shadow-green-400/10 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-sm font-bold text-green-400">Challenge Complete!</p>
                <p className="text-xs text-st3-cream">{currentEvent.title} — +{currentEvent.xp_reward} XP</p>
              </div>
            </div>
          )}

          {currentEvent.type === 'streak_updated' && !currentEvent.broken && currentEvent.current_streak > 1 && (
            <div className="bg-st3-panel border border-orange-400/30 rounded-xl px-6 py-3 shadow-lg shadow-orange-400/10 flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-sm font-bold text-orange-400">{currentEvent.current_streak} Day Streak!</p>
                {currentEvent.multiplier > 1 && (
                  <p className="text-xs text-st3-cream">{currentEvent.multiplier}x multiplier active</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
