import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BadgeCheck, Users, Radio, Heart, Loader2, AlertCircle,
  Calendar, Globe, Twitter,
} from 'lucide-react'
import { usersApi, streamsApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import StreamCard from '@/components/StreamCard'
import type { StreamInfo } from '@/stores/streamStore'
import type { User } from '@/stores/authStore'
import { formatNumber, formatDate, getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'streams' | 'about'>('streams')

  const { data: profile, isLoading, error } = useQuery<User>({
    queryKey: ['user', username],
    queryFn: () => usersApi.get(username!).then((r) => r.data),
    enabled: !!username,
  })

  const { data: streams } = useQuery<StreamInfo[]>({
    queryKey: ['streams', 'user', username],
    queryFn: () =>
      streamsApi.list({ search: undefined }).then((r) =>
        r.data.filter((s: StreamInfo) => s.creator_username === username),
      ),
    enabled: !!username,
  })

  const followMutation = useMutation({
    mutationFn: () =>
      profile ? usersApi.follow(profile.id) : Promise.reject(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', username] }),
  })

  const unfollowMutation = useMutation({
    mutationFn: () =>
      profile ? usersApi.unfollow(profile.id) : Promise.reject(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', username] }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">User not found</h2>
        <Link to="/" className="btn-primary mt-4">Go Home</Link>
      </div>
    )
  }

  const isOwn = currentUser?.id === profile.id

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-3xl font-black overflow-hidden flex-shrink-0 shadow-glow-purple">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              getInitials(profile.display_name)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{profile.display_name}</h1>
              {profile.is_verified && <BadgeCheck className="w-5 h-5 text-brand-400" />}
            </div>
            <p className="text-white/50 mb-3">@{profile.username}</p>

            {profile.bio && (
              <p className="text-white/70 text-sm mb-4 max-w-xl">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-6 justify-center sm:justify-start mb-4">
              {[
                { label: 'Followers', value: formatNumber(profile.follower_count) },
                { label: 'Following', value: formatNumber(profile.following_count) },
                { label: 'Streams', value: profile.stream_count },
              ].map(({ label, value }) => (
                <div key={label} className="text-center sm:text-left">
                  <p className="font-bold text-white">{value}</p>
                  <p className="text-xs text-white/50">{label}</p>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatDate(profile.created_at)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwn ? (
              <Link to="/dashboard" className="btn-secondary gap-2 text-sm">
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={() => followMutation.mutate()}
                className="btn-primary gap-2 text-sm py-2"
              >
                <Heart className="w-4 h-4" />
                Follow
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-6">
        {[
          { id: 'streams', label: 'Streams', count: streams?.length },
          { id: 'about', label: 'About' },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              tab === id
                ? 'text-brand-400 border-brand-500'
                : 'text-white/50 border-transparent hover:text-white',
            )}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'streams' && (
        <div>
          {streams && streams.length > 0 ? (
            <div className="stream-grid">
              {streams.map((stream, i) => (
                <StreamCard key={stream.id} stream={stream} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Radio className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/50">No streams yet</p>
            </div>
          )}
        </div>
      )}

      {tab === 'about' && (
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              About
            </h3>
            <p className="text-white/60 text-sm">{profile.bio ?? 'No bio yet.'}</p>
          </div>
          <div className="border-t border-white/10 pt-4 flex flex-wrap gap-4">
            <span className="flex items-center gap-2 text-sm text-white/50">
              <Globe className="w-4 h-4" />
              seewhylive.online/@{profile.username}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
