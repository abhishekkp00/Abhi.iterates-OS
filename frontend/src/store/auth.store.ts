import { create } from 'zustand'
import { UserProfile } from '@/types/auth'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  login: (user: UserProfile, accessToken: string, refreshToken: string) => void
  logout: () => void
  setAccessToken: (token: string) => void
  setRefreshToken: (token: string) => void
  setInitialized: (initialized: boolean) => void
}

const REFRESH_TOKEN_KEY = 'abhi_os_refresh_token'

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  isAuthenticated: false,
  isInitialized: false,

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isInitialized: true,
    })
  },

  logout: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isInitialized: true,
    })
  },

  setAccessToken: (accessToken) => set({ accessToken }),
  
  setRefreshToken: (refreshToken) => {
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
    set({ refreshToken })
  },

  setInitialized: (isInitialized) => set({ isInitialized }),
}))
