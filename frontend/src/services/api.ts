import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_PREFIX, API_TIMEOUT_MS } from '@/constants/app'
import { useAuthStore } from '@/store/auth.store'

// Create custom axios instance
export const api = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Queue to handle multiple 401s concurrently during token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request Interceptor: Attach Access Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: Handle Token Refresh and Rotation (RTR)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    // Check if error status is 401 and request wasn't already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request and wait for the token refresh to finish
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (!refreshToken) {
        isRefreshing = false
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      try {
        // Attempt token refresh via silent POST request
        const response = await axios.post(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken, refreshToken: newRefreshToken, user } = response.data.data

        // Update auth store with new credentials
        useAuthStore.getState().login(user, accessToken, newRefreshToken)

        processQueue(null, accessToken)
        isRefreshing = false

        // Re-execute original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
        }
        return api(originalRequest)
      } catch (refreshError: unknown) {
        const err = refreshError as AxiosError
        processQueue(err, null)
        isRefreshing = false

        // Handle RTR Breach or Expired Session
        useAuthStore.getState().logout()
        
        // Check if this was a security breach
        const responseMsg = (err.response?.data as { message?: string })?.message || ''
        if (responseMsg.includes('Security Breach') || err.response?.status === 400) {
          window.location.href = '/unauthorized?breach=true'
        } else {
          window.location.href = '/session-expired'
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
