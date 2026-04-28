import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Cpu, ChevronDown, Sparkles, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: number
}

const QUICK_PROMPTS = [
  'What is the Washington Classic 2026?',
  'Explain the 7-Rock domino rules',
  'How does the 90/10 split work?',
  'What is a PK Battle?',
  'How do I start streaming on SeeWhy?',
  'Who are the VibeNBones creators?',
]

const SYSTEM_CONTEXT = `You are Joyce AI, the intelligent assistant for SeeWhy LIVE — a live streaming platform focused on
domino culture, competitive gaming, and creator monetization.

Key platform facts:
- SeeWhy LIVE lets viewers ask "why" questions during streams; AI answers them in real time
- Creators keep 90% of tips/donations (10% platform fee, enforced by Stripe Connect)
- PK Battles are live 1v1 creator competitions with real-time gift economies
- Washington Classic 2026 is the premier domino tournament — Double Elimination, 7-Rock rules, 5/150 scoring
  Venue: Jamar's Sports Bar, Des Moines WA | Promoted by Swany Three 23 & CaliBones
- VibeNBones is a domino culture hub and podcast featuring top-tier domino content
- n8n automation workflows run on a dedicated KVM1 VPS (srv1587098) for platform operations
- RTMP ingest: rtmp://stream.seewhylive.online/live (port 1935), HLS output via nginx-rtmp
- Stream keys are AES-256-GCM encrypted

Respond in a helpful, concise, platform-knowledgeable style. Keep answers under 150 words unless detail is needed.`

async function askJoyce(messages: { role: string; content: string }[]): Promise<string> {
  try {
    const res = await fetch('/api/ai/joyce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, system: SYSTEM_CONTEXT }),
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.content || 'I had trouble processing that. Try again?'
  } catch {
    return sandboxResponse(messages[messages.length - 1]?.content || '')
  }
}

function sandboxResponse(q: string): string {
  const ql = q.toLowerCase()
  if (ql.includes('washington classic') || ql.includes('tournament'))
    return 'The Washington Classic 2026 is a premier domino tournament using 7-Rock rules with 5/150 scoring and Double Elimination format. It\'s held at Jamar\'s Sports Bar in Des Moines, WA, promoted by Swany Three 23 & CaliBones.'
  if (ql.includes('7-rock') || ql.includes('rules') || ql.includes('domino'))
    return '7-Rock dominoes: each player draws 7 tiles. 5/150 scoring — you score multiples of 5 on open ends. Double Elimination means two losses to exit. First to 150 wins the hand.'
  if (ql.includes('90') || ql.includes('split') || ql.includes('money') || ql.includes('tip'))
    return 'Creators keep 90% of every tip. SeeWhy LIVE takes 10% platform fee, enforced automatically by Stripe Connect so there\'s no manual payout math.'
  if (ql.includes('pk') || ql.includes('battle'))
    return 'PK Battles are live 1v1 showdowns between creators. Viewers send virtual gifts that power up their favorite fighter. The battle ends when time runs out or one fighter reaches the gift threshold.'
  if (ql.includes('stream') || ql.includes('obs') || ql.includes('rtmp'))
    return 'To stream: set your OBS RTMP server to rtmp://stream.seewhylive.online/live (port 1935) and paste your encrypted stream key from your Studio page. 30s health check confirms you\'re live.'
  if (ql.includes('vibe') || ql.includes('calibones'))
    return 'VibeNBones is a domino culture hub featuring CaliBones, VibeMaster, and crew. It includes podcast episodes, player profiles, and culture commentary — the heartbeat of the SeeWhy domino community.'
  return `Great question! I'm Joyce AI — SeeWhy LIVE's platform assistant. I can help with tournament info, streaming setup, creator tools, and domino culture. What would you like to know?`
}

export default function JoyceAI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hey! I'm Joyce AI — your SeeWhy LIVE assistant. I know everything about the Washington Classic 2026, PK Battles, creator tools, and domino culture. What's on your mind?",
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, atBottom])

  function handleScroll() {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setAtBottom(scrollHeight - scrollTop - clientHeight < 60)
  }

  async function handleSend(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput('')

    const userMsg: Message = { id: String(Date.now()), role: 'user', content, ts: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    const history = newMessages.map(m => ({ role: m.role, content: m.content }))
    const answer = await askJoyce(history)
    setMessages(prev => [...prev, {
      id: String(Date.now() + 1),
      role: 'assistant',
      content: answer,
      ts: Date.now(),
    }])
    setLoading(false)
  }

  function clearChat() {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: "Hey! I'm Joyce AI — your SeeWhy LIVE assistant. I know everything about the Washington Classic 2026, PK Battles, creator tools, and domino culture. What's on your mind?",
      ts: Date.now(),
    }])
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#04040a' }}
    >
      {/* Header */}
      <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between"
        style={{ background: '#0a0a14' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #800020)' }}>
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">Joyce AI</span>
              <span className="text-[10px] font-mono bg-gold/20 text-gold px-1.5 py-0.5 rounded border border-gold/30">
                CLAUDE
              </span>
            </div>
            <p className="text-white/40 text-xs">SeeWhy LIVE Platform Assistant</p>
          </div>
        </div>
        <button onClick={clearChat} className="text-white/30 hover:text-white/60 transition-colors p-2 rounded-lg hover:bg-white/5">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-3 border-b border-white/5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.2)',
                color: 'rgba(212,175,55,0.8)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #800020)' }}>
                  <Sparkles size={12} className="text-white" />
                </div>
              )}
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(128,0,32,0.2))'
                    : '#14142b',
                  border: msg.role === 'user'
                    ? '1px solid rgba(212,175,55,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  color: msg.role === 'user' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.8)',
                }}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2 mt-1"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #800020)' }}>
              <Sparkles size={12} className="text-white" />
            </div>
            <div className="rounded-2xl px-4 py-3" style={{ background: '#14142b', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-1.5 items-center h-5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [-3, 0, -3] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full bg-gold/60"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll button */}
      {!atBottom && (
        <div className="flex justify-center pb-2">
          <button
            onClick={() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setAtBottom(true) }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-gold/70 border border-gold/20 bg-gold/10 hover:bg-gold/20 transition-colors"
          >
            <ChevronDown size={12} /> Scroll down
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/5 px-4 py-3" style={{ background: '#0a0a14' }}>
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Ask about Washington Classic, streaming, domino rules..."
            rows={1}
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none resize-none overflow-hidden"
            style={{
              background: '#14142b',
              border: '1px solid rgba(212,175,55,0.15)',
              maxHeight: 120,
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
          >
            <Send size={16} className="text-dark-500" />
          </button>
        </div>
        <p className="text-white/20 text-[10px] text-center mt-2">Powered by Claude · SeeWhy LIVE v10.0</p>
      </div>
    </div>
  )
}
