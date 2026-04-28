import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, Clock, Tag } from 'lucide-react'
import { formatViewers, timeAgo, getInitials } from '@/lib/utils'
import type { StreamInfo } from '@/stores/streamStore'

interface Props {
  stream: StreamInfo
  index?: number
}

export default function StreamCard({ stream, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link to={`/watch/${stream.id}`} className="group block">
        <div className="card-hover overflow-hidden">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-dark-50 overflow-hidden">
            {stream.thumbnail_url ? (
              <img
                src={stream.thumbnail_url}
                alt={stream.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-900/80 to-dark-50 flex items-center justify-center">
                <span className="text-4xl font-bold gradient-text opacity-30">SW</span>
              </div>
            )}

            {/* Live badge */}
            {stream.is_live && (
              <div className="absolute top-2 left-2 live-badge">
                <span className="dot-live" />
                LIVE
              </div>
            )}

            {/* Viewer count */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-white">
              <Eye className="w-3 h-3" />
              {formatViewers(stream.viewer_count)}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/10 transition-colors duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-brand-500/90 rounded-full px-4 py-2 text-sm font-semibold text-white">
                Watch Now
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <div className="flex items-start gap-2.5">
              {/* Creator avatar */}
              <Link
                to={`/profile/${stream.creator_username}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-xs font-bold overflow-hidden">
                  {stream.creator_avatar_url ? (
                    <img src={stream.creator_avatar_url} alt={stream.creator_display_name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(stream.creator_display_name)
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-brand-400 transition-colors leading-snug">
                  {stream.title}
                </h3>
                <Link
                  to={`/profile/${stream.creator_username}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-white/60 hover:text-white transition-colors mt-0.5 block"
                >
                  {stream.creator_display_name}
                </Link>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Tag className="w-3 h-3" />
                    {stream.category}
                  </span>
                  {!stream.is_live && stream.started_at && (
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <Clock className="w-3 h-3" />
                      {timeAgo(stream.started_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
