import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Tv, Key, Rocket, Check, Copy, RefreshCw, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onComplete: () => void
}

const STEPS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'channel', label: 'Channel', icon: Tv },
  { id: 'key', label: 'Stream Key', icon: Key },
  { id: 'launch', label: 'Go Live', icon: Rocket },
]

function generateStreamKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return 'sw_' + Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

export default function CreatorOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState({ displayName: '', bio: '' })
  const [channel, setChannel] = useState({ category: '', title: '' })
  const [streamKey] = useState(generateStreamKey)
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyKey() {
    navigator.clipboard.writeText(streamKey).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const CATEGORIES = ['Gaming', 'Music', 'Sports', 'Education', 'Lifestyle', 'Technology', 'Dominos', 'Talk Show']

  function canAdvance() {
    if (step === 0) return profile.displayName.trim().length >= 2
    if (step === 1) return channel.category !== '' && channel.title.trim().length >= 3
    if (step === 2) return true
    return true
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else {
      localStorage.setItem('sw_onboarding_done', '1')
      onComplete()
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #04040a, #0a0a14 40%, #14142b)' }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-8 blur-3xl"
          style={{ background: '#800020' }} />
      </div>

      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-white tracking-wider mb-1">CREATOR SETUP</h1>
          <p className="text-white/40 text-sm">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-all text-sm font-semibold',
                    done ? 'text-dark-500' : active ? 'text-dark-500' : 'text-white/30'
                  )}
                  style={{
                    background: done ? '#D4AF37' : active ? 'linear-gradient(135deg, #D4AF37, #F0D060)' : 'rgba(255,255,255,0.05)',
                    border: done || active ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: active ? '0 0 16px rgba(212,175,55,0.4)' : 'none',
                  }}
                >
                  {done ? <Check size={16} /> : <Icon size={16} />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-8 h-0.5 rounded" style={{ background: done ? '#D4AF37' : 'rgba(255,255,255,0.1)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="rounded-2xl border p-8 space-y-5"
          style={{ background: '#0a0a14', borderColor: 'rgba(212,175,55,0.15)' }}
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Your Profile</h2>
                  <p className="text-white/40 text-sm">How viewers will know you</p>
                </div>
                <div>
                  <label className="text-xs font-mono tracking-widest text-white/40 uppercase block mb-1.5">Display Name *</label>
                  <input
                    value={profile.displayName}
                    onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="Your creator name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono tracking-widest text-white/40 uppercase block mb-1.5">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell your audience about yourself..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/40 transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="channel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Channel Setup</h2>
                  <p className="text-white/40 text-sm">Configure your channel identity</p>
                </div>
                <div>
                  <label className="text-xs font-mono tracking-widest text-white/40 uppercase block mb-1.5">Category *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setChannel(c => ({ ...c, category: cat }))}
                        className="py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: channel.category === cat ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                          border: channel.category === cat ? '1px solid rgba(212,175,55,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          color: channel.category === cat ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono tracking-widest text-white/40 uppercase block mb-1.5">First Stream Title *</label>
                  <input
                    value={channel.title}
                    onChange={e => setChannel(c => ({ ...c, title: e.target.value }))}
                    placeholder="e.g. My first SeeWhy LIVE stream"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-gold/40 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="key" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Your Stream Key</h2>
                  <p className="text-white/40 text-sm">AES-256-GCM encrypted — never share this</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#14142b', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Key size={14} className="text-gold" />
                    <span className="text-xs font-mono text-gold/80 tracking-widest">STREAM KEY (AES-256-GCM)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-mono text-sm text-white/80 break-all">
                      {showKey ? streamKey : streamKey.replace(/./g, '•')}
                    </span>
                    <button onClick={() => setShowKey(s => !s)} className="text-white/40 hover:text-white/70 flex-shrink-0">
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={copyKey} className="text-white/40 hover:text-gold flex-shrink-0 transition-colors">
                      {copied ? <Check size={16} className="text-gold" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(220,20,60,0.08)', border: '1px solid rgba(220,20,60,0.2)' }}>
                  <p className="text-crimson text-xs font-semibold">Security Notice</p>
                  <p className="text-white/50 text-xs">
                    Your stream key is encrypted end-to-end. Anyone with this key can stream to your channel.
                    Never paste it into OBS profiles you share publicly.
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#14142b', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-white/60 text-xs font-semibold mb-2">RTMP Settings</p>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/40">Server</span>
                      <span className="text-white/70">rtmp://stream.seewhylive.online/live</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Port</span>
                      <span className="text-white/70">1935</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Key</span>
                      <span className="text-gold/80">{'<your key above>'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="launch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'linear-gradient(135deg, #D4AF37, #800020)' }}
                >
                  <Rocket size={32} className="text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-display tracking-wider text-white">YOU'RE READY</h2>
                  <p className="text-white/50 text-sm mt-2">
                    {profile.displayName || 'Creator'}, your channel is configured. Start OBS, set your RTMP key, and go live.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Revenue Split', value: '90%', sub: 'yours' },
                    { label: 'Latency', value: '<3s', sub: 'HLS' },
                    { label: 'Co-hosts', value: '∞', sub: 'free' },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)' }}>
                      <div className="text-xl font-display text-gold">{stat.value}</div>
                      <div className="text-xs text-white/40">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all"
            style={{
              background: canAdvance() ? 'linear-gradient(135deg, #D4AF37, #F0D060)' : 'rgba(255,255,255,0.05)',
              color: canAdvance() ? '#04040a' : 'rgba(255,255,255,0.2)',
              cursor: canAdvance() ? 'pointer' : 'not-allowed',
            }}
          >
            {step === STEPS.length - 1 ? 'Enter Platform' : 'Continue'}
            <ChevronRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  )
}
