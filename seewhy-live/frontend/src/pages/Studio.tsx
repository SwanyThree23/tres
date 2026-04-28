import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Radio, Copy, RefreshCw, Check, Settings, Users, Eye,
  MessageSquare, HelpCircle, Zap, Plus, Trash2, Share2, Globe,
  Loader2, AlertCircle,
} from 'lucide-react'
import { streamsApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useStreamStore } from '@/stores/streamStore'
import type { StreamInfo } from '@/stores/streamStore'
import { formatViewers, CATEGORIES } from '@/lib/utils'
import { cn } from '@/lib/utils'

const RTMP_URL = 'rtmp://ingest.seewhylive.online/live'

export default function Studio() {
  const { user } = useAuthStore()
  const { viewerCount, messages, whyQuestions } = useStreamStore()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'setup' | 'live'>('setup')
  const [streamKey, setStreamKey] = useState('sk_live_••••••••••••••••')
  const [keyCopied, setKeyCopied] = useState(false)
  const [urlCopied, setUrlCopied] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Technology',
    tags: '',
  })

  const { data: activeStream } = useQuery<StreamInfo>({
    queryKey: ['studio', 'active-stream'],
    queryFn: () => streamsApi.list({ category: undefined }).then((r) =>
      r.data.find((s: StreamInfo) => s.creator_id === user?.id && s.is_live) ?? null
    ),
    refetchInterval: 10_000,
    enabled: tab === 'live',
  })

  const createStream = useMutation({
    mutationFn: () =>
      streamsApi.create({
        title: form.title,
        description: form.description,
        category: form.category,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }),
    onSuccess: async (res) => {
      const stream = res.data
      await streamsApi.goLive(stream.id)
      queryClient.invalidateQueries({ queryKey: ['studio'] })
      setTab('live')
      navigate(`/watch/${stream.id}`)
    },
  })

  const endStream = useMutation({
    mutationFn: () => streamsApi.end(activeStream!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio'] })
      setTab('setup')
    },
  })

  const copyKey = () => {
    navigator.clipboard.writeText(streamKey)
    setKeyCopied(true)
    setTimeout(() => setKeyCopied(false), 2000)
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(RTMP_URL)
    setUrlCopied(true)
    setTimeout(() => setUrlCopied(false), 2000)
  }

  const regenerateKey = () => {
    const key = 'sk_live_' + Math.random().toString(36).slice(2, 18)
    setStreamKey(key)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Creator Studio</h1>
          <p className="text-white/50 mt-1">Configure and manage your live stream</p>
        </div>
        {tab === 'live' && (
          <div className="live-badge text-base px-3 py-1.5">
            <span className="dot-live" /> You're LIVE
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tabs */}
          <div className="flex border-b border-white/10 gap-4">
            {[
              { id: 'setup', label: 'Stream Setup' },
              { id: 'live', label: 'Live Controls' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id as 'setup' | 'live')}
                className={cn(
                  'pb-3 text-sm font-medium border-b-2 transition-colors',
                  tab === id
                    ? 'text-brand-400 border-brand-500'
                    : 'text-white/50 border-transparent hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                {/* Stream details form */}
                <div className="card p-5">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-brand-400" />
                    Stream Details
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5">Title *</label>
                      <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="Why does the universe have a speed limit?"
                        className="input"
                        maxLength={150}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-1.5">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Tell viewers what your stream is about..."
                        rows={3}
                        className="input resize-none"
                        maxLength={500}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-1.5">Category</label>
                        <select
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="input"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c} className="bg-dark-200">{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-1.5">Tags (comma-separated)</label>
                        <input
                          value={form.tags}
                          onChange={(e) => setForm({ ...form, tags: e.target.value })}
                          placeholder="science, physics, beginner"
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RTMP Settings */}
                <div className="card p-5">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    Stream Connection
                  </h2>
                  <p className="text-sm text-white/50 mb-4">
                    Use these credentials in OBS, Streamlabs, or any RTMP-compatible software.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">RTMP Server URL</label>
                      <div className="flex gap-2">
                        <input readOnly value={RTMP_URL} className="input font-mono text-sm flex-1" />
                        <button onClick={copyUrl} className="btn-secondary px-3 py-2 text-sm">
                          {urlCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-white/50 mb-1.5">Stream Key</label>
                      <div className="flex gap-2">
                        <input readOnly value={streamKey} type="password" className="input font-mono text-sm flex-1" />
                        <button onClick={copyKey} className="btn-secondary px-3 py-2 text-sm">
                          {keyCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button onClick={regenerateKey} className="btn-secondary px-3 py-2 text-sm">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Never share your stream key
                      </p>
                    </div>
                  </div>
                </div>

                {/* Go Live button */}
                <button
                  onClick={() => createStream.mutate()}
                  disabled={!form.title.trim() || createStream.isPending}
                  className="btn-primary w-full py-4 text-base justify-center"
                >
                  {createStream.isPending ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Starting stream...</>
                  ) : (
                    <><Radio className="w-5 h-5" /> Go Live</>
                  )}
                </button>
              </motion.div>
            )}

            {tab === 'live' && (
              <motion.div
                key="live"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                {/* Live stats */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { icon: Eye, label: 'Viewers', value: formatViewers(viewerCount) },
                    { icon: MessageSquare, label: 'Chat messages', value: messages.length },
                    { icon: HelpCircle, label: 'Why questions', value: whyQuestions.length },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="card p-4 text-center">
                      <Icon className="w-5 h-5 text-brand-400 mx-auto mb-2" />
                      <p className="text-2xl font-black text-white">{value}</p>
                      <p className="text-xs text-white/50">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Top why questions */}
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    Top "Why" Questions
                  </h3>
                  {whyQuestions.length === 0 ? (
                    <p className="text-sm text-white/40 text-center py-4">No questions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {whyQuestions.slice(0, 5).map((q) => (
                        <div key={q.id} className="flex items-start gap-3 p-2.5 bg-white/5 rounded-lg">
                          <span className="text-xs font-mono text-brand-400 mt-0.5 w-8 text-right flex-shrink-0">
                            ↑{q.upvotes}
                          </span>
                          <p className="text-sm text-white">{q.question}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stream actions */}
                <div className="flex gap-3">
                  {activeStream && (
                    <a
                      href={`/watch/${activeStream.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary flex-1 justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      View Stream Page
                    </a>
                  )}
                  <button
                    onClick={() => endStream.mutate()}
                    disabled={endStream.isPending || !activeStream}
                    className="flex items-center gap-2 justify-center flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-semibold rounded-xl transition-colors disabled:opacity-40"
                  >
                    {endStream.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    End Stream
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Creator tip */}
          <div className="card p-4 border-brand-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-brand-400" />
              <span className="text-sm font-semibold text-white">Creator Tips</span>
            </div>
            <ul className="space-y-2">
              {[
                'Start with a clear "why" question to hook viewers',
                'Invite guests to get different perspectives',
                'Use the Why Board to drive the conversation',
                'Interact with AI co-host for instant answers',
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-white/60">
                  <Plus className="w-3 h-3 text-brand-400 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick stats */}
          {user && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Your Stats
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Total Streams', value: user.stream_count },
                  { label: 'Followers', value: user.follower_count },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-white/50">{label}</span>
                    <span className="text-white font-semibold">{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
