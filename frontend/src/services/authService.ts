import api from './api';
import { TokenResponse } from '../types/auth';

export const authService = {
  register: async (data: any): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: any): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/login', data);
    return response.data;
  },

  googleLogin: async (idToken: string): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/google', { idToken });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};
