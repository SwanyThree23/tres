import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, HelpCircle, MessageSquare, TrendingUp, Lock } from 'lucide-react'
import { useStreamStore, type ChatMessage, type WhyQuestion } from '@/stores/streamStore'
import { useAuthStore } from '@/stores/authStore'
import { getInitials, timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Tab = 'chat' | 'why'

interface Props {
  streamId: string
}

export default function ChatPanel({ streamId }: Props) {
  const { user, isAuthenticated } = useAuthStore()
  const { messages, whyQuestions, sendMessage, askWhy, upvoteQuestion, isConnected } = useStreamStore()
  const [tab, setTab] = useState<Tab>('chat')
  const [input, setInput] = useState('')
  const [whyInput, setWhyInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, autoScroll])

  const handleScroll = () => {
    const el = chatRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setAutoScroll(isAtBottom)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !isConnected) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleAskWhy = (e: React.FormEvent) => {
    e.preventDefault()
    if (!whyInput.trim() || !isConnected) return
    askWhy(whyInput.trim())
    setWhyInput('')
  }

  const sortedQuestions = [...whyQuestions].sort((a, b) => b.upvotes - a.upvotes)

  return (
    <div className="flex flex-col h-full card">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {[
          { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare, count: messages.length },
          { id: 'why' as Tab, label: 'Why Board', icon: HelpCircle, count: whyQuestions.length },
        ].map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2',
              tab === id
                ? 'text-brand-400 border-brand-500'
                : 'text-white/50 border-transparent hover:text-white',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
            {count > 0 && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-mono',
                tab === id ? 'bg-brand-500/20 text-brand-400' : 'bg-white/10 text-white/50',
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Connection indicator */}
      <div className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors',
        isConnected ? 'text-emerald-400' : 'text-red-400',
      )}>
        <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
        {isConnected ? 'Connected' : 'Reconnecting...'}
      </div>

      {/* Chat tab */}
      {tab === 'chat' && (
        <>
          <div
            ref={chatRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide min-h-0"
          >
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatMsg key={msg.id} msg={msg} isOwn={msg.user_id === user?.id} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />

            {!autoScroll && (
              <button
                onClick={() => { setAutoScroll(true); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                className="sticky bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-brand-500 text-white text-xs px-3 py-1 rounded-full"
              >
                New messages ↓
              </button>
            )}
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-white/10">
            {isAuthenticated ? (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Say something..."
                  maxLength={500}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || !isConnected}
                  className="p-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 text-xs text-white/50 justify-center py-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Sign in to chat</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Why Board tab */}
      {tab === 'why' && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide min-h-0">
            {sortedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <HelpCircle className="w-8 h-8 text-white/20 mb-2" />
                <p className="text-sm text-white/40">No questions yet</p>
                <p className="text-xs text-white/30">Be the first to ask why!</p>
              </div>
            ) : (
              sortedQuestions.map((q, i) => (
                <WhyCard key={q.id} question={q} rank={i + 1} onUpvote={() => upvoteQuestion(q.id)} />
              ))
            )}
          </div>

          {/* Why input */}
          <div className="p-3 border-t border-white/10">
            {isAuthenticated ? (
              <form onSubmit={handleAskWhy}>
                <div className="flex gap-2 mb-1">
                  <div className="flex-1 relative">
                    <HelpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                    <input
                      value={whyInput}
                      onChange={(e) => setWhyInput(e.target.value)}
                      placeholder="Ask why..."
                      maxLength={200}
                      className="w-full bg-cyan-500/5 border border-cyan-500/30 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!whyInput.trim() || !isConnected}
                    className="p-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 rounded-lg transition-colors"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
                <p className="text-xs text-white/30 text-right">{whyInput.length}/200</p>
              </form>
            ) : (
              <div className="flex items-center gap-2 text-xs text-white/50 justify-center py-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Sign in to ask why</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ChatMsg({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('flex items-start gap-2', isOwn && 'flex-row-reverse')}
    >
      <div className="w-6 h-6 flex-shrink-0 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-xs font-bold overflow-hidden">
        {msg.avatar_url ? (
          <img src={msg.avatar_url} alt={msg.display_name} className="w-full h-full object-cover" />
        ) : (
          getInitials(msg.display_name)
        )}
      </div>
      <div className={cn('max-w-[75%]', isOwn && 'items-end flex flex-col')}>
        <span className="text-xs text-white/50 mb-0.5">{msg.display_name}</span>
        <div className={cn(
          'px-3 py-1.5 rounded-xl text-sm',
          msg.is_why_question
            ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-100'
            : isOwn
            ? 'bg-brand-500/30 text-white'
            : 'bg-white/10 text-white',
        )}>
          {msg.is_why_question && <span className="text-cyan-400 font-semibold mr-1">WHY?</span>}
          {msg.content}
        </div>
      </div>
    </motion.div>
  )
}

function WhyCard({ question, rank, onUpvote }: { question: WhyQuestion; rank: number; onUpvote: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-3 border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col items-center gap-1 min-w-8">
          <button
            onClick={onUpvote}
            className="flex flex-col items-center gap-0.5 text-white/50 hover:text-cyan-400 transition-colors group"
          >
            <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-mono font-bold">{question.upvotes}</span>
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-white/40">#{rank}</span>
            <span className="text-xs text-white/50">{question.display_name}</span>
          </div>
          <p className="text-sm text-white font-medium leading-snug">{question.question}</p>
          {question.ai_answer && (
            <div className="mt-2 p-2 bg-brand-500/10 border border-brand-500/20 rounded-lg">
              <p className="text-xs text-brand-300 font-semibold mb-1">AI Answer</p>
              <p className="text-xs text-white/80">{question.ai_answer}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
