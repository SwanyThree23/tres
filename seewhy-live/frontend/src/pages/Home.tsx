import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Zap, Play, HelpCircle, Brain, Users, TrendingUp,
  Star, ChevronRight, Radio, BookOpen, Sparkles,
  BarChart3, Shield, Globe,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { streamsApi, usersApi } from '@/lib/api'
import StreamCard from '@/components/StreamCard'
import CreatorCard from '@/components/CreatorCard'
import type { StreamInfo } from '@/stores/streamStore'
import type { User } from '@/stores/authStore'
import { CATEGORIES } from '@/lib/utils'

const FEATURES = [
  {
    icon: HelpCircle,
    color: 'from-cyan-500 to-cyan-700',
    title: 'Live Why Board',
    description: 'Ask "why" questions during streams. Top questions get answered live by the creator or AI.',
  },
  {
    icon: Brain,
    color: 'from-brand-500 to-brand-700',
    title: 'AI Co-Host',
    description: 'Our AI assists creators with real-time answers, fact-checks, and explanations.',
  },
  {
    icon: Users,
    color: 'from-emerald-500 to-emerald-700',
    title: '20-Person Panels',
    description: 'Invite up to 20 guests to join your stream for collaborative explanations.',
  },
  {
    icon: TrendingUp,
    color: 'from-orange-500 to-orange-700',
    title: 'Gamified Learning',
    description: 'Earn XP, unlock badges, and climb leaderboards as you learn and engage.',
  },
  {
    icon: BarChart3,
    color: 'from-pink-500 to-pink-700',
    title: 'Creator Analytics',
    description: 'Detailed insights on viewer engagement, question trends, and revenue.',
  },
  {
    icon: Shield,
    color: 'from-blue-500 to-blue-700',
    title: 'Monetization Tools',
    description: '90/10 revenue split with tips, subscriptions, and multi-platform streaming.',
  },
]

const STATS = [
  { value: '50K+', label: 'Active Learners' },
  { value: '2,400+', label: 'Live Streams' },
  { value: '1.2M+', label: 'Questions Asked' },
  { value: '98%', label: 'Satisfaction Rate' },
]

const PLANS = [
  {
    name: 'Viewer',
    price: 'Free',
    desc: 'For curious minds',
    features: ['Watch unlimited streams', 'Ask up to 10 questions/day', 'Earn viewer XP', 'Basic chat'],
    cta: 'Start Watching',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Creator',
    price: '$19',
    period: '/month',
    desc: 'For educators & experts',
    features: ['Go live anytime', 'Unlimited why-board questions', 'AI co-host assistant', '20-guest panels', 'Analytics dashboard', 'Multi-platform streaming'],
    cta: 'Start Creating',
    href: '/register?plan=creator',
    highlighted: true,
  },
  {
    name: 'Studio',
    price: '$49',
    period: '/month',
    desc: 'For power creators',
    features: ['Everything in Creator', 'Custom branding', 'Priority AI responses', 'VOD storage 1TB', 'Team collaboration', 'Dedicated support'],
    cta: 'Go Pro',
    href: '/register?plan=studio',
    highlighted: false,
  },
]

