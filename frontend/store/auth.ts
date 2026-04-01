import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User { id: string; name: string; email: string; monthlyIncome: number; riskProfile: string; }
interface AuthState {
  user: User | null; token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, token: null,
      setAuth: (user, token) => { if (typeof window !== 'undefined') localStorage.setItem('fg_token', token); set({ user, token }); },
      clearAuth: () => { if (typeof window !== 'undefined') localStorage.removeItem('fg_token'); set({ user: null, token: null }); },
    }),
    { name: 'fg-auth' }
  )
);
