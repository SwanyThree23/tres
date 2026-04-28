import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Heart, Share2, BadgeCheck, Users, Eye, ChevronRight,
  AlertCircle, Loader2, ArrowLeft,
} from 'lucide-react'
import { streamsApi, usersApi } from '@/lib/api'
import VideoPlayer from '@/components/VideoPlayer'
import ChatPanel from '@/components/ChatPanel'
import StreamCard from '@/components/StreamCard'
import { useStreamStore } from '@/stores/streamStore'
import { useAuthStore } from '@/stores/authStore'
import type { StreamInfo } from '@/stores/streamStore'
import { formatViewers, timeAgo, getInitials } from '@/lib/utils'

export default function Watch() {
  const { streamId } = useParams<{ streamId: string }>()
  const { user, accessToken } = useAuthStore()
  const { connect, disconnect, setCurrentStream, viewerCount } = useStreamStore()
  const [following, setFollowing] = useState(false)
  const [playerError, setPlayerError] = useState(false)

  const { data: stream, isLoading, error } = useQuery<StreamInfo>({
    queryKey: ['stream', streamId],
    queryFn: () => streamsApi.get(streamId!).then((r) => r.data),
    enabled: !!streamId,
    refetchInterval: 30_000,
  })

  const { data: related } = useQuery<StreamInfo[]>({
    queryKey: ['streams', 'related', stream?.category],
    queryFn: () => streamsApi.list({ category: stream?.category }).then((r) => r.data),
    enabled: !!stream?.category,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (stream && streamId) {
      setCurrentStream(stream)
      connect(streamId, accessToken ?? undefined)
    }
    return () => { disconnect() }
  }, [stream, streamId, accessToken, connect, disconnect, setCurrentStream])

  const handleFollow = async () => {
    if (!stream) return
    try {
      if (following) {
        await usersApi.unfollow(stream.creator_id)
        setFollowing(false)
      } else {
        await usersApi.follow(stream.creator_id)
        setFollowing(true)
      }
    } catch {}
  }

  const handleShare = () => {
    navigator.share?.({
      title: stream?.title,
      url: window.location.href,
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    )
  }

  if (error || !stream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Stream not found</h2>
        <p className="text-white/50 mb-6">This stream may have ended or doesn't exist.</p>
        <Link to="/browse" className="btn-primary">Browse Streams</Link>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Back */}
      <Link to="/browse" className="flex items-center gap-1 text-white/50 hover:text-white text-sm mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Browse
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4">
          {/* Video */}
          {playerError ? (
            <div className="aspect-video card flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-white font-semibold mb-1">Stream unavailable</p>
              <p className="text-white/50 text-sm">The stream may have ended or the connection was lost.</p>
            </div>
          ) : stream.hls_url ? (
            <VideoPlayer
              src={stream.hls_url}
              title={stream.title}
              isLive={stream.is_live}
              onError={() => setPlayerError(true)}
            />
          ) : (
            <div className="aspect-video card flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-brand-400" />
              </div>
              <p className="text-white font-semibold">Stream is starting soon...</p>
              <p className="text-white/50 text-sm mt-1">The creator hasn't gone live yet.</p>
            </div>
          )}

          {/* Stream info */}
          <div>
            <div className="flex flex-wrap items-start gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {stream.is_live && (
                    <div className="live-badge">
                      <span className="dot-live" /> LIVE
                    </div>
                  )}
                  <span className="why-badge">{stream.category}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">{stream.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="btn-ghost gap-2 text-sm"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            </div>

            {/* Creator info */}
            <div className="flex items-center justify-between flex-wrap gap-4 py-4 border-y border-white/10">
              <Link to={`/profile/${stream.creator_username}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center font-bold overflow-hidden">
                  {stream.creator_avatar_url ? (
                    <img src={stream.creator_avatar_url} alt={stream.creator_display_name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(stream.creator_display_name)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                      {stream.creator_display_name}
                    </span>
                    <BadgeCheck className="w-4 h-4 text-brand-400" />
                  </div>
                  <p className="text-xs text-white/50">@{stream.creator_username}</p>
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-sm text-white/50">
                  <Eye className="w-4 h-4" />
                  {formatViewers(viewerCount || stream.viewer_count)} watching
                </div>
                {user?.id !== stream.creator_id && (
                  <button
                    onClick={handleFollow}
                    className={following ? 'btn-secondary gap-2 text-sm py-2' : 'btn-primary gap-2 text-sm py-2'}
                  >
                    <Heart className={`w-4 h-4 ${following ? 'fill-current' : ''}`} />
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            {stream.description && (
              <p className="mt-4 text-white/60 text-sm leading-relaxed">{stream.description}</p>
            )}

            {stream.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {stream.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white/50">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Related streams */}
          {related && related.filter((s) => s.id !== stream.id).length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">More in {stream.category}</h2>
                <Link
                  to={`/browse?category=${encodeURIComponent(stream.category)}`}
                  className="flex items-center gap-1 text-brand-400 text-sm"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {related.filter((s) => s.id !== stream.id).slice(0, 3).map((s, i) => (
                  <StreamCard key={s.id} stream={s} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        <div className="lg:col-span-1 h-[600px] lg:h-auto lg:sticky lg:top-20">
          {streamId && <ChatPanel streamId={streamId} />}
        </div>
      </div>
    </div>
  )
}
