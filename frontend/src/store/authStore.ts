import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { api } from '../services/api';
import { AuthUser } from '../types/auth';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  login: (phone: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<AuthUser | null>;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      hydrated: false,

      setHydrated: (value) => set({ hydrated: value }),

      login: async (phone, password) => {
        const data = await api.login(phone, password);
        api.setToken(data.token);
        set({ token: data.token, user: data.user });
        return data.user;
      },

      logout: async () => {
        api.setToken(null);
        set({ token: null, user: null });
      },

      restoreSession: async () => {
        const { token } = get();
        if (!token) {
          set({ user: null });
          return null;
        }
        api.setToken(token);
        try {
          const user = await api.getMe();
          set({ user });
          return user;
        } catch {
          api.setToken(null);
          set({ token: null, user: null });
          return null;
        }
      },
    }),
    {
      name: 'pho-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.setToken(state.token);
        }
        state?.setHydrated(true);
      },
    }
  )
);

export function getRoleHomePath(role: AuthUser['role']): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MANAGER') return '/manager';
  return '/staff';
}
