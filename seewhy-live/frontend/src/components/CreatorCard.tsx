import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Radio, BadgeCheck } from 'lucide-react'
import { formatNumber, getInitials } from '@/lib/utils'
import type { User } from '@/stores/authStore'
import { cn } from '@/lib/utils'

interface Props {
  creator: User & { is_live?: boolean; viewer_count?: number; stream_title?: string }
  index?: number
}

export default function CreatorCard({ creator, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/profile/${creator.username}`} className="group block">
        <div className="card-hover p-4 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-3">
            <div className={cn(
              'w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-xl font-bold overflow-hidden',
              creator.is_live && 'ring-2 ring-red-500 ring-offset-2 ring-offset-dark-50',
            )}>
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
              ) : (
                getInitials(creator.display_name)
              )}
            </div>
            {creator.is_live && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 live-badge text-xs px-1.5 py-0.5">
                <span className="dot-live" /> LIVE
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-semibold text-white group-hover:text-brand-400 transition-colors">
              {creator.display_name}
            </span>
            {creator.is_verified && <BadgeCheck className="w-4 h-4 text-brand-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-white/50 mb-3">@{creator.username}</p>

          {creator.is_live && creator.stream_title && (
            <p className="text-xs text-cyan-400 mb-3 line-clamp-1 px-2">{creator.stream_title}</p>
          )}

          {/* Stats */}
          <div className="flex gap-4 text-xs text-white/50">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {formatNumber(creator.follower_count)}
            </span>
            {creator.is_live ? (
              <span className="flex items-center gap-1 text-red-400">
                <Radio className="w-3 h-3" />
                {formatNumber(creator.viewer_count ?? 0)} watching
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3" />
                {creator.stream_count} streams
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
