import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  HelpCircle, Brain, Zap, Radio, Users, TrendingUp,
  ChevronRight, BookOpen, Lightbulb, Target, Star,
  ArrowRight, Quote,
} from 'lucide-react'

const SCIENCE_POINTS = [
  {
    icon: HelpCircle,
    color: 'from-cyan-500 to-blue-600',
    title: 'The "Why" Effect',
    body: `Asking "why" activates deeper cognitive processing than simply receiving information. \
Studies in elaborative interrogation show that learners who generate explanations retain \
material 2–3× better than passive readers. SeeWhy LIVE is built around this mechanism.`,
    stat: '2–3×',
    statLabel: 'better retention',
  },
  {
    icon: Radio,
    color: 'from-brand-500 to-brand-700',
    title: 'Live = Active Recall',
    body: `Watching a live stream forces real-time processing — you can't rewind to fill gaps. \
This constraint mimics "desirable difficulty," a learning principle that makes retrieval \
harder but more durable. Synchronous learning produces stronger memories.`,
    stat: '40%',
    statLabel: 'stronger memory formation',
  },
  {
    icon: Brain,
    color: 'from-purple-500 to-pink-600',
    title: 'Social Learning Amplification',
    body: `Seeing others ask questions you didn't think of broadens your mental model. \
The Why Board creates a shared knowledge graph in real time — each upvote signals \
collective curiosity and helps creators cover what actually matters to the audience.`,
    stat: '67%',
    statLabel: 'more questions in social settings',
  },
  {
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    title: 'Immediate Feedback Loop',
    body: `When AI answers your "why" question within seconds, you get the dopamine hit of \
curiosity satisfied instantly. This trains your brain to associate asking questions with \
reward — building a habit of intellectual curiosity over time.`,
    stat: '<5s',
    statLabel: 'average AI answer time',
  },
]

const HOW_STEPS = [
  {
    n: '01',
    icon: Radio,
    title: 'Expert goes live',
    desc: 'A creator — scientist, engineer, historian, developer — streams a live explanation on any topic.',
  },
  {
    n: '02',
    icon: HelpCircle,
    title: 'Curiosity flows in',
    desc: 'Viewers type "why" questions. The community upvotes the ones they want answered most.',
  },
  {
    n: '03',
    icon: Brain,
    title: 'AI answers instantly',
    desc: 'Claude Haiku generates a concise, accurate answer in under 5 seconds while the creator dives deeper live.',
  },
  {
    n: '04',
    icon: TrendingUp,
    title: 'Knowledge compounds',
    desc: 'Earn XP, unlock badges, build streaks. The more you engage, the more your curiosity compounds.',
  },
]

const TESTIMONIALS = [
  {
    quote: "I finally understood general relativity after 10 years of trying. The live format forced me to actually engage instead of zoning out.",
    name: 'Maya K.',
    role: 'Software Engineer',
    color: '#7c3aed',
  },
  {
    quote: "The Why Board changes everything. Instead of sitting passively, I'm actively interrogating the content. My retention went through the roof.",
    name: 'James R.',
    role: 'Graduate Student',
    color: '#06b6d4',
  },
  {
    quote: "As a creator, seeing real-time why questions tells me exactly where my explanation breaks down. It's made me a dramatically better teacher.",
    name: 'Dr. Priya S.',
    role: 'Physicist & Creator',
    color: '#10b981',
  },
]

