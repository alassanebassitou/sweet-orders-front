import { create } from 'zustand';

interface PresenceStore {
  onlineUsers: Set<string>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  isOnline: (userId: string) => boolean;
  reset: () => void;
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  onlineUsers: new Set(),
  setOnline: (id) =>
    set((s) => ({ onlineUsers: new Set([...s.onlineUsers, String(id)]) })),
  setOffline: (id) =>
    set((s) => {
      const next = new Set(s.onlineUsers);
      next.delete(String(id));
      return { onlineUsers: next };
    }),
  isOnline: (id) => get().onlineUsers.has(String(id)),
  reset: () => set({ onlineUsers: new Set() }),
}));
