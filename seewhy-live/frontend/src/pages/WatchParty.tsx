import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Users, Copy, Check, Crown, Radio, Settings,
  Loader2, AlertCircle, ArrowLeft, UserPlus, Signal,
} from 'lucide-react'
import { streamsApi } from '@/lib/api'
import VideoPlayer from '@/components/VideoPlayer'
import ChatPanel from '@/components/ChatPanel'
import CollapsePanel from '@/components/CollapsePanel'
import { useStreamStore } from '@/stores/streamStore'
import { useAuthStore } from '@/stores/authStore'
import type { StreamInfo } from '@/stores/streamStore'
import { formatViewers, getInitials, cn } from '@/lib/utils'

const MAX_GUESTS = 20

// Simulated party members — in production these come from Socket.IO presence
const PARTY_COLORS = [
  '#7c3aed', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface PartyMember {
  id: string
  name: string
  color: string
  role: 'host' | 'guest'
  status: 'watching' | 'buffering' | 'away'
}

interface SfuStats {
  activeSpeakers: number
  packetsLost: number
  jitter: number
  bitrate: number
  latency: number
}

export default function WatchParty() {
  const { streamId, partyId } = useParams<{ streamId: string; partyId?: string }>()
  const { user, accessToken } = useAuthStore()
  const { connect, disconnect, setCurrentStream, viewerCount } = useStreamStore()
  const navigate = useNavigate()

  const [inviteCopied, setInviteCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isHost] = useState(true) // In production, derived from party membership
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([
    { id: '1', name: user?.display_name ?? 'You', color: PARTY_COLORS[0], role: 'host', status: 'watching' },
  ])
  const [sfuStats, setSfuStats] = useState<SfuStats>({
    activeSpeakers: 0,
    packetsLost: 0,
    jitter: 12,
    bitrate: 4200,
    latency: 34,
  })
  const [syncOffset, setSyncOffset] = useState(0)

  const { data: stream, isLoading, error } = useQuery<StreamInfo>({
    queryKey: ['stream', streamId],
    queryFn: () => streamsApi.get(streamId!).then((r) => r.data),
    enabled: !!streamId,
    refetchInterval: 30_000,
  })

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Socket connect
  useEffect(() => {
    if (stream && streamId) {
      setCurrentStream(stream)
      connect(streamId, accessToken ?? undefined)
    }
    return () => { disconnect() }
  }, [stream, streamId, accessToken, connect, disconnect, setCurrentStream])

  // Simulated SFU stats refresh
  useEffect(() => {
    const id = setInterval(() => {
      setSfuStats((s) => ({
        activeSpeakers: Math.floor(Math.random() * 3),
        packetsLost: s.packetsLost + Math.floor(Math.random() * 3),
        jitter: Math.max(0, s.jitter + (Math.random() - 0.5) * 4),
        bitrate: Math.max(1000, s.bitrate + (Math.random() - 0.5) * 400),
        latency: Math.max(10, s.latency + (Math.random() - 0.5) * 8),
      }))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const copyInvite = () => {
    const url = `${window.location.origin}/watch-party/${streamId}/${partyId ?? 'new'}`
    navigator.clipboard.writeText(url)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const activeGuests = partyMembers.filter((m) => m.status !== 'away')

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
        <Link to="/browse" className="btn-primary mt-4">Browse Streams</Link>
      </div>
    )
  }

  const SidePanel = (
    <div className={cn('flex flex-col gap-3', isMobile ? '' : 'h-full overflow-y-auto scrollbar-hide')}>

      {/* Party header */}
      <div className="card p-3 border-brand-500/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-white">Watch Party</span>
          </div>
          <span className="text-[10px] text-white/40 font-mono">{activeGuests.length}/{MAX_GUESTS} slots</span>
        </div>
        {/* Slot bar */}
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: MAX_GUESTS }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 h-1.5 rounded-sm transition-colors',
                i < activeGuests.length ? 'bg-brand-500' : 'bg-white/10',
              )}
            />
          ))}
        </div>
        <button onClick={copyInvite} className="btn-secondary w-full py-2 text-xs justify-center gap-1.5">
          {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <UserPlus className="w-3.5 h-3.5" />}
          {inviteCopied ? 'Link copied!' : 'Invite friends'}
        </button>
      </div>

      {/* Party Members */}
      <CollapsePanel title="Party Members" badge={partyMembers.length}>
        <div className="space-y-1.5">
          {partyMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 py-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: m.color + '33', border: `2px solid ${m.color}`, color: m.color }}
              >
                {m.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold truncate" style={{ color: m.color }}>{m.name}</span>
                  {m.role === 'host' && <Crown className="w-3 h-3 text-brand-400 flex-shrink-0" />}
                </div>
                <span className="text-[10px] text-white/40">{m.role}</span>
              </div>
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full border',
                  m.status === 'watching'
                    ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
                    : m.status === 'buffering'
                    ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
                    : 'text-white/30 bg-white/5 border-white/10',
                )}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>
      </CollapsePanel>

      {/* Universal Chat */}
      <CollapsePanel title="Universal Chat" defaultOpen={true}>
        {streamId && (
          <div className={isMobile ? 'h-64' : 'h-80'}>
            <ChatPanel streamId={streamId} />
          </div>
        )}
      </CollapsePanel>

      {/* Stage Manager (host only) */}
      {isHost && (
        <CollapsePanel title="Stage Manager">
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 mb-2">Manage who can speak and stream</p>
            {partyMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: m.color + '33', border: `1px solid ${m.color}`, color: m.color }}
                >
                  {m.name[0].toUpperCase()}
                </div>
                <span className="text-xs text-white/70 flex-1 truncate">{m.name}</span>
                <div className="flex gap-1">
                  <button className="p-1 rounded bg-white/5 hover:bg-brand-500/20 transition-colors">
                    <Volume2 className="w-3 h-3 text-white/50" />
                  </button>
                  <button className="p-1 rounded bg-white/5 hover:bg-brand-500/20 transition-colors">
                    <Radio className="w-3 h-3 text-white/50" />
                  </button>
                </div>
              </div>
            ))}
            <button className="btn-secondary w-full py-1.5 text-xs justify-center gap-1 mt-2">
              <UserPlus className="w-3 h-3" /> Invite Guest
            </button>
          </div>
        </CollapsePanel>
      )}

      {/* SFU Stats */}
      <CollapsePanel title="SFU Stats" defaultOpen={false}>
        <div className="space-y-2">
          {[
            { label: 'Active Speakers', value: sfuStats.activeSpeakers, suffix: '' },
            { label: 'Bitrate', value: Math.round(sfuStats.bitrate), suffix: ' kbps', color: sfuStats.bitrate > 3000 ? '#10b981' : '#f59e0b' },
            { label: 'Latency', value: Math.round(sfuStats.latency), suffix: ' ms', color: sfuStats.latency < 50 ? '#10b981' : '#ef4444' },
            { label: 'Jitter', value: sfuStats.jitter.toFixed(1), suffix: ' ms' },
            { label: 'Packets Lost', value: sfuStats.packetsLost, suffix: '' },
            { label: 'Total Slots', value: `${activeGuests.length}/${MAX_GUESTS}`, suffix: '', color: '#7c3aed' },
          ].map(({ label, value, suffix, color }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-[10px] text-white/40 font-mono">{label}</span>
              <span className="text-[10px] font-bold font-mono" style={{ color: color ?? '#e2e8f0' }}>
                {value}{suffix}
              </span>
            </div>
          ))}
          <div className="pt-1 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-semibold">Connection healthy</span>
            </div>
          </div>
        </div>
      </CollapsePanel>

      {/* Sync controls (host only) */}
      {isHost && (
        <CollapsePanel title="Sync Controls" defaultOpen={false}>
          <div className="space-y-3">
            <p className="text-[10px] text-white/40">Sync all party members to your playback position.</p>
            <div className="flex gap-2 justify-center">
              <button className="btn-secondary px-3 py-1.5 text-xs gap-1">
                <SkipBack className="w-3.5 h-3.5" /> -5s
              </button>
              <button className="btn-primary px-3 py-1.5 text-xs gap-1">
                <Play className="w-3.5 h-3.5" /> Sync All
              </button>
              <button className="btn-secondary px-3 py-1.5 text-xs gap-1">
                +5s <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-white/40 mb-1">
                <span>Sync offset</span>
                <span className="font-mono">{syncOffset > 0 ? '+' : ''}{syncOffset}s</span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={syncOffset}
                onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
                className="w-full accent-brand-500"
              />
            </div>
          </div>
        </CollapsePanel>
      )}
    </div>
  )

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Back */}
      <div className="flex items-center justify-between mb-4">
        <Link to={`/watch/${streamId}`} className="flex items-center gap-1 text-white/50 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Stream
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-white/50">
            <Users className="w-3.5 h-3.5" />
            {formatViewers(viewerCount || stream.viewer_count)} total viewers
          </div>
          {stream.is_live && (
            <div className="live-badge">
              <span className="dot-live" /> LIVE
            </div>
          )}
        </div>
      </div>

      {isMobile ? (
        // ── Mobile: stacked layout ─────────────────────────────────────────
        <div className="space-y-4">
          <VideoPlayer src={stream.hls_url ?? ''} title={stream.title} isLive={stream.is_live} />
          <div>
            <h1 className="text-lg font-bold text-white mb-1 line-clamp-2">{stream.title}</h1>
            <p className="text-sm text-white/50">{stream.creator_display_name}</p>
          </div>
          {SidePanel}
        </div>
      ) : (
        // ── Desktop: side-by-side ──────────────────────────────────────────
        <div className="grid grid-cols-3 xl:grid-cols-4 gap-5 items-start">
          {/* Video + info */}
          <div className="col-span-2 xl:col-span-3 space-y-4">
            <VideoPlayer src={stream.hls_url ?? ''} title={stream.title} isLive={stream.is_live} />
            <div className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-white mb-1">{stream.title}</h1>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <span>{stream.creator_display_name}</span>
                    <span>·</span>
                    <span className="why-badge">{stream.category}</span>
                  </div>
                </div>
                <button onClick={copyInvite} className="btn-secondary gap-2 text-sm py-2 flex-shrink-0">
                  {inviteCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {inviteCopied ? 'Copied!' : 'Copy invite'}
                </button>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="col-span-1 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide space-y-3">
            {SidePanel}
          </div>
        </div>
      )}
    </div>
  )
}
