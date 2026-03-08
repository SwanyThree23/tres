/**
 * SwanyThree Gamification Store — XP, badges, challenges, and event queue.
 */

import { create } from 'zustand';
import type { GamificationProfile, WeeklyChallenge, LeaderboardEntry, GamificationEvent } from '@/types';

interface GamificationState {
  profile: GamificationProfile | null;
  challenges: WeeklyChallenge[];
  leaderboard: LeaderboardEntry[];
  pendingEvents: GamificationEvent[];
  setProfile: (profile: GamificationProfile) => void;
  setChallenges: (challenges: WeeklyChallenge[]) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  pushEvent: (event: GamificationEvent) => void;
  shiftEvent: () => GamificationEvent | undefined;
  clearEvents: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: null,
  challenges: [],
  leaderboard: [],
  pendingEvents: [],

  setProfile: (profile) => set({ profile }),
  setChallenges: (challenges) => set({ challenges }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  pushEvent: (event) =>
    set((state) => ({
      pendingEvents: [...state.pendingEvents, event],
    })),

  shiftEvent: () => {
    const events = get().pendingEvents;
    if (events.length === 0) return undefined;
    const [first, ...rest] = events;
    set({ pendingEvents: rest });
    return first;
  },

  clearEvents: () => set({ pendingEvents: [] }),
}));
