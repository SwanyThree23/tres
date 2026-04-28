import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Zap, MessageCircle, Send, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Fighter {
  id: 'red' | 'blue'
  name: string
  avatar: string
  team: string
  power: number
  gifts: number
}

interface Gift {
  id: number
  emoji: string
  label: string
  value: number
  target: 'red' | 'blue'
  x: number
}

interface BattleMsg {
  id: number
  text: string
  type: 'system' | 'chat' | 'gift'
  author?: string
}

const INITIAL_FIGHTERS: { red: Fighter; blue: Fighter } = {
  red: { id: 'red', name: 'CaliBones', avatar: 'C', team: 'PK_RED', power: 50, gifts: 0 },
  blue: { id: 'blue', name: 'SwanyThree23', avatar: 'S', team: 'PK_BLUE', power: 50, gifts: 0 },
}

const GIFT_OPTIONS = [
  { emoji: '🔥', label: 'Fire', value: 5 },
  { emoji: '💀', label: 'Skull', value: 10 },
  { emoji: '⚡', label: 'Bolt', value: 15 },
  { emoji: '👑', label: 'Crown', value: 25 },
  { emoji: '💎', label: 'Diamond', value: 50 },
]

const BATTLE_DURATION = 120 // seconds

export default function PKBattleArena() {
  const [fighters, setFighters] = useState(INITIAL_FIGHTERS)
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION)
  const [battleActive, setBattleActive] = useState(false)
  const [battleOver, setBattleOver] = useState(false)
  const [flyingGifts, setFlyingGifts] = useState<Gift[]>([])
  const [log, setLog] = useState<BattleMsg[]>([
    { id: 0, text: 'Battle arena loaded. Press START to begin!', type: 'system' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<NodeJS.Timeout>()
  const giftIdRef = useRef(100)
  const msgIdRef = useRef(1)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [log])

  useEffect(() => {
    if (!battleActive || battleOver) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          setBattleActive(false)
          setBattleOver(true)
          addMsg('⏱️ TIME\'S UP! Battle over!', 'system')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [battleActive, battleOver])

  function addMsg(text: string, type: BattleMsg['type'] = 'system', author?: string) {
    const id = msgIdRef.current++
    setLog(l => [...l.slice(-49), { id, text, type, author }])
  }

  function startBattle() {
    setFighters(INITIAL_FIGHTERS)
    setTimeLeft(BATTLE_DURATION)
    setBattleOver(false)
    setBattleActive(true)
    setLog([{ id: 0, text: '🥊 BATTLE STARTED! Send gifts to power up your fighter!', type: 'system' }])
  }

  function sendGift(target: 'red' | 'blue', gift: typeof GIFT_OPTIONS[0]) {
    if (!battleActive) return
    const giftId = giftIdRef.current++
    const x = target === 'red' ? 20 + Math.random() * 20 : 60 + Math.random() * 20

    setFlyingGifts(prev => [...prev, { id: giftId, ...gift, target, x }])
    setTimeout(() => setFlyingGifts(prev => prev.filter(g => g.id !== giftId)), 1200)

    setFighters(prev => {
      const next = { ...prev }
      const other: 'red' | 'blue' = target === 'red' ? 'blue' : 'red'
      const powerGain = Math.min(gift.value, 100 - prev[target].power)
      const totalPower = prev.red.power + prev.blue.power

      next[target] = { ...prev[target], power: prev[target].power + powerGain, gifts: prev[target].gifts + 1 }

      // Normalize
      const newRedPower = target === 'red' ? next.red.power : Math.max(5, prev.red.power - gift.value * 0.5)
      const newBluePower = target === 'blue' ? next.blue.power : Math.max(5, prev.blue.power - gift.value * 0.5)
      const total = newRedPower + newBluePower
      next.red = { ...next.red, power: Math.round((newRedPower / total) * 100) }
      next.blue = { ...next.blue, power: Math.round((newBluePower / total) * 100) }

      return next
    })

    const targetFighter = target === 'red' ? fighters.red : fighters.blue
    addMsg(`${gift.emoji} +${gift.value} to ${targetFighter.name}!`, 'gift')
  }

  function sendChat() {
    if (!chatInput.trim()) return
    addMsg(chatInput.trim(), 'chat', 'You')
    setChatInput('')
  }

  const winner = battleOver
    ? fighters.red.power > fighters.blue.power ? fighters.red : fighters.blue
    : null

  const timePercent = (timeLeft / BATTLE_DURATION) * 100
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#04040a' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5"
        style={{ background: '#0a0a14' }}>
        <div className="flex items-center gap-2">
          <Swords size={18} className="text-gold" />
          <span className="font-display text-xl tracking-wider text-white">PK BATTLE</span>
          {battleActive && (
            <div className="flex items-center gap-1.5 ml-2">
              <div className="w-2 h-2 rounded-full bg-crimson animate-pulse" />
              <span className="text-crimson text-xs font-mono font-semibold">LIVE</span>
            </div>
          )}
        </div>
        <button onClick={() => setShowChat(s => !s)}
          className={cn('p-2 rounded-lg transition-colors', showChat ? 'bg-gold/20 text-gold' : 'text-white/40 hover:text-white/70')}>
          <MessageCircle size={18} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className={cn('flex-1 flex flex-col overflow-y-auto', showChat && 'hidden sm:flex')}>
          {/* Timer */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-white/40">TIME</span>
              <span className={cn(
                'font-mono text-lg font-bold',
                timeLeft <= 20 ? 'text-crimson animate-pulse' : 'text-white'
              )}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </span>
              <span className="text-xs font-mono text-white/40">ROUND 1</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${timePercent}%`,
                  background: timeLeft <= 20
                    ? '#DC143C'
                    : timeLeft <= 60
                    ? '#D4AF37'
                    : 'linear-gradient(90deg, #D4AF37, #800020)',
                  transition: 'width 1s linear',
                }}
              />
            </div>
          </div>

          {/* Battle arena */}
          <div className="px-4 relative">
            {/* Power bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs font-mono mb-1">
                <span style={{ color: '#DC143C' }}>{fighters.red.power}%</span>
                <span className="text-white/30">POWER</span>
                <span style={{ color: '#3b82f6' }}>{fighters.blue.power}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div
                  className="h-full rounded-l-full"
                  style={{ width: `${fighters.red.power}%`, background: 'linear-gradient(90deg, #DC143C, #FF3060)', transition: 'width 0.5s ease' }}
                />
                <motion.div
                  className="h-full rounded-r-full"
                  style={{ width: `${fighters.blue.power}%`, background: 'linear-gradient(90deg, #2563eb, #3b82f6)', transition: 'width 0.5s ease' }}
                />
              </div>
            </div>

            {/* Fighters */}
            <div className="flex items-center justify-between gap-4 mb-4">
              {[fighters.red, fighters.blue].map(f => (
                <div key={f.id} className="flex-1 text-center">
                  <div className="relative inline-block">
                    <motion.div
                      animate={battleActive ? { scale: [1, 1.04, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity, delay: f.id === 'blue' ? 0.75 : 0 }}
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-display mx-auto mb-2"
                      style={{
                        background: f.id === 'red'
                          ? 'linear-gradient(135deg, #800020, #DC143C)'
                          : 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                        boxShadow: f.id === 'red'
                          ? '0 0 20px rgba(220,20,60,0.3)'
                          : '0 0 20px rgba(59,130,246,0.3)',
                      }}
                    >
                      {f.avatar}
                    </motion.div>
                    {winner?.id === f.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2"
                      >
                        <Crown size={20} className="text-gold" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white">{f.name}</p>
                  <p className="text-xs font-mono text-white/40">{f.team}</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Zap size={12} className="text-gold/60" />
                    <span className="text-xs font-mono text-gold/60">{f.gifts} gifts</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Flying gifts */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <AnimatePresence>
                {flyingGifts.map(g => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 1, y: 60, scale: 1 }}
                    animate={{ opacity: 0, y: -60, scale: 2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="absolute text-3xl pointer-events-none"
                    style={{ left: `${g.x}%`, bottom: '40%' }}
                  >
                    {g.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Battle over banner */}
          <AnimatePresence>
            {battleOver && winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-4 mb-4 rounded-xl p-4 text-center border"
                style={{
                  background: 'rgba(212,175,55,0.1)',
                  borderColor: 'rgba(212,175,55,0.4)',
                }}
              >
                <Crown size={28} className="text-gold mx-auto mb-2" />
                <p className="font-display text-2xl text-gold tracking-wider">{winner.name} WINS</p>
                <p className="text-white/50 text-sm">{winner.power}% power at time's up</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gift buttons */}
          <div className="px-4 space-y-3">
            <p className="text-xs font-mono text-white/30 text-center tracking-widest">SEND GIFTS</p>
            {GIFT_OPTIONS.map(gift => (
              <div key={gift.emoji} className="flex items-center gap-2">
                <button
                  onClick={() => sendGift('red', gift)}
                  disabled={!battleActive}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
                  style={{ background: 'rgba(220,20,60,0.2)', border: '1px solid rgba(220,20,60,0.3)', color: '#ff6b8a' }}
                >
                  {gift.emoji} {gift.label}
                  <span className="text-xs font-mono opacity-70">+{gift.value}</span>
                </button>
                <button
                  onClick={() => sendGift('blue', gift)}
                  disabled={!battleActive}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30"
                  style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}
                >
                  {gift.emoji} {gift.label}
                  <span className="text-xs font-mono opacity-70">+{gift.value}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Start / Restart button */}
          <div className="px-4 py-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={startBattle}
              disabled={battleActive}
              className="w-full py-3.5 rounded-xl font-display tracking-wider text-lg transition-all disabled:opacity-40"
              style={{
                background: battleOver
                  ? 'linear-gradient(135deg, #D4AF37, #F0D060)'
                  : battleActive
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, #800020, #DC143C)',
                color: battleOver ? '#04040a' : '#fff',
                boxShadow: battleActive ? 'none' : '0 0 20px rgba(220,20,60,0.3)',
              }}
            >
              {battleOver ? '🔁 REMATCH' : battleActive ? '⚔️ BATTLE IN PROGRESS...' : '⚔️ START BATTLE'}
            </motion.button>
          </div>
        </div>

        {/* Chat sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 border-l border-white/5 flex flex-col overflow-hidden"
              style={{ background: '#0a0a14' }}
            >
              <div className="px-3 py-2 border-b border-white/5 text-xs font-mono text-white/40 tracking-widest">BATTLE CHAT</div>
              <div ref={logRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                {log.map(msg => (
                  <div key={msg.id} className="text-xs leading-relaxed">
                    {msg.type === 'system' && <span className="text-gold/60">{msg.text}</span>}
                    {msg.type === 'gift' && <span className="text-emerald-400/80">{msg.text}</span>}
                    {msg.type === 'chat' && (
                      <span className="text-white/70">
                        <span className="text-cyan-400/70">{msg.author}: </span>
                        {msg.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 border-t border-white/5">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Chat..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-gold/30"
                />
                <button onClick={sendChat} className="p-2 rounded-lg bg-gold/20 text-gold hover:bg-gold/30 transition-colors">
                  <Send size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
