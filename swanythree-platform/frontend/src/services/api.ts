/**
 * SwanyThree API Client — Typed HTTP client with auto-refresh interceptor.
 */

import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  LoginResponse, User, Stream, StreamGuest, Transaction,
  FeeBreakdown, RevenueReport, GamificationProfile, LeaderboardEntry,
  WeeklyChallenge, Badge, UserBadge, Recording, ChatMessage, Notification,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || '';

/** Create axios instance */
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/** Request interceptor — attach access token */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('st3_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Response interceptor — auto-refresh on 401 */
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(normalizeError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    isRefreshing = true;
    const refreshToken = localStorage.getItem('st3_refresh_token');

    if (!refreshToken) {
      handleLogout();
      return Promise.reject(normalizeError(error));
    }

    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refresh_token: refreshToken,
      });
      localStorage.setItem('st3_access_token', data.access_token);
      processQueue(null);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      handleLogout();
      return Promise.reject(normalizeError(error));
    } finally {
      isRefreshing = false;
    }
  },
);

function handleLogout() {
  localStorage.removeItem('st3_access_token');
  localStorage.removeItem('st3_refresh_token');
  localStorage.removeItem('st3_user');
  window.location.href = '/login';
}

function normalizeError(error: AxiosError): { message: string } {
  const data = error.response?.data as Record<string, unknown> | undefined;
  const message = (data?.detail as string) || (data?.error as string) || error.message || 'An error occurred';
  return { message };
}

// ── Auth API ────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; username: string; password: string; display_name?: string }) =>
    api.post<LoginResponse>('/api/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<LoginResponse>('/api/auth/login', data).then((r) => r.data),

  refresh: (refresh_token: string) =>
    api.post<{ success: boolean; access_token: string }>('/api/auth/refresh', { refresh_token }).then((r) => r.data),

  logout: () => api.post('/api/auth/logout').then((r) => r.data),

  getMe: () =>
    api.get<{ success: boolean; user: User; gamification: Record<string, unknown> | null }>('/api/auth/me').then((r) => r.data),
};

// ── Streams API ─────────────────────────────────────────────────────

export const streamsApi = {
  create: (data: { title: string; description?: string; category?: string; mode?: string; visibility?: string; tags?: string[] }) =>
    api.post<{ success: boolean; stream: Stream }>('/api/streams/', data).then((r) => r.data),

  list: (params?: { status?: string; category?: string; user_id?: string; page?: number; page_size?: number }) =>
    api.get<{ success: boolean; streams: Stream[]; total: number }>('/api/streams/', { params }).then((r) => r.data),

  listLive: () =>
    api.get<{ success: boolean; streams: Stream[] }>('/api/streams/live').then((r) => r.data),

  get: (id: string) =>
    api.get<{ success: boolean; stream: Stream; guests?: StreamGuest[] }>(`/api/streams/${id}`).then((r) => r.data),

  goLive: (id: string) =>
    api.post<{ success: boolean; stream: Stream }>(`/api/streams/${id}/go-live`).then((r) => r.data),

  end: (id: string) =>
    api.post<{ success: boolean; stream: Stream }>(`/api/streams/${id}/end`).then((r) => r.data),

  update: (id: string, data: Partial<Stream>) =>
    api.patch<{ success: boolean; stream: Stream }>(`/api/streams/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/streams/${id}`).then((r) => r.data),

  inviteGuest: (streamId: string, data: { guest_name: string; user_id?: string }) =>
    api.post<{ success: boolean; guest: StreamGuest }>(`/api/streams/${streamId}/guests`, data).then((r) => r.data),

  listGuests: (streamId: string) =>
    api.get<{ success: boolean; guests: StreamGuest[] }>(`/api/streams/${streamId}/guests`).then((r) => r.data),

  removeGuest: (streamId: string, guestId: string) =>
    api.delete(`/api/streams/${streamId}/guests/${guestId}`).then((r) => r.data),
};

// ── Payments API ────────────────────────────────────────────────────

export const paymentsApi = {
  tip: (data: { stream_id: string; amount: number; message?: string }) =>
    api.post<{ success: boolean; transaction: Transaction }>('/api/payments/tip', data).then((r) => r.data),

  paywallAccess: (data: { stream_id: string }) =>
    api.post('/api/payments/paywall-access', data).then((r) => r.data),

  calculateFees: (amount: number) =>
    api.get<FeeBreakdown & { success: boolean }>('/api/payments/calculate-fees', { params: { amount } }).then((r) => r.data),

  revenue: (period?: string) =>
    api.get<{ success: boolean; report: RevenueReport }>('/api/payments/revenue', { params: { period } }).then((r) => r.data),

  transactions: (params?: { page?: number; page_size?: number; type?: string }) =>
    api.get<{ success: boolean; transactions: Transaction[]; total: number }>('/api/payments/transactions', { params }).then((r) => r.data),
};

// ── Gamification API ────────────────────────────────────────────────

