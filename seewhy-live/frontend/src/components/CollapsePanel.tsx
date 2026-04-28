import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  badge?: string | number
  defaultOpen?: boolean
  children: React.ReactNode
  className?: string
  headerClassName?: string
}

export default function CollapsePanel({
  title,
  badge,
  defaultOpen = true,
  children,
  className,
  headerClassName,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('card overflow-hidden transition-all', open && 'border-brand-500/30', className)}>
      {/* Header */}
      <button
        onClick={() => setOpen((s) => !s)}
        className={cn(
          'w-full flex items-center justify-between px-3.5 py-2.5 bg-dark-50/80 hover:bg-dark-50 transition-colors',
          open && 'border-b border-white/10',
          headerClassName,
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase font-mono">
            {title}
          </span>
          {badge !== undefined && (
            <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded px-1.5 py-0.5 text-[9px] font-bold font-mono">
              {badge}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-[10px] text-brand-400 font-bold leading-none"
        >
          ▼
        </motion.span>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
