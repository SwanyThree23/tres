import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Radio, X } from 'lucide-react'
import { streamsApi } from '@/lib/api'
import StreamCard from '@/components/StreamCard'
import type { StreamInfo } from '@/stores/streamStore'
import { CATEGORIES, cn } from '@/lib/utils'

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [liveOnly, setLiveOnly] = useState(searchParams.get('live_only') === 'true')
  const [showFilters, setShowFilters] = useState(false)

  const queryParams = {
    search: search || undefined,
    category: category || undefined,
    live_only: liveOnly || undefined,
  }

  const { data: streams, isLoading } = useQuery<StreamInfo[]>({
    queryKey: ['streams', queryParams],
    queryFn: () => streamsApi.list(queryParams).then((r) => r.data),
    staleTime: 30_000,
  })

  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (category) params.category = category
    if (liveOnly) params.live_only = 'true'
    setSearchParams(params, { replace: true })
  }, [search, category, liveOnly, setSearchParams])

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setLiveOnly(false)
  }

  const hasFilters = search || category || liveOnly

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Browse Streams</h1>
        <p className="text-white/50">Discover live and recent educational streams</p>
      </div>

      {/* Search & filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search streams, topics, creators..."
            className="input pl-11"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setLiveOnly(!liveOnly)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all',
              liveOnly
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40',
            )}
          >
            <Radio className="w-4 h-4" />
            Live Only
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all',
              showFilters
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40',
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="mb-6"
        >
          <p className="text-sm text-white/50 mb-3">Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory('')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                !category ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10',
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? '' : cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  category === cat ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-6">
          {search && (
            <span className="why-badge">
              Search: "{search}"
              <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {category && (
            <span className="why-badge">
              {category}
              <button onClick={() => setCategory('')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {liveOnly && (
            <span className="live-badge">
              LIVE only
              <button onClick={() => setLiveOnly(false)}><X className="w-3 h-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="stream-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-video bg-white/5" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : streams && streams.length > 0 ? (
        <>
          <p className="text-sm text-white/50 mb-4">{streams.length} streams found</p>
          <div className="stream-grid">
            {streams.map((stream, i) => (
              <StreamCard key={stream.id} stream={stream} index={i} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No streams found</h3>
          <p className="text-white/50 mb-6">
            {hasFilters ? 'Try adjusting your filters' : 'No streams are available right now'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
