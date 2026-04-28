import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          err.config.headers.Authorization = `Bearer ${data.access_token}`
          return api(err.config)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  },
)

export default api

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { username: string; email: string; password: string; display_name: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (token: string) => api.post('/auth/refresh', { refresh_token: token }),
}

// Streams
export const streamsApi = {
  list: (params?: { category?: string; search?: string; live_only?: boolean; page?: number }) =>
    api.get('/streams', { params }),
  get: (id: string) => api.get(`/streams/${id}`),
  create: (data: { title: string; description?: string; category: string; tags?: string[] }) =>
    api.post('/streams', data),
  goLive: (id: string) => api.post(`/streams/${id}/go-live`),
  end: (id: string) => api.post(`/streams/${id}/end`),
  featured: () => api.get('/streams/featured'),
  trending: () => api.get('/streams/trending'),
  myStreams: () => api.get('/streams/mine'),
}

// Users
export const usersApi = {
  get: (id: string) => api.get(`/users/${id}`),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  unfollow: (id: string) => api.delete(`/users/${id}/follow`),
  followers: (id: string) => api.get(`/users/${id}/followers`),
  following: (id: string) => api.get(`/users/${id}/following`),
  updateProfile: (data: FormData) =>
    api.patch('/users/me', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// Watch Party
export const watchPartyApi = {
  create: (streamId: string) => api.post(`/streams/${streamId}/watch-party`),
  get: (partyId: string) => api.get(`/watch-parties/${partyId}`),
  join: (partyId: string) => api.post(`/watch-parties/${partyId}/join`),
  leave: (partyId: string) => api.post(`/watch-parties/${partyId}/leave`),
  sync: (partyId: string, position: number, playing: boolean) =>
    api.post(`/watch-parties/${partyId}/sync`, { position, playing }),
}

// Questions (the "why" feature)
export const questionsApi = {
  ask: (streamId: string, question: string) =>
    api.post(`/streams/${streamId}/questions`, { question }),
  list: (streamId: string) => api.get(`/streams/${streamId}/questions`),
  upvote: (streamId: string, questionId: string) =>
    api.post(`/streams/${streamId}/questions/${questionId}/upvote`),
  aiAnswer: (questionId: string) => api.post(`/questions/${questionId}/ai-answer`),
}
