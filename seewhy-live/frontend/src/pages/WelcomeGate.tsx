import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, ArrowRight, Shield, Users, MessageCircle, Calendar } from 'lucide-react'

interface Agreement {
  id: string
  icon: React.ReactNode
  title: string
  body: string
  required?: boolean
}

const AGREEMENTS: Agreement[] = [
  {
    id: 'beta',
    icon: <Shield size={20} />,
    title: 'Beta Testing Terms',
    body: 'I understand SeeWhy LIVE is in beta. Features may change, break, or be removed. My feedback helps shape the product.',
  },
  {
    id: 'multi',
    icon: <Users size={20} />,
    title: 'Multi-User Permissions',
    body: 'I understand that streams, chats, and co-hosts involve shared digital spaces. I consent to multi-party interactions and recordings.',
  },
  {
    id: 'conduct',
    icon: <MessageCircle size={20} />,
    title: 'Community Conduct',
    body: 'I agree to treat all community members with respect. Harassment, hate speech, or spam results in immediate removal.',
  },
  {
    id: 'age',
    icon: <Calendar size={20} />,
    title: 'Age Verification (18+)',
    body: 'I confirm I am at least 18 years old. SeeWhy LIVE contains live content including competitive events and financial transactions.',
    required: true,
  },
]

interface Props {
  onComplete: () => void
}

export default function WelcomeGate({ onComplete }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<'agreements' | 'done'>('agreements')

  function toggle(id: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allChecked = AGREEMENTS.every(a => checked.has(a.id))

  function handleContinue() {
    if (!allChecked) return
    setStep('done')
    setTimeout(() => {
      localStorage.setItem('sw_welcome_done', '1')
      onComplete()
    }, 1200)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #04040a 0%, #0a0a14 60%, #0f0f1e 100%)' }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 blur-3xl"
          style={{ background: '#D4AF37' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5 blur-3xl"
          style={{ background: '#800020' }} />
      </div>

      <AnimatePresence mode="wait">
        {step === 'agreements' ? (
          <motion.div
            key="agreements"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            className="w-full max-w-lg"
          >
            <div className="text-center mb-8">
              <h1 className="font-display text-5xl text-white tracking-wider mb-2">WELCOME</h1>
              <p className="text-white/50 text-sm">Before entering, please review and agree to the following</p>
            </div>

            <div className="space-y-3 mb-8">
              {AGREEMENTS.map((ag, i) => (
                <motion.button
                  key={ag.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => toggle(ag.id)}
                  className="w-full text-left rounded-xl p-4 border transition-all"
                  style={{
                    background: checked.has(ag.id) ? 'rgba(212,175,55,0.08)' : '#0a0a14',
                    borderColor: checked.has(ag.id) ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-0.5 transition-colors ${checked.has(ag.id) ? 'text-gold' : 'text-white/30'}`}>
                      {checked.has(ag.id)
                        ? <CheckCircle2 size={20} />
                        : <Circle size={20} />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`transition-colors ${checked.has(ag.id) ? 'text-gold' : 'text-white/50'}`}>
                          {ag.icon}
                        </span>
                        <span className="font-semibold text-white text-sm">{ag.title}</span>
                        {ag.required && (
                          <span className="text-[10px] font-mono text-crimson border border-crimson/40 px-1.5 py-0.5 rounded">REQUIRED</span>
                        )}
                      </div>
                      <p className="text-white/50 text-xs leading-relaxed">{ag.body}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={allChecked ? { scale: 1.02 } : {}}
              whileTap={allChecked ? { scale: 0.98 } : {}}
              onClick={handleContinue}
              disabled={!allChecked}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-all"
              style={{
                background: allChecked ? 'linear-gradient(135deg, #D4AF37, #F0D060)' : 'rgba(255,255,255,0.05)',
                color: allChecked ? '#04040a' : 'rgba(255,255,255,0.2)',
                cursor: allChecked ? 'pointer' : 'not-allowed',
              }}
            >
              {allChecked ? 'Enter SeeWhy LIVE' : `Agree to all ${AGREEMENTS.length} terms to continue`}
              {allChecked && <ArrowRight size={18} />}
            </motion.button>

            <p className="text-center text-white/25 text-xs mt-4">
              {AGREEMENTS.filter(a => checked.has(a.id)).length} / {AGREEMENTS.length} agreed
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #F0D060)' }}
            >
              <CheckCircle2 size={36} className="text-dark-500" />
            </motion.div>
            <h2 className="font-display text-4xl text-white tracking-wider">LET'S GO</h2>
            <p className="text-gold/80 text-sm mt-2">Welcome to SeeWhy LIVE</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