export const gamificationApi = {
  getProfile: () =>
    api.get<{ success: boolean; profile: GamificationProfile }>('/api/gamification/profile').then((r) => r.data),

  awardXP: (data: { action: string; stream_id?: string }) =>
    api.post<{ success: boolean } & Record<string, unknown>>('/api/gamification/award-xp', data).then((r) => r.data),

  updateStreak: () =>
    api.post<{ success: boolean; current_streak: number; best_streak: number; multiplier: number; broken: boolean }>(
      '/api/gamification/update-streak',
    ).then((r) => r.data),

  leaderboard: (params?: { period?: string; limit?: number }) =>
    api.get<{ success: boolean; leaderboard: LeaderboardEntry[] }>('/api/gamification/leaderboard', { params }).then((r) => r.data),

  challenges: () =>
    api.get<{ success: boolean; challenges: WeeklyChallenge[] }>('/api/gamification/challenges').then((r) => r.data),

  challengeProgress: (data: { challenge_id: string; increment?: number }) =>
    api.post('/api/gamification/challenge-progress', data).then((r) => r.data),

  badges: () =>
    api.get<{ success: boolean; badges: Badge[] }>('/api/gamification/badges').then((r) => r.data),

  myBadges: () =>
    api.get<{ success: boolean; badges: UserBadge[] }>('/api/gamification/badges/mine').then((r) => r.data),
};

// ── Watch Party API ─────────────────────────────────────────────────

export const watchPartyApi = {
  create: (data: { stream_id: string; media_url: string }) =>
    api.post('/api/watch-party/', data).then((r) => r.data),

  action: (streamId: string, data: { action: string; time?: number; media_url?: string }) =>
    api.post(`/api/watch-party/${streamId}/action`, data).then((r) => r.data),

  sync: (streamId: string) =>
    api.get(`/api/watch-party/${streamId}/sync`).then((r) => r.data),

  end: (streamId: string) =>
    api.delete(`/api/watch-party/${streamId}`).then((r) => r.data),
};

// ── Destinations API ────────────────────────────────────────────────

export const destinationsApi = {
  sealKey: (data: { platform: string; rtmp_url: string; stream_key: string }) =>
    api.post<{ success: boolean; encrypted_key: string }>('/api/destinations/seal-key', data).then((r) => r.data),

  startFanout: (guestId: string, data: { stream_id: string; input_source: string; destinations: unknown[] }) =>
    api.post(`/api/destinations/${guestId}/start`, data).then((r) => r.data),

  stopFanout: (guestId: string, platform?: string) =>
    api.post(`/api/destinations/${guestId}/stop`, { platform }).then((r) => r.data),

  status: () =>
    api.get('/api/destinations/status').then((r) => r.data),

  guestStatus: (guestId: string) =>
    api.get(`/api/destinations/${guestId}`).then((r) => r.data),
};

// ── Chat API ────────────────────────────────────────────────────────

export const chatApi = {
  sendMessage: (data: { stream_id: string; content: string; platform?: string }) =>
    api.post('/api/chat/messages', data).then((r) => r.data),

  getHistory: (streamId: string, params?: { page?: number; page_size?: number }) =>
    api.get<{ success: boolean; messages: ChatMessage[]; total: number }>(`/api/chat/messages/${streamId}`, { params }).then((r) => r.data),
};

// ── Recordings API ──────────────────────────────────────────────────

export const recordingsApi = {
  list: (params?: { page?: number; page_size?: number }) =>
    api.get<{ success: boolean; recordings: Recording[]; total: number }>('/api/recordings/', { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<{ success: boolean; recording: Recording }>(`/api/recordings/${id}`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/recordings/${id}`).then((r) => r.data),
};

// ── AI API ──────────────────────────────────────────────────────────

export const aiApi = {
  health: () => api.get('/api/ai/health').then((r) => r.data),
  moderate: (message: string, context?: string) =>
    api.post('/api/ai/moderate', { message, context }).then((r) => r.data),
  chat: (messages: Array<{ role: string; content: string }>, task?: string) =>
    api.post('/api/ai/chat', { messages, task }).then((r) => r.data),
  models: () => api.get('/api/ai/models').then((r) => r.data),
};

// ── Users API ───────────────────────────────────────────────────────

export const usersApi = {
  getProfile: (userId: string) =>
    api.get<{ success: boolean; user: User }>(`/api/users/${userId}`).then((r) => r.data),

  updateMe: (data: Partial<User>) =>
    api.patch('/api/users/me', data).then((r) => r.data),

  follow: (userId: string) =>
    api.post(`/api/users/${userId}/follow`).then((r) => r.data),

  unfollow: (userId: string) =>
    api.delete(`/api/users/${userId}/follow`).then((r) => r.data),
};

// ── Notifications API ───────────────────────────────────────────────

export const notificationsApi = {
  list: (params?: { page?: number; unread_only?: boolean }) =>
    api.get<{ success: boolean; notifications: Notification[]; total: number }>('/api/notifications', { params }).then((r) => r.data),

  markRead: (id: string) =>
    api.post(`/api/notifications/${id}/read`).then((r) => r.data),

  unreadCount: () =>
    api.get<{ success: boolean; count: number }>('/api/notifications/unread-count').then((r) => r.data),
};

export default api;
