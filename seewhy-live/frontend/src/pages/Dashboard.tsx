import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart3, TrendingUp, Users, Radio, DollarSign,
  HelpCircle, Eye, Clock, Plus, ChevronRight, Zap,
  Star, Award,
} from 'lucide-react'
import { streamsApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import StreamCard from '@/components/StreamCard'
import type { StreamInfo } from '@/stores/streamStore'
import { formatNumber, formatViewers, timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'streams' | 'earnings'>('overview')

  const { data: myStreams } = useQuery<StreamInfo[]>({
    queryKey: ['streams', 'mine'],
    queryFn: () => streamsApi.myStreams().then((r) => r.data),
    staleTime: 60_000,
  })

  // Mock analytics data (would come from API)
  const analytics = {
    totalViews: 48_230,
    totalRevenue: 2_847.50,
    totalFollowers: user?.follower_count ?? 0,
    totalStreams: user?.stream_count ?? 0,
    viewsChange: +12.4,
    revenueChange: +8.7,
    followersChange: +234,
    avgViewers: 892,
    totalQuestions: 14_382,
    aiAnswers: 8_910,
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    change,
    color,
  }: {
    icon: typeof BarChart3
    label: string
    value: string
    change?: number
    color: string
  }) => (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change !== undefined && (
          <span className={cn(
            'text-xs font-semibold flex items-center gap-0.5',
            change >= 0 ? 'text-emerald-400' : 'text-red-400',
          )}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-sm text-white/50 mt-0.5">{label}</p>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.display_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-white/50 mt-1">Here's what's happening with your channel</p>
        </div>
        <Link to="/studio" className="btn-primary gap-2">
          <Radio className="w-4 h-4" />
          Go Live
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 mb-8">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'streams', label: 'My Streams' },
          { id: 'earnings', label: 'Earnings' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === id
                ? 'text-brand-400 border-brand-500'
                : 'text-white/50 border-transparent hover:text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Eye} label="Total Views" value={formatViewers(analytics.totalViews)} change={analytics.viewsChange} color="from-brand-500 to-brand-700" />
            <StatCard icon={DollarSign} label="Total Revenue" value={`$${analytics.totalRevenue.toFixed(2)}`} change={analytics.revenueChange} color="from-emerald-500 to-emerald-700" />
            <StatCard icon={Users} label="Followers" value={formatNumber(analytics.totalFollowers)} change={analytics.followersChange > 0 ? 5.2 : 0} color="from-cyan-500 to-cyan-700" />
            <StatCard icon={Radio} label="Streams" value={analytics.totalStreams.toString()} color="from-orange-500 to-orange-700" />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{formatViewers(analytics.avgViewers)}</p>
                <p className="text-xs text-white/50">Avg. viewers per stream</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{formatNumber(analytics.totalQuestions)}</p>
                <p className="text-xs text-white/50">Why questions asked</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{formatNumber(analytics.aiAnswers)}</p>
                <p className="text-xs text-white/50">AI answers delivered</p>
              </div>
            </div>
          </div>

          {/* Recent streams */}
          {myStreams && myStreams.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent Streams</h2>
                <button
                  onClick={() => setActiveTab('streams')}
                  className="flex items-center gap-1 text-brand-400 text-sm"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myStreams.slice(0, 3).map((stream, i) => (
                  <StreamCard key={stream.id} stream={stream} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4">Recent Achievements</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Star, label: 'First Stream', color: 'from-yellow-500 to-orange-500', earned: true },
                { icon: Users, label: '100 Followers', color: 'from-cyan-500 to-blue-500', earned: true },
                { icon: Award, label: 'Top Educator', color: 'from-brand-500 to-pink-500', earned: false },
                { icon: Clock, label: '10hr Streamed', color: 'from-emerald-500 to-teal-500', earned: false },
              ].map(({ icon: Icon, label, color, earned }) => (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.03 }}
                  className={cn('card p-4 text-center', !earned && 'opacity-40')}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-xs font-medium text-white">{label}</p>
                  {!earned && <p className="text-xs text-white/30 mt-0.5">Locked</p>}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'streams' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Your Streams</h2>
            <Link to="/studio" className="btn-primary gap-2 text-sm py-2">
              <Plus className="w-4 h-4" /> New Stream
            </Link>
          </div>
          {myStreams && myStreams.length > 0 ? (
            <div className="stream-grid">
              {myStreams.map((stream, i) => (
                <StreamCard key={stream.id} stream={stream} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Radio className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No streams yet</h3>
              <p className="text-white/50 mb-6">Start your first live stream and share your knowledge</p>
              <Link to="/studio" className="btn-primary">Go Live Now</Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={DollarSign} label="Total Earned" value={`$${analytics.totalRevenue.toFixed(2)}`} change={analytics.revenueChange} color="from-emerald-500 to-emerald-700" />
            <StatCard icon={TrendingUp} label="This Month" value="$384.20" color="from-brand-500 to-brand-700" />
            <StatCard icon={Zap} label="Pending Payout" value="$127.50" color="from-cyan-500 to-cyan-700" />
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Revenue Breakdown</h3>
            <p className="text-sm text-white/50 mb-4">You keep 90% of all earnings.</p>
            <div className="space-y-3">
              {[
                { label: 'Tips & Donations', amount: 1_240, pct: 44 },
                { label: 'Subscriptions', amount: 980, pct: 34 },
                { label: 'Super Why (pinned questions)', amount: 627, pct: 22 },
              ].map(({ label, amount, pct }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">{label}</span>
                    <span className="text-white font-semibold">${amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payout History</h3>
            <div className="space-y-2">
              {[
                { date: '2026-04-01', amount: 312.40, status: 'Paid' },
                { date: '2026-03-01', amount: 487.20, status: 'Paid' },
                { date: '2026-02-01', amount: 218.90, status: 'Paid' },
              ].map(({ date, amount, status }) => (
                <div key={date} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white">{new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-xs text-white/50">Monthly payout</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${amount.toFixed(2)}</p>
                    <span className="text-xs text-emerald-400">{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
