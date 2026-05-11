import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('dairy_auth_user')
    if (raw) {
      const user = JSON.parse(raw)
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
    }
  } catch {
    /* ignore */
  }
  return config
})

// Normalise error shape
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

// ---------- auth ----------
export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),
}

// ---------- dashboard ----------
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats').then((r) => r.data.data),
}

// ---------- farmers ----------
export const farmersApi = {
  list: (params = {}) =>
    api.get('/farmers', { params }).then((r) => ({ items: r.data.data, meta: r.data.meta })),
  getById: (id) => api.get(`/farmers/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/farmers', payload).then((r) => r.data.data),
  update: (id, payload) => api.put(`/farmers/${id}`, payload).then((r) => r.data.data),
  remove: (id) => api.delete(`/farmers/${id}`).then((r) => r.data.data),
}

// ---------- collections ----------
export const collectionsApi = {
  list: (params = {}) =>
    api.get('/collections', { params }).then((r) => ({ items: r.data.data, meta: r.data.meta })),
  getById: (id) => api.get(`/collections/${id}`).then((r) => r.data.data),
  create: (payload) => api.post('/collections', payload).then((r) => r.data.data),
  daily: (date) =>
    api.get('/collections/summary/daily', { params: date ? { date } : {} }).then((r) => r.data.data),
  monthly: (year, month, page = 1, limit = 10) =>
    api
      .get('/collections/summary/monthly', { params: { year, month, page, limit } })
      .then((r) => r.data.data),
  farmerHistory: (farmerId, params = {}) =>
    api
      .get(`/collections/farmer/${farmerId}`, { params })
      .then((r) => ({ items: r.data.data?.items ?? r.data.data, meta: r.data.meta })),
}
