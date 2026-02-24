/**
 * SwanyThree Profile Page — User profile with badges and stream history.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users as UsersIcon, Radio, Star, Award, Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/services/api';
import { useMyBadges, useStreams } from '@/hooks/queries';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getProfile(userId!),
    enabled: !!userId,
  });

  const { data: badgeData } = useMyBadges();
  const { data: streamData } = useStreams({ user_id: userId, page: 1 });

  const user = userData?.user;
  const badges = badgeData?.badges ?? [];
  const streams = streamData?.streams ?? [];

  return (
    <div className="min-h-screen bg-st3-dark">
      <header className="border-b border-st3-burgundy/20 bg-st3-panel/50 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-st3-dark rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold">Profile</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-st3-dark flex items-center justify-center text-3xl font-bold text-st3-cream/30 shrink-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              user?.username?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.display_name ?? user?.username}</h1>
            <p className="text-st3-cream/50">@{user?.username}</p>
            {user?.bio && <p className="text-sm text-st3-cream/70 mt-2">{user.bio}</p>}
            <div className="flex items-center gap-6 mt-3 text-sm">
              <span className="flex items-center gap-1">
                <UsersIcon className="w-4 h-4 text-st3-cream/50" />
                <strong>{user?.follower_count ?? 0}</strong>
                <span className="text-st3-cream/50">followers</span>
              </span>
              <span className="flex items-center gap-1">
                <strong>{user?.following_count ?? 0}</strong>
                <span className="text-st3-cream/50">following</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-st3-gold" /> Badges ({badges.length})
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.1 }}
                  className={`flex flex-col items-center p-2 rounded-lg border-2 badge-${badge.rarity} bg-st3-dark/50`}
                  title={badge.description}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-[10px] text-st3-cream/60 truncate w-full text-center mt-1">{badge.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Stream History */}
        <div className="card">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Radio className="w-5 h-5 text-st3-burgundy" /> Stream History
          </h2>
          {streams.length === 0 ? (
            <p className="text-sm text-st3-cream/40">No streams yet</p>
          ) : (
            <div className="space-y-3">
              {streams.map((stream) => (
                <div
                  key={stream.id}
                  onClick={() => navigate(`/watch/${stream.id}`)}
                  className="flex items-center gap-3 p-3 bg-st3-dark rounded-lg hover:bg-st3-dark/80 cursor-pointer transition-colors"
                >
                  <div className="w-24 h-14 bg-st3-panel rounded-lg flex items-center justify-center shrink-0">
                    {stream.thumbnail_url ? (
                      <img src={stream.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Radio className="w-6 h-6 text-st3-cream/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{stream.title}</p>
                    <p className="text-xs text-st3-cream/50">
                      {stream.status === 'live' ? (
                        <span className="text-red-400">LIVE</span>
                      ) : (
                        new Date(stream.created_at).toLocaleDateString()
                      )}
                      {stream.total_viewers > 0 && ` — ${stream.total_viewers} viewers`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
