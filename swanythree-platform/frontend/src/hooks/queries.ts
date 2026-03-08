/**
 * SwanyThree TanStack Query Hooks — Typed data fetching for every endpoint.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  authApi, streamsApi, paymentsApi, gamificationApi,
  watchPartyApi, recordingsApi, chatApi,
} from '@/services/api';

// ── Auth Queries ────────────────────────────────────────────────────

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ── Stream Queries ──────────────────────────────────────────────────

export function useStreams(params?: { status?: string; category?: string; page?: number }) {
  return useQuery({
    queryKey: ['streams', params],
    queryFn: () => streamsApi.list(params),
    staleTime: 15_000,
  });
}

export function useLiveStreams() {
  return useQuery({
    queryKey: ['streams', 'live'],
    queryFn: streamsApi.listLive,
    refetchInterval: 30_000,
  });
}

export function useStream(id: string | undefined) {
  return useQuery({
    queryKey: ['stream', id],
    queryFn: () => streamsApi.get(id!),
    enabled: !!id,
  });
}

export function useCreateStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: streamsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    },
  });
}

export function useGoLive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => streamsApi.goLive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['stream', id] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    },
  });
}

export function useEndStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => streamsApi.end(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['stream', id] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
    },
  });
}

// ── Payment Queries ─────────────────────────────────────────────────

export function useRevenue(period?: string) {
  return useQuery({
    queryKey: ['revenue', period],
    queryFn: () => paymentsApi.revenue(period),
    staleTime: 60_000,
  });
}

export function useTransactions(params?: { page?: number; type?: string }) {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: () => paymentsApi.transactions(params),
  });
}

export function useTip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.tip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// ── Gamification Queries ────────────────────────────────────────────

export function useGamificationProfile() {
  return useQuery({
    queryKey: ['gamification', 'profile'],
    queryFn: gamificationApi.getProfile,
    staleTime: 30_000,
  });
}

export function useLeaderboard(period?: string, limit?: number) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', period, limit],
    queryFn: () => gamificationApi.leaderboard({ period, limit }),
    staleTime: 60_000,
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ['gamification', 'challenges'],
    queryFn: gamificationApi.challenges,
    staleTime: 60_000,
  });
}

export function useBadges() {
  return useQuery({
    queryKey: ['gamification', 'badges'],
    queryFn: gamificationApi.badges,
    staleTime: 300_000,
  });
}

export function useMyBadges() {
  return useQuery({
    queryKey: ['gamification', 'myBadges'],
    queryFn: gamificationApi.myBadges,
    staleTime: 60_000,
  });
}

export function useAwardXP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gamificationApi.awardXP,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}

export function useUpdateStreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: gamificationApi.updateStreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'profile'] });
    },
  });
}

// ── Recording Queries ───────────────────────────────────────────────

export function useRecordings(params?: { page?: number }) {
  return useQuery({
    queryKey: ['recordings', params],
    queryFn: () => recordingsApi.list(params),
  });
}

// ── Chat Queries ────────────────────────────────────────────────────

export function useChatHistory(streamId: string | undefined, page?: number) {
  return useQuery({
    queryKey: ['chat', streamId, page],
    queryFn: () => chatApi.getHistory(streamId!, { page }),
    enabled: !!streamId,
  });
}

// ── Watch Party ─────────────────────────────────────────────────────

export function useCreateWatchParty() {
  return useMutation({
    mutationFn: (data: { stream_id: string; media_url: string }) => watchPartyApi.create(data),
  });
}
