/**
 * SwanyThree Gamification Sidebar — XP, streak, challenges, badges in compact layout.
 */

import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Award } from 'lucide-react';
import type { GamificationProfile, WeeklyChallenge, Badge } from '@/types';

interface GamificationSidebarProps {
  profile: GamificationProfile | null;
  challenges?: WeeklyChallenge[];
  badges?: Badge[];
}

export default function GamificationSidebar({ profile, challenges = [], badges = [] }: GamificationSidebarProps) {
  if (!profile) {
    return <p className="text-sm text-st3-cream/40 text-center py-8">Loading gamification data...</p>;
  }

  return (
    <div className="space-y-4">
      {/* XP Progress */}
      <div>
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-st3-gold" />
            Lv.{profile.level} {profile.level_title}
          </span>
          <span className="text-st3-cream/50 text-xs">{profile.progress_pct.toFixed(0)}%</span>
        </div>
        <div className="h-2.5 bg-st3-dark rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(profile.progress_pct, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-st3-gold to-yellow-400 rounded-full animate-xp-pulse"
          />
        </div>
        <p className="text-[10px] text-st3-cream/40 mt-1">
          {profile.total_xp.toLocaleString()} / {profile.next_level_xp > 0 ? profile.next_level_xp.toLocaleString() : 'MAX'} XP
        </p>
      </div>

      {/* Streak */}
      <div className="flex items-center justify-between p-2 bg-st3-dark rounded-lg">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <div>
            <p className="text-sm font-medium">{profile.current_streak} day streak</p>
            <p className="text-[10px] text-st3-cream/40">Best: {profile.best_streak} days</p>
          </div>
        </div>
        {profile.streak_multiplier > 1 && (
          <span className="text-sm font-bold text-st3-gold">{profile.streak_multiplier}x</span>
        )}
      </div>

      {/* Weekly Challenges */}
      {challenges.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-st3-cream/50 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Trophy className="w-3 h-3" /> Challenges
          </h4>
          <div className="space-y-2">
            {challenges.map((ch) => (
              <div key={ch.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate flex-1">
                    {ch.icon} {ch.title}
                  </span>
                  <span className={`text-[10px] ml-2 ${ch.completed ? 'text-green-400' : 'text-st3-cream/40'}`}>
                    {ch.current_progress}/{ch.target}
                  </span>
                </div>
                <div className="h-1 bg-st3-dark rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ch.completed ? 'bg-green-400' : 'bg-st3-gold/70'}`}
                    style={{ width: `${Math.min(ch.progress_pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badge Grid */}
      {badges.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-st3-cream/50 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Award className="w-3 h-3" /> Badges ({profile.badge_count})
          </h4>
          <div className="grid grid-cols-4 gap-1.5">
            {badges.slice(0, 12).map((badge) => (
              <motion.div
                key={badge.id}
                whileHover={{ scale: 1.15 }}
                className={`flex items-center justify-center p-1.5 rounded border badge-${badge.rarity} bg-st3-dark/50 cursor-default`}
                title={`${badge.name}: ${badge.description}`}
              >
                <span className="text-lg">{badge.icon}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 bg-st3-dark rounded-lg">
          <p className="text-lg font-bold">{profile.total_streams}</p>
          <p className="text-[10px] text-st3-cream/40">Streams</p>
        </div>
        <div className="p-2 bg-st3-dark rounded-lg">
          <p className="text-lg font-bold">{profile.weekly_xp.toLocaleString()}</p>
          <p className="text-[10px] text-st3-cream/40">Weekly XP</p>
        </div>
      </div>
    </div>
  );
}
