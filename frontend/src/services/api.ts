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
                    // Retry the original request
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
    getStreams: () => api.get('/streams'),
    createStream: (data: { title: string; description?: string }) =>
        api.post('/streams', data),
    endStream: (streamId: string) =>
        api.patch(`/streams/${streamId}`, { status: 'ended' }),
};

// ── Payment Service ────────────────────────────────────────────────────────
export const paymentService = {
    setupConnect: () => api.post('/payments/setup-connect'),
    sendTip: (recipientId: string, amountCents: number, message?: string) =>
        api.post('/payments/tip', { recipient_id: recipientId, amount_cents: amountCents, message }),
};

// ── Analytics Service ──────────────────────────────────────────────────────
export const analyticsService = {
    getSummary: (streamId: string) => api.get(`/analytics/${streamId}/summary`),
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

// ── User Service ───────────────────────────────────────────────────────────
export const userService = {
    getMe: () => api.get('/users/me'),
    list: () => api.get('/users'),
};

export default api;
