/**
 * SwanyThree Dashboard — Revenue, XP, challenges, leaderboard, badges.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tv, Flame, Star, Award, TrendingUp, Trophy, LogOut, Radio } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useGamificationProfile, useLeaderboard, useChallenges, useMyBadges, useRevenue } from '@/hooks/queries';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: gamData } = useGamificationProfile();
  const { data: lbData } = useLeaderboard('weekly', 10);
  const { data: chData } = useChallenges();
  const { data: badgeData } = useMyBadges();
  const { data: revData } = useRevenue('month');

  const profile = gamData?.profile;
  const leaderboard = lbData?.leaderboard ?? [];
  const challenges = chData?.challenges ?? [];
  const badges = badgeData?.badges ?? [];
  const revenue = revData?.report;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-st3-dark">
      {/* Header */}
      <header className="border-b border-st3-burgundy/20 bg-st3-panel/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tv className="w-7 h-7 text-st3-gold" />
            <span className="text-xl font-bold text-st3-gold">SwanyThree</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-st3-cream/70">@{user?.username}</span>
            <button onClick={handleLogout} className="btn-ghost text-sm flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: TrendingUp, label: 'Revenue (Month)', value: `$${revenue?.total_net?.toFixed(2) ?? '0.00'}`, color: 'text-green-400' },
            { icon: Star, label: 'Level', value: `${profile?.level ?? 1} — ${profile?.level_title ?? 'Newcomer'}`, color: 'text-st3-gold' },
            { icon: Flame, label: 'Streak', value: `${profile?.current_streak ?? 0} days`, color: 'text-orange-400' },
            { icon: Award, label: 'Badges', value: `${profile?.badge_count ?? 0}`, color: 'text-purple-400' },
          ].map((card, i) => (
            <motion.div key={card.label} custom={i} initial="hidden" animate="visible" variants={cardVariants} className="card">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-st3-dark ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-st3-cream/50">{card.label}</p>
                  <p className="text-lg font-bold">{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* XP Progress Bar */}
        {profile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Level {profile.level} — {profile.level_title}</span>
              <span className="text-xs text-st3-cream/50">
                {profile.total_xp.toLocaleString()} / {profile.next_level_xp > 0 ? profile.next_level_xp.toLocaleString() : 'MAX'} XP
              </span>
            </div>
            <div className="h-3 bg-st3-dark rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(profile.progress_pct, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-st3-gold to-yellow-400 rounded-full animate-xp-pulse"
              />
            </div>
            {profile.streak_multiplier > 1 && (
              <p className="text-xs text-st3-gold mt-1">
                <Flame className="w-3 h-3 inline" /> {profile.streak_multiplier}x streak multiplier active
              </p>
            )}
          </motion.div>
        )}

        {/* Go Live Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/studio')}
          className="w-full py-4 bg-gradient-to-r from-st3-burgundy to-red-700 text-white font-bold text-lg rounded-xl
            flex items-center justify-center gap-3 hover:from-st3-burgundy-light hover:to-red-600 transition-all"
        >
          <Radio className="w-6 h-6 animate-live-dot" />
          Go Live
        </motion.button>

        {/* Two Column: Challenges + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Challenges */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-st3-gold" /> Weekly Challenges
            </h3>
            <div className="space-y-3">
              {challenges.length === 0 && <p className="text-sm text-st3-cream/40">No active challenges</p>}
              {challenges.map((ch) => (
                <div key={ch.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {ch.icon} {ch.title}
                    </span>
                    <span className={ch.completed ? 'text-green-400' : 'text-st3-cream/50'}>
                      {ch.current_progress}/{ch.target} — {ch.xp_reward} XP
                    </span>
                  </div>
                  <div className="h-2 bg-st3-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${ch.completed ? 'bg-green-400' : 'bg-st3-gold'}`}
                      style={{ width: `${Math.min(ch.progress_pct, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-st3-gold" /> Weekly Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard.map((entry) => {
                const medals = ['', 'text-yellow-400', 'text-gray-300', 'text-amber-600'];
                return (
                  <div key={entry.user_id} className="flex items-center gap-3 py-1.5">
                    <span className={`w-6 text-center font-bold text-sm ${medals[entry.rank] ?? 'text-st3-cream/40'}`}>
                      {entry.rank <= 3 ? ['', '1st', '2nd', '3rd'][entry.rank] : `#${entry.rank}`}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-st3-dark flex items-center justify-center text-xs font-bold text-st3-cream/50">
                      {entry.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.display_name || entry.username}</p>
                      <p className="text-xs text-st3-cream/40">Lv.{entry.level} {entry.level_title}</p>
                    </div>
                    <span className="text-sm font-bold text-st3-gold">{entry.xp.toLocaleString()} XP</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        {revenue && revenue.total_gross > 0 && (
          <div className="card border-st3-gold/20">
            <h3 className="text-lg font-bold mb-3">Revenue Breakdown — 90/10 Split</h3>
            <div className="flex h-6 rounded-full overflow-hidden">
              <div className="bg-green-500 flex items-center justify-center text-xs font-bold text-white" style={{ width: '87%' }}>
                87%
              </div>
              <div className="bg-red-500 flex items-center justify-center text-xs font-bold text-white" style={{ width: '10%' }}>
                10%
              </div>
              <div className="bg-orange-500 flex items-center justify-center text-xs font-bold text-white" style={{ width: '3%' }}>
                3%
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-st3-cream/60">
              <span>Creator: ${revenue.total_net?.toFixed(2)}</span>
              <span>Platform: ${revenue.total_platform_fee?.toFixed(2)}</span>
              <span>Processor: ${revenue.total_processor_fee?.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">My Badges</h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.1 }}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 badge-${badge.rarity} bg-st3-dark/50`}
                  title={`${badge.name}: ${badge.description}`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-[10px] text-st3-cream/60 truncate w-full text-center mt-1">{badge.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
