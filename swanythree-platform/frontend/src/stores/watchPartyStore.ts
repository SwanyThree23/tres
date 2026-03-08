/**
 * SwanyThree Watch Party Store — Synchronized playback state.
 */

import { create } from 'zustand';
import type { WatchPartySyncPayload } from '@/types';

interface WatchPartyState {
  isActive: boolean;
  mediaUrl: string;
  isPlaying: boolean;
  currentTime: number;
  serverTimeDelta: number;
  isHost: boolean;
  activate: (url: string, isHost: boolean) => void;
  syncState: (payload: WatchPartySyncPayload) => void;
  setPlaying: (playing: boolean) => void;
  deactivate: () => void;
}

export const useWatchPartyStore = create<WatchPartyState>((set) => ({
  isActive: false,
  mediaUrl: '',
  isPlaying: false,
  currentTime: 0,
  serverTimeDelta: 0,
  isHost: false,

  activate: (url, isHost) =>
    set({
      isActive: true,
      mediaUrl: url,
      isPlaying: false,
      currentTime: 0,
      isHost,
    }),

  syncState: (payload) => {
    const now = Date.now() / 1000;
    const delta = now - payload.server_time;
    set({
      isActive: payload.is_active,
      mediaUrl: payload.media_url,
      isPlaying: payload.is_playing,
      currentTime: payload.current_time,
      serverTimeDelta: delta,
    });
  },

  setPlaying: (isPlaying) => set({ isPlaying }),

  deactivate: () =>
    set({
      isActive: false,
      mediaUrl: '',
      isPlaying: false,
      currentTime: 0,
      serverTimeDelta: 0,
      isHost: false,
    }),
}));
