import { create } from 'zustand';

interface AuthState {
  user: {
    id: number;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    id: number;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
  }) => void;
  clearAuth: () => void;
  updateAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from local storage safely
  const storedToken = localStorage.getItem('accessToken');
  const storedRefreshToken = localStorage.getItem('refreshToken');
  const storedUser = localStorage.getItem('user');

  let user = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch (e) {
      console.error('Failed to parse stored user', e);
    }
  }

  return {
    user,
    accessToken: storedToken,
    refreshToken: storedRefreshToken,
    isAuthenticated: !!storedToken,
    setAuth: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      const userPayload = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
      };
      localStorage.setItem('user', JSON.stringify(userPayload));

      set({
        user: userPayload,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
      });
    },
    clearAuth: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    },
    updateAccessToken: (token) => {
      localStorage.setItem('accessToken', token);
      set({ accessToken: token });
    },
  };
});
