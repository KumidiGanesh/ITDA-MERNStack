import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('peerlend.token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const authApi = {
  register: (userDetails) => api.post('/auth/register', userDetails),
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
}

export const loanApi = {
  create: (request) => api.post('/loans', request),
  getMine: () => api.get('/loans/'),
  getMarketplace: () => api.get('/loans/marketplace'),
  getMarketplaceLoan: (loanId) => api.get(`/loans/marketplace/${loanId}`),
  fund: (loanId, amount) => api.post(`/loans/${loanId}/fund`, { amount }),
  getRepayments: (loanId) => api.get(`/loans/${loanId}/repayments`),
  repay: (loanId, amount) => api.post(`/loans/${loanId}/repay`, { amount }),
}

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
}

export const transactionApi = {
  getAll: (params) => api.get('/transactions', { params }),
}

export function getApiErrorMessage(error, fallback) {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) return error.response.data.message
    if (error.code === 'ECONNABORTED') {
      return 'The server took too long to respond. Please try again.'
    }
    if (!error.response) {
      return 'We couldn’t reach PeerLend right now. Please check your connection and try again.'
    }
  }

  return fallback
}

export default api
