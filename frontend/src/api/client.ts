import axios from 'axios'
import { getCookie, removeCookie } from '../utils/cookies'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true, // Дозволяє автоматичну передачу cookie між фронтом і беком
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: додає Bearer токен із cookies (або localStorage)
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('access_token') || localStorage.getItem('booking_access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response Interceptor: обробляє 401 (розлогін та очищення куків)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeCookie('access_token')
      localStorage.removeItem('booking_access_token')
      localStorage.removeItem('booking_user')

      // Сповіщаємо додаток про розлогін
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  },
)
