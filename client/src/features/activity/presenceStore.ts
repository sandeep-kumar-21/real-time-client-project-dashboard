import { create } from "zustand";

interface PresenceState {
  onlineCount: number;
  onlineUserIds: string[];
  setPresence: (data: { count: number; onlineUserIds?: string[] }) => void;
  setUserPresence: (userId: string, isOnline: boolean, count?: number) => void;
  setOnlineCount: (count: number) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineCount: 1,
  onlineUserIds: [],
  setPresence: ({ count, onlineUserIds = [] }) =>
    set({ onlineCount: count, onlineUserIds }),
  setUserPresence: (userId: string, isOnline: boolean, count?: number) =>
    set((state) => {
      const nextIds = isOnline
        ? Array.from(new Set([...state.onlineUserIds, userId]))
        : state.onlineUserIds.filter((id) => id !== userId);
      return {
        onlineUserIds: nextIds,
        onlineCount: count !== undefined ? count : state.onlineCount,
      };
    }),
  setOnlineCount: (count: number) => set({ onlineCount: count }),
}));
