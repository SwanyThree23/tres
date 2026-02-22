import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

// Mock Auth Interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || 'demo-user-id';
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const streamService = {
    getStreams: () => api.get('/streams'),
    createStream: (data: any) => api.post('/streams', data),
};

export const paymentService = {
    getSetupLink: () => api.post('/payments/connect/setup'),
    sendTip: (recipientId: string, amount: number) => api.post('/payments/tip', { recipient_id: recipientId, amount }),
};

export const analyticsService = {
    getSummary: (streamId: string) => api.get(`/analytics/${streamId}/summary`),
};

export const nftService = {
    mintHighlight: (data: any) => api.post('/ai/mint', data),
};

export default api;
