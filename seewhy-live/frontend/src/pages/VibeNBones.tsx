import { useState } from 'react'
import { motion } from 'framer-motion'
import { Headphones, Mic2, Play, Music2, Users, Star, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLES = [
  { id: 'host', label: 'Host', icon: Mic2, color: '#D4AF37', desc: 'Run the session and keep the energy up' },
  { id: 'analyst', label: 'Analyst', icon: Star, color: '#06b6d4', desc: 'Break down plays, strategy, and scores' },
  { id: 'player', label: 'Player', icon: Users, color: '#800020', desc: 'Active competitor on the tables' },
  { id: 'vibe', label: 'Vibe Curator', icon: Music2, color: '#7c3aed', desc: 'Sets the music and cultural tone' },
  { id: 'producer', label: 'Producer', icon: Headphones, color: '#10b981', desc: 'Behind the scenes stream tech' },
]

const EPISODES = [
  {
    id: 1,
    title: 'The CaliBones Origin Story',
    guest: 'CaliBones',
    duration: '1h 12m',
    desc: 'How a Long Beach street player became the face of West Coast domino culture.',
    tags: ['Origins', 'Culture', 'West Coast'],
    plays: '12.4K',
  },
  {
    id: 2,
    title: 'Washington Classic Preview — Who Wins?',
    guest: 'SwanyThree23 + Panel',
    duration: '58m',
    desc: 'The crew breaks down every quarterfinal matchup for the 2026 Classic.',
    tags: ['Tournament', 'Preview', 'Analysis'],
    plays: '8.9K',
  },
  {
    id: 3,
    title: 'The 7-Rock Masterclass',
    guest: 'Domino Dan',
    duration: '1h 34m',
    desc: 'Advanced 7-Rock strategy from one of the sharpest analytical minds in the game.',
    tags: ['Education', 'Strategy', '7-Rock'],
    plays: '21.2K',
  },
  {
    id: 4,
    title: 'Culture Over Competition',
    guest: 'VibeKing & LongBeach7',
    duration: '45m',
    desc: 'Why domino culture is bigger than any single tournament — the community comes first.',
    tags: ['Culture', 'Community'],
    plays: '6.7K',
  },
  {
    id: 5,
    title: 'SeeWhy LIVE: The Creator Economy',
    guest: 'SwanyThree23',
    duration: '52m',
    desc: 'Breaking down how SeeWhy LIVE pays creators 90% and what that means for the community.',
    tags: ['Creator Economy', 'Tech', 'Platform'],
    plays: '15.8K',
  },
]

const CREW = [
  { name: 'CaliBones', role: 'Co-Founder & Player', status: 'live', color: '#800020' },
  { name: 'SwanyThree23', role: 'Host & Promoter', status: 'live', color: '#D4AF37' },
  { name: 'VibeKing', role: 'Vibe Curator', status: 'offline', color: '#7c3aed' },
  { name: 'Domino Dan', role: 'Analyst', status: 'away', color: '#06b6d4' },
  { name: 'LongBeach7', role: 'Street Player', status: 'offline', color: '#10b981' },
]

export default function VibeNBones() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)

  return (
    <div className="min-h-screen" style={{ background: '#04040a' }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-4 pt-10 pb-8"
        style={{ background: 'linear-gradient(160deg, #04040a, #14142b)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-8 blur-3xl"
            style={{ background: '#800020' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-8 blur-3xl"
            style={{ background: '#D4AF37' }} />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #800020)' }}>
              <Headphones size={16} className="text-white" />
            </div>
            <span className="font-display text-xl tracking-widest text-white">VIBE N BONES</span>
          </div>
          <p className="text-white/50 text-sm max-w-md">
            The pulse of domino culture. Podcast, commentary, community — all in one place.
          </p>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto space-y-8">
        {/* Role selector */}
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Users size={16} className="text-gold" />
            Your Role
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ROLES.map(role => {
              const Icon = role.icon
              const active = selectedRole === role.id
              return (
                <motion.button
                  key={role.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRole(active ? null : role.id)}
                  className="rounded-xl p-3 text-left border transition-all"
                  style={{
                    background: active ? `${role.color}15` : '#0a0a14',
                    borderColor: active ? `${role.color}50` : 'rgba(255,255,255,0.06)',
                    boxShadow: active ? `0 0 12px ${role.color}30` : 'none',
                  }}
                >
                  <Icon size={18} style={{ color: active ? role.color : 'rgba(255,255,255,0.4)' }} className="mb-1.5" />
                  <div className="text-sm font-semibold" style={{ color: active ? role.color : 'rgba(255,255,255,0.8)' }}>
                    {role.label}
                  </div>
                  <div className="text-[11px] text-white/30 mt-0.5 leading-snug">{role.desc}</div>
                </motion.button>
              )
            })}
          </div>
          {selectedRole && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gold/70 text-xs mt-2 px-1"
            >
              ✓ You're vibing as <strong>{ROLES.find(r => r.id === selectedRole)?.label}</strong>
            </motion.p>
          )}
        </div>

        {/* Crew */}
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Users size={16} className="text-gold" />
            The Crew
          </h2>
          <div className="space-y-2">
            {CREW.map(member => (
              <div key={member.name}
                className="flex items-center justify-between rounded-xl px-4 py-3 border border-white/5"
                style={{ background: '#0a0a14' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${member.color}20`, color: member.color, border: `1px solid ${member.color}30` }}>
                    {member.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{member.name}</p>
                    <p className="text-xs text-white/40">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <div className={cn('w-2 h-2 rounded-full',
                    member.status === 'live' ? 'bg-red-500 animate-pulse' :
                    member.status === 'away' ? 'bg-yellow-500' : 'bg-white/20'
                  )} />
                  <span className={cn(
                    member.status === 'live' ? 'text-red-400' :
                    member.status === 'away' ? 'text-yellow-400' : 'text-white/30'
                  )}>
                    {member.status === 'live' ? 'LIVE' : member.status === 'away' ? 'AWAY' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Episodes */}
        <div>
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Headphones size={16} className="text-gold" />
            Podcast Episodes
          </h2>
          <div className="space-y-3">
            {EPISODES.map(ep => (
              <motion.div
                key={ep.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 border border-white/5"
                style={{ background: '#0a0a14' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gold/60">EP {ep.id}</span>
                      <span className="text-[10px] text-white/30">·</span>
                      <span className="text-[10px] text-white/30 flex items-center gap-1">
                        <Clock size={10} /> {ep.duration}
                      </span>
                      <span className="text-[10px] text-white/30">·</span>
                      <span className="text-[10px] text-white/30 flex items-center gap-1">
                        <Play size={10} /> {ep.plays}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-0.5">{ep.title}</h3>
                    <p className="text-xs text-white/40 mb-2 leading-relaxed">{ep.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ep.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: 'rgba(212,175,55,0.1)', color: 'rgba(212,175,55,0.7)', border: '1px solid rgba(212,175,55,0.2)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPlayingId(playingId === ep.id ? null : ep.id)}
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: playingId === ep.id
                        ? 'linear-gradient(135deg, #D4AF37, #800020)'
                        : 'rgba(212,175,55,0.15)',
                      border: '1px solid rgba(212,175,55,0.3)',
                    }}
                  >
                    {playingId === ep.id ? (
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ height: [8, 14, 8] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                            className="w-1 rounded-sm"
                            style={{ background: '#fff', minHeight: 4 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Play size={16} className="text-gold ml-0.5" />
                    )}
                  </motion.button>
                </div>
                {playingId === ep.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 pt-3 border-t border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <motion.div
                          initial={{ width: '0%' }}
                          animate={{ width: '35%' }}
                          transition={{ duration: 2 }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #D4AF37, #800020)' }}
                        />
                      </div>
                      <span className="text-xs font-mono text-white/40">20:12 / {ep.duration}</span>
                    </div>
                    <p className="text-xs text-gold/50 mt-2">▶ Now playing: <em>{ep.title}</em> ft. {ep.guest}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
