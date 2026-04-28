import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

export interface ChatMessage {
  id: string
  user_id: string
  username: string
  display_name: string
  avatar_url?: string
  content: string
  is_why_question: boolean
  timestamp: string
}

export interface WhyQuestion {
  id: string
  stream_id: string
  user_id: string
  username: string
  display_name: string
  question: string
  upvotes: number
  ai_answer?: string
  is_answered: boolean
  created_at: string
}

export interface StreamInfo {
  id: string
  title: string
  description?: string
  category: string
  tags: string[]
  creator_id: string
  creator_username: string
  creator_display_name: string
  creator_avatar_url?: string
  is_live: boolean
  viewer_count: number
  peak_viewer_count: number
  hls_url?: string
  thumbnail_url?: string
  started_at?: string
  created_at: string
}

interface StreamState {
  socket: Socket | null
  currentStream: StreamInfo | null
  messages: ChatMessage[]
  whyQuestions: WhyQuestion[]
  viewerCount: number
  isConnected: boolean

  connect: (streamId: string, token?: string) => void
  disconnect: () => void
  sendMessage: (content: string) => void
  askWhy: (question: string) => void
  upvoteQuestion: (questionId: string) => void
  setCurrentStream: (stream: StreamInfo | null) => void
}

export const useStreamStore = create<StreamState>((set, get) => ({
  socket: null,
  currentStream: null,
  messages: [],
  whyQuestions: [],
  viewerCount: 0,
  isConnected: false,

  connect: (streamId, token) => {
    const existing = get().socket
    if (existing) existing.disconnect()

    const socket = io('/', {
      auth: { token },
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      set({ isConnected: true })
      socket.emit('join_stream', { stream_id: streamId })
    })

    socket.on('disconnect', () => set({ isConnected: false }))

    socket.on('chat_message', (msg: ChatMessage) => {
      set((s) => ({ messages: [...s.messages.slice(-200), msg] }))
    })

    socket.on('why_question', (q: WhyQuestion) => {
      set((s) => ({ whyQuestions: [q, ...s.whyQuestions].slice(0, 50) }))
    })

    socket.on('question_updated', (updated: WhyQuestion) => {
      set((s) => ({
        whyQuestions: s.whyQuestions.map((q) => (q.id === updated.id ? updated : q)),
      }))
    })

    socket.on('viewer_count', ({ count }: { count: number }) => {
      set({ viewerCount: count })
    })

    set({ socket, messages: [], whyQuestions: [] })
  },

  disconnect: () => {
    const { socket, currentStream } = get()
    if (socket && currentStream) {
      socket.emit('leave_stream', { stream_id: currentStream.id })
      socket.disconnect()
    }
    set({ socket: null, isConnected: false, messages: [], whyQuestions: [], currentStream: null })
  },

  sendMessage: (content) => {
    const { socket, currentStream } = get()
    if (!socket || !currentStream) return
    socket.emit('send_message', { stream_id: currentStream.id, content })
  },

  askWhy: (question) => {
    const { socket, currentStream } = get()
    if (!socket || !currentStream) return
    socket.emit('ask_why', { stream_id: currentStream.id, question })
  },

  upvoteQuestion: (questionId) => {
    const { socket, currentStream } = get()
    if (!socket || !currentStream) return
    socket.emit('upvote_question', { stream_id: currentStream.id, question_id: questionId })
  },

  setCurrentStream: (stream) => set({ currentStream: stream }),
}))
