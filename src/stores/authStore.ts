import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'ROLE_ADMIN' | 'ROLE_CLIENT';

export interface User {
  id?: string;
  userId?: string;
  email: string;
  name?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  role: Role;
  photoUrl?: string;
  isActif?: boolean;
}

interface AuthState {
  user: User | null;
  sessionId: string | null;
  /** @deprecated kept for backwards compat - mirrors sessionId */
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, sessionId: string) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      sessionId: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, sessionId) =>
        set({ user, sessionId, token: sessionId, isAuthenticated: true }),
      updateUser: (patch) =>
        set((s) => (s.user ? { user: { ...s.user, ...patch } } : s)),
      logout: () =>
        set({ user: null, sessionId: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
