import { api } from './api'
import { AuthResponse, UserProfile } from '@/types/auth'
import { LoginPayload, RegisterPayload } from '@/types/auth.payload'

export const AuthService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', payload)
    return response.data
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', payload)
    return response.data
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken })
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/refresh', { refreshToken })
    return response.data
  },

  async getMe(): Promise<UserProfile> {
    const response = await api.get<{ data: UserProfile }>('/auth/me')
    return response.data.data
  },
}

