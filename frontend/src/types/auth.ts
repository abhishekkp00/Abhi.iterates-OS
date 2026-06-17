export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string;
  provider: 'LOCAL' | 'GOOGLE';
  isActive: boolean;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}
