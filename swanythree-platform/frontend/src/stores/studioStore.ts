/**
 * SwanyThree Studio Store — Streaming studio state management.
 */

import { create } from 'zustand';
import type { Stream, ChatMessage } from '@/types';

type StudioStatus = 'idle' | 'setup' | 'preview' | 'live' | 'ending' | 'error';

interface StudioState {
  status: StudioStatus;
  stream: Stream | null;
  hasVideo: boolean;
  hasAudio: boolean;
  isRecording: boolean;
  viewerCount: number;
  chatMessages: ChatMessage[];
  error: string | null;
  setStatus: (status: StudioStatus) => void;
  setStream: (stream: Stream | null) => void;
  setHasVideo: (v: boolean) => void;
  setHasAudio: (v: boolean) => void;
  setIsRecording: (v: boolean) => void;
  setViewerCount: (count: number) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const MAX_CHAT_MESSAGES = 200;

export const useStudioStore = create<StudioState>((set) => ({
  status: 'idle',
  stream: null,
  hasVideo: true,
  hasAudio: true,
  isRecording: false,
  viewerCount: 0,
  chatMessages: [],
  error: null,

  setStatus: (status) => set({ status }),
  setStream: (stream) => set({ stream }),
  setHasVideo: (hasVideo) => set({ hasVideo }),
  setHasAudio: (hasAudio) => set({ hasAudio }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setViewerCount: (viewerCount) => set({ viewerCount }),
  setError: (error) => set({ error }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, msg].slice(-MAX_CHAT_MESSAGES),
    })),

  reset: () =>
    set({
      status: 'idle',
      stream: null,
      hasVideo: true,
      hasAudio: true,
      isRecording: false,
      viewerCount: 0,
      chatMessages: [],
      error: null,
    }),
}));
