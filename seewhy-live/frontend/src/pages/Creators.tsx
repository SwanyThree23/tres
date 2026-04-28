import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, BadgeCheck, Users, Radio, X } from 'lucide-react'
import { usersApi } from '@/lib/api'
import CreatorCard from '@/components/CreatorCard'
import type { User } from '@/stores/authStore'
import { CATEGORIES, cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'followers', label: 'Most Followed' },
  { value: 'streams', label: 'Most Streams' },
  { value: 'live', label: 'Live Now' },
] as const

type SortOption = (typeof SORT_OPTIONS)[number]['value']

export default function Creators() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState<SortOption>('followers')
  const [showFilters, setShowFilters] = useState(false)

  const { data: creators, isLoading } = useQuery<User[]>({
    queryKey: ['creators', 'top'],
    queryFn: () => usersApi.get('top').then((r) => r.data),
    staleTime: 60_000,
  })

  const filtered = (creators ?? []).filter((c) => {
    if (search && !c.display_name.toLowerCase().includes(search.toLowerCase()) &&
      !c.username.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (sort === 'followers') return b.follower_count - a.follower_count
    if (sort === 'streams') return b.stream_count - a.stream_count
    return 0
  })

  const stats = {
    total: creators?.length ?? 0,
    live: 0,
    verified: creators?.filter((c) => c.is_verified).length ?? 0,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Discover Creators</h1>
        <p className="text-white/50">Follow brilliant minds explaining why the world works</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: Users, label: 'Total Creators', value: stats.total },
          { icon: Radio, label: 'Live Now', value: stats.live, accent: true },
          { icon: BadgeCheck, label: 'Verified', value: stats.verified },
        ].map(({ icon: Icon, label, value, accent }) => (
          <div key={label} className={cn('card p-4 text-center', accent && 'border-red-500/30')}>
            <Icon className={cn('w-5 h-5 mx-auto mb-2', accent ? 'text-red-400' : 'text-brand-400')} />
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-white/50">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creators..."
            className="input pl-11"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="input w-auto px-4 py-2.5 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-dark-200">{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
              showFilters
                ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                : 'bg-white/5 border-white/20 text-white/70 hover:border-white/40',
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filter
          </button>

          {(search || category) && (
            <button
              onClick={() => { setSearch(''); setCategory('') }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm"
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
          className="mb-5 overflow-hidden"
        >
          <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Category</p>
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

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-white/40 mb-5">{filtered.length} creator{filtered.length !== 1 ? 's' : ''}</p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/5" />
              <div className="h-3 bg-white/5 rounded w-3/4" />
              <div className="h-2 bg-white/5 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((creator, i) => (
            <CreatorCard key={creator.id} creator={creator} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No creators found</h3>
          <p className="text-white/50 mb-4">Try adjusting your search or filters</p>
          <button onClick={() => { setSearch(''); setCategory('') }} className="btn-secondary">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
