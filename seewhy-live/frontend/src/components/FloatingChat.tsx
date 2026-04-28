import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react'
import { useStreamStore } from '@/stores/streamStore'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'

export default function FloatingChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [atBottom, setAtBottom] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { messages, sendMessage, currentStream } = useStreamStore()
  const { isAuthenticated } = useAuthStore()
  const streamId = currentStream?.id

  useEffect(() => {
    if (atBottom && open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, atBottom, open])

  function handleScroll() {
    if (!scrollRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setAtBottom(scrollHeight - scrollTop - clientHeight < 40)
  }

  function handleSend() {
    if (!input.trim() || !streamId) return
    sendMessage(input.trim())
    setInput('')
  }

  const unread = messages.length

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-80 h-96 flex flex-col rounded-2xl overflow-hidden border border-white/10"
            style={{ background: '#0a0a14' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10"
              style={{ background: '#14142b' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-white font-rajdhani tracking-wide">LIVE CHAT</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-hide"
            >
              {messages.length === 0 ? (
                <div className="text-center text-white/30 text-xs mt-8">No messages yet</div>
              ) : (
                messages.slice(-50).map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 mt-0.5">
                      {(msg.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gold text-xs font-semibold mr-1.5">{msg.username}</span>
                      <span className="text-white/80 text-xs break-words">{msg.content}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom */}
            {!atBottom && (
              <button
                onClick={() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setAtBottom(true) }}
                className="mx-3 mb-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-brand-600/40 text-brand-300 text-xs hover:bg-brand-600/60 transition-colors"
              >
                <ChevronDown size={12} /> New messages
              </button>
            )}

            {/* Input */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={streamId ? 'Say something...' : 'Join a stream to chat'}
                  disabled={!streamId}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/40 disabled:opacity-40"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || !streamId}
                  className="p-2 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold disabled:opacity-40 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            ) : (
              <div className="px-3 py-2 border-t border-white/10 text-center text-white/40 text-xs">
                <a href="/login" className="text-gold hover:underline">Sign in</a> to chat
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all',
          open ? 'bg-white/10 border border-white/20' : 'bg-gold text-dark-500'
        )}
        style={open ? {} : { boxShadow: '0 0 20px rgba(212,175,55,0.5)' }}
      >
        {open ? (
          <X size={22} className="text-white" />
        ) : (
          <>
            <MessageCircle size={22} />
            {unread > 0 && !open && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </>
        )}
      </motion.button>
    </div>
  )
}
