import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, MapPin, Calendar, Users, ChevronRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = ['Bracket', 'Standings', 'Venue', 'Rules'] as const
type Tab = typeof TABS[number]

interface Match {
  id: string
  round: string
  teamA: string
  teamB: string
  scoreA?: number
  scoreB?: number
  winner?: 'A' | 'B'
  status: 'upcoming' | 'live' | 'done'
}

const BRACKET: Match[] = [
  // Quarterfinals
  { id: 'qf1', round: 'QF', teamA: 'CaliBones', teamB: 'Domino Dan', scoreA: 150, scoreB: 120, winner: 'A', status: 'done' },
  { id: 'qf2', round: 'QF', teamA: 'SwanyThree23', teamB: 'PacificBone', scoreA: 150, scoreB: 95, winner: 'A', status: 'done' },
  { id: 'qf3', round: 'QF', teamA: 'VibeKing', teamB: 'RockSolid', scoreA: 140, scoreB: 150, winner: 'B', status: 'done' },
  { id: 'qf4', round: 'QF', teamA: 'WashBones', teamB: 'LongBeach7', scoreA: 150, scoreB: 130, winner: 'A', status: 'done' },
  // Semifinals
  { id: 'sf1', round: 'SF', teamA: 'CaliBones', teamB: 'SwanyThree23', status: 'live', scoreA: 85, scoreB: 70 },
  { id: 'sf2', round: 'SF', teamA: 'RockSolid', teamB: 'WashBones', status: 'upcoming' },
  // Final
  { id: 'f1', round: 'FINAL', teamA: 'TBD', teamB: 'TBD', status: 'upcoming' },
]

const STANDINGS = [
  { rank: 1, player: 'CaliBones', wins: 4, losses: 0, points: 620, streak: 'W4' },
  { rank: 2, player: 'SwanyThree23', wins: 3, losses: 1, points: 480, streak: 'W3' },
  { rank: 3, player: 'WashBones', wins: 3, losses: 1, points: 455, streak: 'W2' },
  { rank: 4, player: 'RockSolid', wins: 3, losses: 1, points: 440, streak: 'W1' },
  { rank: 5, player: 'VibeKing', wins: 2, losses: 2, points: 340, streak: 'L1' },
  { rank: 6, player: 'WashBones', wins: 2, losses: 2, points: 320, streak: 'L2' },
  { rank: 7, player: 'Domino Dan', wins: 1, losses: 2, points: 210, streak: 'L1' },
  { rank: 8, player: 'LongBeach7', wins: 1, losses: 2, points: 195, streak: 'L1' },
]

