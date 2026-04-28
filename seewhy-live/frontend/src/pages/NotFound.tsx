import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HelpCircle, ArrowLeft, Search, Radio } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* Animated 404 */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500/20 to-cyan-500/20 border border-brand-500/30 flex items-center justify-center mx-auto"
          >
            <HelpCircle className="w-12 h-12 text-brand-400" />
          </motion.div>
          <div className="absolute -top-2 -right-2 why-badge text-xs">404</div>
        </div>

        <h1 className="text-4xl font-black text-white mb-4">
          Why is this page missing?
        </h1>
        <p className="text-lg text-white/50 mb-2">
          Great question. We don't have an answer for this one.
        </p>
        <p className="text-sm text-white/30 mb-10">
          The page you're looking for has been moved, deleted, or never existed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <Link to="/browse" className="btn-secondary gap-2">
            <Search className="w-4 h-4" /> Browse Streams
          </Link>
          <Link to="/register" className="btn-secondary gap-2">
            <Radio className="w-4 h-4" /> Go Live
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