export default function Home() {
  const featuresRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const featuresInView = useInView(featuresRef, { once: true, margin: '-100px' })
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' })

  const { data: featuredStreams } = useQuery<StreamInfo[]>({
    queryKey: ['streams', 'featured'],
    queryFn: () => streamsApi.featured().then((r) => r.data),
    staleTime: 60_000,
  })

  const { data: topCreators } = useQuery<User[]>({
    queryKey: ['creators', 'top'],
    queryFn: () => usersApi.get('top').then((r) => r.data).catch(() => []),
    staleTime: 120_000,
  })

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative mesh-bg overflow-hidden py-20 md:py-32">
        {/* Floating blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 border border-brand-500/30 rounded-full text-sm text-brand-300 mb-6">
              <Sparkles className="w-4 h-4" />
              The live learning revolution is here
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Where{' '}
              <span className="gradient-text text-shadow-glow">Curiosity</span>
              <br />
              Goes Live
            </h1>

            <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-10">
              Stream live explanations, ask why in real time, and unlock knowledge
              with AI-powered answers from the world's best educators.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse" className="btn-primary text-base px-8 py-4">
                <Play className="w-5 h-5" />
                Watch Live Now
              </Link>
              <Link to="/register" className="btn-secondary text-base px-8 py-4">
                <Radio className="w-5 h-5" />
                Start Streaming
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                4.9/5 rating
              </span>
              <span>·</span>
              <span>50K+ learners</span>
              <span>·</span>
              <span>No credit card required</span>
            </div>
          </motion.div>

          {/* Hero preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative max-w-4xl mx-auto"
          >
            <div className="card border-brand-500/30 shadow-glow-purple overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-dark-50 to-dark-300 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-dark-300" />
                <div className="relative text-center">
                  <div className="w-20 h-20 rounded-full bg-brand-500/30 border border-brand-500/50 flex items-center justify-center mx-auto mb-4 animate-glow">
                    <Play className="w-8 h-8 text-brand-400" />
                  </div>
                  <p className="text-white/60 text-sm">Live stream preview</p>
                </div>

                {/* Floating why card */}
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-4 right-4 card p-3 max-w-48 border-cyan-500/30"
                >
                  <div className="why-badge mb-2">WHY? #1</div>
                  <p className="text-xs text-white">Why does quantum entanglement defy classical physics?</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-white/50">
                    <TrendingUp className="w-3 h-3" />
                    <span>142 upvotes</span>
                  </div>
                </motion.div>

                {/* Floating stat */}
                <motion.div
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute bottom-4 left-4 card p-2.5 flex items-center gap-2 border-emerald-500/30"
                >
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">3,847</p>
                    <p className="text-xs text-white/50">watching now</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="py-16 bg-dark-300/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live streams */}
      {featuredStreams && featuredStreams.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-heading">
                  <span className="dot-live inline-block mr-2" />
                  Live Right Now
                </h2>
                <p className="text-white/50 mt-1">Join the conversation in real time</p>
              </div>
              <Link to="/browse?live_only=true" className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="stream-grid">
              {featuredStreams.slice(0, 4).map((stream, i) => (
                <StreamCard key={stream.id} stream={stream} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="py-16 bg-dark-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-heading">Browse by Topic</h2>
              <p className="text-white/50 mt-1">Find streams about what makes you curious</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/browse?category=${encodeURIComponent(cat)}`}
                className="flex items-center gap-2 px-4 py-2.5 card hover:border-brand-500/50 hover:bg-brand-500/10 transition-all rounded-xl text-sm font-medium text-white/70 hover:text-white"
              >
                <BookOpen className="w-4 h-4 text-brand-400" />
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Everything you need to explain it live</h2>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              Built for educators, scientists, developers, and anyone passionate about sharing knowledge.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="card p-6 hover:border-brand-500/30 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Creators */}
      {topCreators && topCreators.length > 0 && (
        <section className="py-16 bg-dark-300/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-heading">Top Creators</h2>
                <p className="text-white/50 mt-1">Follow the minds shaping live education</p>
              </div>
              <Link to="/creators" className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topCreators.slice(0, 6).map((creator, i) => (
                <CreatorCard key={creator.id} creator={creator} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">How SeeWhy LIVE Works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-brand-500/50 to-cyan-500/50" />
            {[
              { step: '01', icon: Radio, title: 'Creator Goes Live', desc: 'Educators and experts stream live explanations on any topic.' },
              { step: '02', icon: HelpCircle, title: 'Viewers Ask Why', desc: 'Curious viewers post "why" questions. The community upvotes the best ones.' },
              { step: '03', icon: Brain, title: 'AI Answers Instantly', desc: 'Our AI provides instant answers while creators dive deeper live.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500/20 to-cyan-500/20 border border-brand-500/30 flex flex-col items-center justify-center mx-auto mb-6">
                  <span className="text-xs font-mono text-brand-400 mb-1">{step}</span>
                  <Icon className="w-8 h-8 text-brand-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-white/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-dark-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-white/50">Creators keep 90% of their earnings</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`card p-6 flex flex-col ${plan.highlighted ? 'border-brand-500/60 shadow-glow-purple relative' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-500 rounded-full text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-white/50 text-sm mb-3">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black gradient-text">{plan.price}</span>
                    {plan.period && <span className="text-white/50">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Zap className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={plan.highlighted ? 'btn-primary justify-center' : 'btn-secondary justify-center'}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/50 to-dark-200" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Globe className="w-12 h-12 text-brand-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to satisfy your curiosity?
            </h2>
            <p className="text-xl text-white/60 mb-10">
              Join 50,000+ learners who are discovering why the world works the way it does — live.
            </p>
            <Link to="/register" className="btn-primary text-lg px-10 py-4">
              <Zap className="w-5 h-5" />
              Join SeeWhy LIVE Free
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
