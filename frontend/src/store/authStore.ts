import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '../services/api';
import { AuthUser } from '../types/auth';
import { isSessionExpired } from '../utils/authSession';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loginAt: number | null;
  hydrated: boolean;
  login: (phone: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<AuthUser | null>;
  ensureSessionValid: () => boolean;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loginAt: null,
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      ensureSessionValid: () => {
        const { token, loginAt } = get();
        if (!isSessionExpired(token, loginAt)) {
          return true;
        }
        api.setToken(null);
        set({ token: null, user: null, loginAt: null });
        return false;
      },

      login: async (phone, password) => {
        const data = await api.login(phone, password);
        api.setToken(data.token);
        set({ token: data.token, user: data.user, loginAt: Date.now() });
        return data.user;
      },

      logout: async () => {
        api.setToken(null);
        set({ token: null, user: null, loginAt: null });
      },

      restoreSession: async () => {
        const { token, loginAt } = get();
        if (!token || isSessionExpired(token, loginAt)) {
          api.setToken(null);
          set({ token: null, user: null, loginAt: null });
          return null;
        }

        api.setToken(token);
        try {
          const user = await api.getMe();
          set({ user });
          return user;
        } catch {
          api.setToken(null);
          set({ token: null, user: null, loginAt: null });
          return null;
        }
      },
    }),
    {
      name: 'pho-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        loginAt: state.loginAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (state.token && isSessionExpired(state.token, state.loginAt)) {
          api.setToken(null);
          state.token = null;
          state.user = null;
          state.loginAt = null;
        } else if (state.token) {
          api.setToken(state.token);
        }

        state.setHydrated(true);
      },
    }
  )
);

export function getRoleHomePath(role: AuthUser['role']): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MANAGER') return '/manager';
  return '/staff';
}
