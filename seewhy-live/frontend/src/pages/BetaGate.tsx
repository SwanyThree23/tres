import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'

const VALID_CODES = new Set([
  'SWANY2026', 'CALIBONES', 'VIBENBONES',
  'DOMINO10K', 'WASHCLASSIC', 'SEEWHYLIVE',
])

interface Props {
  onAccess: () => void
}

export default function BetaGate({ onAccess }: Props) {
  const [code, setCode] = useState('')
  const [show, setShow] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  function shake() {
    setShaking(true)
    setTimeout(() => setShaking(false), 500)
  }

  function handleSubmit() {
    setError('')
    if (!VALID_CODES.has(code.trim().toUpperCase())) {
      setError('Invalid invite code. Contact a SeeWhy LIVE insider to get access.')
      shake()
      return
    }
    if (!agreed) {
      setError('You must agree to the Beta Tester Agreement to continue.')
      shake()
      return
    }
    localStorage.setItem('sw_beta_access', '1')
    onAccess()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #04040a 0%, #0a0a14 50%, #14142b 100%)' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: '#D4AF37' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 blur-3xl"
          style={{ background: '#800020' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #800020)' }}>
              <Lock size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold tracking-widest text-white font-display">SEEWHY</div>
              <div className="text-xs font-mono tracking-[0.3em] text-gold/80">BETA ACCESS</div>
            </div>
          </div>
          <p className="text-white/50 text-sm">
            Private beta — invite code required
          </p>
        </div>

        {/* Card */}
        <motion.div
          animate={shaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border p-8 space-y-6"
          style={{ background: '#0a0a14', borderColor: 'rgba(212,175,55,0.2)' }}
        >
          <div>
            <label className="text-xs font-mono tracking-widest text-white/50 uppercase block mb-2">
              Invite Code
            </label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={code}
                onChange={e => { setCode(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter your code"
                className="w-full rounded-xl px-4 py-3 pr-12 text-white font-mono tracking-widest text-lg focus:outline-none transition-all"
                style={{
                  background: '#14142b',
                  border: error ? '1px solid #DC143C' : '1px solid rgba(212,175,55,0.2)',
                }}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Beta tester agreement */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div
              className="flex-shrink-0 w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition-all"
              style={{
                background: agreed ? '#D4AF37' : 'transparent',
                borderColor: agreed ? '#D4AF37' : 'rgba(255,255,255,0.2)',
              }}
              onClick={() => setAgreed(a => !a)}
            >
              {agreed && <CheckCircle2 size={12} className="text-dark-500" />}
            </div>
            <span className="text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors select-none"
              onClick={() => setAgreed(a => !a)}>
              I agree to the{' '}
              <span className="text-gold underline cursor-pointer">Beta Tester Agreement</span>:
              features may be incomplete, content may change, and I agree not to share access credentials.
            </span>
          </label>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 text-crimson text-sm"
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-dark-500 tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
          >
            Enter Beta
            <ArrowRight size={18} />
          </button>
        </motion.div>

        <p className="text-center text-white/25 text-xs mt-6">
          Don't have a code?{' '}
          <a href="https://twitter.com/SeeWhyLIVE" target="_blank" rel="noopener noreferrer"
            className="text-white/40 hover:text-gold transition-colors">
            Follow us for drops
          </a>
        </p>
      </motion.div>
    </div>
  )
}