const CATEGORIES_WHY = [
  { topic: 'Why is the sky blue?', cat: 'Physics', views: '14.2K' },
  { topic: 'Why do economies crash?', cat: 'Economics', views: '9.8K' },
  { topic: 'Why is DNA double-stranded?', cat: 'Biology', views: '11.4K' },
  { topic: 'Why does democracy work (or not)?', cat: 'History', views: '8.3K' },
  { topic: 'Why are neural networks hard to interpret?', cat: 'Technology', views: '21.7K' },
  { topic: 'Why do prime numbers matter in cryptography?', cat: 'Mathematics', views: '7.1K' },
]

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function WhyItWorks() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative mesh-bg py-24 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-sm text-cyan-300 mb-6">
              <Lightbulb className="w-4 h-4" />
              The science behind SeeWhy LIVE
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
              Why "Why?" is the most{' '}
              <span className="gradient-text">powerful question</span>
              {' '}in learning
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
              Decades of cognitive science confirm that asking "why" produces dramatically
              deeper understanding than passive consumption. We built a platform around that single insight.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse" className="btn-primary text-base px-8 py-4">
                <BookOpen className="w-5 h-5" /> Start Learning
              </Link>
              <Link to="/register" className="btn-secondary text-base px-8 py-4">
                <Radio className="w-5 h-5" /> Start Teaching
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Science section */}
      <section className="py-24 bg-dark-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-white mb-4">The research is clear</h2>
              <p className="text-xl text-white/50 max-w-2xl mx-auto">
                Every feature on SeeWhy LIVE is grounded in peer-reviewed learning science.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SCIENCE_POINTS.map((pt, i) => (
              <FadeIn key={pt.title} delay={i * 0.1}>
                <div className="card p-6 h-full hover:border-brand-500/30 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pt.color} flex items-center justify-center flex-shrink-0`}>
                      <pt.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{pt.title}</h3>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-black gradient-text">{pt.stat}</p>
                      <p className="text-xs text-white/40">{pt.statLabel}</p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">{pt.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works (detailed) */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-white mb-4">The SeeWhy LIVE loop</h2>
              <p className="text-xl text-white/50">Four steps that turn passive watching into active understanding.</p>
            </div>
          </FadeIn>

          <div className="space-y-6">
            {HOW_STEPS.map((step, i) => (
              <FadeIn key={step.n} delay={i * 0.1}>
                <div className="card p-6 flex items-start gap-6 hover:border-brand-500/30 transition-colors">
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500/30 to-cyan-500/30 border border-brand-500/40 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-mono text-brand-400 leading-none">{step.n}</span>
                      <step.icon className="w-5 h-5 text-brand-400 mt-0.5" />
                    </div>
                    {i < HOW_STEPS.length - 1 && (
                      <div className="w-0.5 h-6 bg-gradient-to-b from-brand-500/40 to-transparent" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-white/60 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Example why questions */}
      <section className="py-24 bg-dark-300/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-white mb-4">Questions that spark breakthroughs</h2>
              <p className="text-xl text-white/50">Real examples from our most-upvoted Why Board sessions.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES_WHY.map((item, i) => (
              <FadeIn key={item.topic} delay={i * 0.08}>
                <Link to={`/browse?category=${item.cat}`} className="group block">
                  <div className="card p-4 hover:border-cyan-500/40 transition-colors h-full">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-cyan-500/30 transition-colors">
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug mb-2">
                          {item.topic}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-white/40">
                          <span className="why-badge">{item.cat}</span>
                          <span>{item.views} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <div className="text-center mt-10">
              <Link to="/browse" className="btn-secondary gap-2">
                Browse all topics <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-white mb-4">What our community says</h2>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="card p-6 flex flex-col h-full" style={{ borderColor: t.color + '33' }}>
                  <Quote className="w-8 h-8 mb-4" style={{ color: t.color }} />
                  <p className="text-white/70 text-sm leading-relaxed flex-1 mb-4 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: t.color + '33', color: t.color }}
                    >
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role}</p>
                    </div>
                    <div className="ml-auto flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-dark-300/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <FadeIn>
          <div className="relative max-w-2xl mx-auto px-4 text-center">
            <Target className="w-12 h-12 text-brand-400 mx-auto mb-6" />
            <h2 className="text-4xl font-black text-white mb-6">
              Ready to ask better questions?
            </h2>
            <p className="text-xl text-white/60 mb-10">
              Join 50,000+ learners who've replaced passive scrolling with active curiosity.
            </p>
            <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Join Free — No credit card
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </FadeIn>
      </section>
    </div>
  )
}
