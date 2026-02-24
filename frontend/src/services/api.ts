import axios, { AxiosError } from 'axios';

// ── Axios Instance ─────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: '/api',
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
});

// ── Auth Interceptor ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response Interceptor (auto-refresh or redirect on 401) ────────────────
api.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const res = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
                    localStorage.setItem('token', res.data.access_token);
                    localStorage.setItem('refresh_token', res.data.refresh_token);
                    if (error.config) {
                        error.config.headers['Authorization'] = `Bearer ${res.data.access_token}`;
                        return api(error.config);
                    }
                } catch {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refresh_token');
                    window.location.reload();
                }
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth Service ───────────────────────────────────────────────────────────
export const authService = {
    register: (data: { username: string; email: string; password: string; display_name?: string }) =>
        api.post('/auth/register', data),
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
};

// ── Stream Service ─────────────────────────────────────────────────────────
export const streamService = {
    getStreams: (status?: string) => api.get('/streams', { params: status ? { status } : {} }),
    createStream: (data: { title: string; description?: string; category?: string }) =>
        api.post('/streams', data),
    endStream: (streamId: string) =>
        api.patch(`/streams/${streamId}`, { status: 'ended' }),
    getStream: (streamId: string) => api.get(`/streams/${streamId}`),
};

// ── Payment Service ────────────────────────────────────────────────────────
export const paymentService = {
    setupConnect: () => api.post('/payments/setup-connect'),
    getConnectLink: () => api.get('/payments/connect-link'),
    sendTip: (recipientId: string, amountCents: number, message?: string) =>
        api.post('/payments/tip', { recipient_id: recipientId, amount_cents: amountCents, message }),
};

// ── Analytics Service ──────────────────────────────────────────────────────
export const analyticsService = {
    // GET /api/analytics/stream/{id}
    getStreamAnalytics: (streamId: string) => api.get(`/analytics/stream/${streamId}`),
    // GET /api/analytics/global
    getGlobal: () => api.get('/analytics/global'),
};

// ── NFT / AI Service ───────────────────────────────────────────────────────
export const nftService = {
    mintHighlight: (data: {
        video_url: string;
        title: string;
        description?: string;
        stream_id?: string;
    }) => api.post('/ai/mint-highlight', data),
};

// ── Notifications Service ──────────────────────────────────────────────────
export const notificationsService = {
    list: (unreadOnly?: boolean) =>
        api.get('/notifications', { params: unreadOnly ? { unread_only: true } : {} }),
    markRead: (notifId: string) =>
        api.post(`/notifications/${notifId}/read`),
    markAllRead: () => api.post('/notifications/read-all'),
    delete: (notifId: string) =>
        api.delete(`/notifications/${notifId}`),
};

// ── User / Profile Service ─────────────────────────────────────────────────
export const userService = {
    getMe: () => api.get('/users/me'),
    list: () => api.get('/users'),
};

// ── WebSocket helper ───────────────────────────────────────────────────────
export const createWebSocket = (): WebSocket => {
    const token = localStorage.getItem('token') ?? '';
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    return new WebSocket(`${proto}://${host}/api/ws?token=${encodeURIComponent(token)}`);
};

export default api;