function MatchCard({ match }: { match: Match }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-3 border"
      style={{
        background: match.status === 'live' ? 'rgba(220,20,60,0.08)' : '#0a0a14',
        borderColor: match.status === 'live' ? 'rgba(220,20,60,0.3)' : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono tracking-widest text-white/30">{match.round}</span>
        {match.status === 'live' && (
          <div className="flex items-center gap-1 text-crimson text-[10px] font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
            LIVE
          </div>
        )}
        {match.status === 'done' && (
          <span className="text-[10px] text-white/30">FINAL</span>
        )}
        {match.status === 'upcoming' && (
          <span className="text-[10px] text-white/20">UPCOMING</span>
        )}
      </div>

      <div className="space-y-1.5">
        {[
          { name: match.teamA, score: match.scoreA, isWinner: match.winner === 'A' },
          { name: match.teamB, score: match.scoreB, isWinner: match.winner === 'B' },
        ].map((team, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className={cn(
              'text-sm font-semibold',
              team.isWinner ? 'text-gold' : match.status === 'done' ? 'text-white/40' : 'text-white/80'
            )}>
              {team.name}
              {team.isWinner && ' ✓'}
            </span>
            {team.score !== undefined && (
              <span className={cn(
                'font-mono text-sm font-bold',
                team.isWinner ? 'text-gold' : 'text-white/50'
              )}>
                {team.score}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function WashingtonClassic() {
  const [activeTab, setActiveTab] = useState<Tab>('Bracket')

  return (
    <div className="min-h-screen" style={{ background: '#04040a' }}>
      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #04040a, #14142b, #0a0a14)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl"
            style={{ background: '#D4AF37' }} />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-8 blur-3xl"
            style={{ background: '#800020' }} />
        </div>
        <div className="relative px-4 py-10 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} className="text-gold" />
            <span className="text-xs font-mono tracking-widest text-gold/60">PRESENTED BY SEEWHYLIVE</span>
          </div>
          <h1 className="font-display text-5xl text-white tracking-wider leading-none mb-1">WASHINGTON</h1>
          <h2 className="font-display text-3xl tracking-wider mb-3" style={{ color: '#D4AF37' }}>CLASSIC 2026</h2>
          <p className="text-white/50 text-sm mb-6">
            Double Elimination · 7-Rock Rules · 5/150 Scoring<br />
            Des Moines, WA · Promoted by Swany Three 23 & CaliBones
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { icon: <Calendar size={14} />, label: '2026 Season' },
              { icon: <MapPin size={14} />, label: "Jamar's Sports Bar, Des Moines WA" },
              { icon: <Users size={14} />, label: '16 Players' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs text-white/50"
                style={{ border: '1px solid rgba(212,175,55,0.15)', background: 'rgba(212,175,55,0.05)', borderRadius: 8, padding: '6px 12px' }}>
                <span className="text-gold/60">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 border-b border-white/5 overflow-x-auto scrollbar-hide"
        style={{ background: '#04040a' }}>
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 min-w-[80px] py-3 text-sm font-semibold transition-all"
              style={{
                color: activeTab === tab ? '#D4AF37' : 'rgba(255,255,255,0.4)',
                borderBottom: activeTab === tab ? '2px solid #D4AF37' : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Bracket */}
        {activeTab === 'Bracket' && (
          <div className="space-y-6">
            {(['QF', 'SF', 'FINAL'] as const).map(round => {
              const matches = BRACKET.filter(m => m.round === round)
              return (
                <div key={round}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono tracking-widest text-white/40">{round === 'QF' ? 'QUARTERFINALS' : round === 'SF' ? 'SEMIFINALS' : 'CHAMPIONSHIP FINAL'}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matches.map(m => <MatchCard key={m.id} match={m} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Standings */}
        {activeTab === 'Standings' && (
          <div className="rounded-xl overflow-hidden border border-white/5">
            <div className="grid grid-cols-5 px-4 py-2 text-[10px] font-mono tracking-widest text-white/30"
              style={{ background: '#14142b' }}>
              <span>#</span>
              <span className="col-span-2">PLAYER</span>
              <span className="text-center">W-L</span>
              <span className="text-right">PTS</span>
            </div>
            {STANDINGS.map((row, i) => (
              <motion.div
                key={row.player}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-5 px-4 py-3 border-t border-white/5 items-center"
                style={{ background: i === 0 ? 'rgba(212,175,55,0.06)' : 'transparent' }}
              >
                <span className={cn('font-bold text-sm', i === 0 ? 'text-gold' : 'text-white/40')}>{row.rank}</span>
                <div className="col-span-2 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: i === 0 ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#D4AF37' : 'rgba(255,255,255,0.4)' }}>
                    {row.player[0]}
                  </div>
                  <span className={cn('text-sm font-semibold', i === 0 ? 'text-gold' : 'text-white/80')}>{row.player}</span>
                </div>
                <span className="text-center font-mono text-xs text-white/50">{row.wins}-{row.losses}</span>
                <span className="text-right font-mono text-sm font-bold text-white/80">{row.points}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Venue */}
        {activeTab === 'Venue' && (
          <div className="space-y-4">
            <div className="rounded-xl p-5 border border-white/5" style={{ background: '#0a0a14' }}>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-gold" />
                Jamar's Sports Bar
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Address</span>
                  <span className="text-white/80">Des Moines, Washington</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Capacity</span>
                  <span className="text-white/80">Private event — 60 seats</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Tables</span>
                  <span className="text-white/80">Tournament-grade domino tables</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Streaming</span>
                  <span className="text-white/80">Live on SeeWhy LIVE</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5 border border-white/5" style={{ background: '#0a0a14' }}>
              <h3 className="font-semibold text-white mb-3">Promoters</h3>
              <div className="space-y-3">
                {[
                  { name: 'Swany Three 23', role: 'Lead Promoter & Host', color: '#D4AF37' },
                  { name: 'CaliBones', role: 'Co-Promoter & Player', color: '#800020' },
                ].map(p => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }}>
                      {p.name[0]}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{p.name}</p>
                      <p className="text-white/40 text-xs">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Rules */}
        {activeTab === 'Rules' && (
          <div className="space-y-4">
            {[
              { title: '7-Rock Rules', items: ['Each player draws 7 tiles at game start', 'Remaining tiles form the boneyard', 'Draw from boneyard if you cannot play', 'Open ends must be multiples of 5 to score'] },
              { title: '5/150 Scoring', items: ['Score = sum of open ends ÷ 5 × 5', 'Only multiples of 5 score', 'First to 150 wins the hand', 'Game to 500 overall (race format)'] },
              { title: 'Double Elimination', items: ['Two losses = eliminated', 'Winners bracket + Losers bracket', 'Grand Final: Winners vs Losers champion', 'Losers champion must win twice in Grand Final'] },
              { title: 'Tournament Conduct', items: ['No coaching during active hands', '60-second shot clock per turn', 'Disputes resolved by head judge', 'Streaming required — no camera blocking'] },
            ].map(section => (
              <div key={section.title} className="rounded-xl p-5 border border-white/5" style={{ background: '#0a0a14' }}>
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Info size={14} className="text-gold" />
                  {section.title}
                </h3>
                <ul className="space-y-1.5">
                  {section.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-white/60">
                      <ChevronRight size={14} className="text-gold/50 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
