import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Eye, EyeOff, Loader2, AlertCircle, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
]

export default function Register() {
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultPlan = searchParams.get('plan') ?? 'viewer'

  const [form, setForm] = useState({
    display_name: '',
    username: '',
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [agreed, setAgreed] = useState(false)

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const passwordValid = PASSWORD_REQUIREMENTS.every((r) => r.test(form.password))
  const canSubmit = form.display_name && form.username && form.email && passwordValid && agreed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await register(form)
      navigate('/')
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Registration failed. Please try again.'
      setError(message)
    }
  }

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-glow-purple">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="gradient-text">SeeWhy</span>
              <span className="text-white"> LIVE</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-white/50 mt-1">Join 50,000+ curious learners</p>
        </div>

        {defaultPlan !== 'viewer' && (
          <div className="flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-3 mb-5 text-sm text-brand-300">
            <Zap className="w-4 h-4 flex-shrink-0" />
            You're signing up for the <strong className="capitalize">{defaultPlan}</strong> plan
          </div>
        )}

        <div className="card p-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-5 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={update('display_name')}
                  required
                  placeholder="Jane Doe"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1.5">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">@</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={update('username')}
                    required
                    placeholder="janedoe"
                    className="input pl-7"
                    pattern="[a-zA-Z0-9_]+"
                    title="Letters, numbers, and underscores only"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  required
                  placeholder="Create a strong password"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {form.password && (
                <div className="mt-2 space-y-1">
                  {PASSWORD_REQUIREMENTS.map((req) => (
                    <div
                      key={req.label}
                      className={cn(
                        'flex items-center gap-1.5 text-xs',
                        req.test(form.password) ? 'text-emerald-400' : 'text-white/40',
                      )}
                    >
                      <Check className={cn('w-3 h-3', req.test(form.password) ? 'opacity-100' : 'opacity-30')} />
                      {req.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <div
                className={cn(
                  'w-5 h-5 mt-0.5 rounded flex items-center justify-center border flex-shrink-0 transition-colors',
                  agreed ? 'bg-brand-500 border-brand-500' : 'border-white/30',
                )}
                onClick={() => setAgreed(!agreed)}
              >
                {agreed && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-white/60">
                I agree to the{' '}
                <Link to="/terms" className="text-brand-400 hover:text-brand-300">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-brand-400 hover:text-brand-300">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="btn-primary w-full justify-center py-3"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/50 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
