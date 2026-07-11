import { ApiResponse } from './index'

export interface UserProfile {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  roles: string[]
}

export interface AuthData {
  accessToken: string
  refreshToken: string
  user: UserProfile
}

export type AuthResponse = ApiResponse<AuthData>
