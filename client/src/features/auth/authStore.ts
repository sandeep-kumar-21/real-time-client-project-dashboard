import { create } from "zustand";
import type { User } from "../../types/auth";
import { setAccessToken, apiClient } from "../../api/client";
import { disconnectSocket, getSocket } from "../../lib/socket";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: (user: User, token: string) => {
    setAccessToken(token);
    getSocket(token); // initialize authenticated socket
    set({
      user,
      accessToken: token,
      isAuthenticated: true,
      isInitializing: false,
    });
  },

  clearAuth: () => {
    setAccessToken(null);
    disconnectSocket();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  },

  checkAuth: async () => {
    try {
      // First attempt to refresh access token via HttpOnly cookie
      const refreshRes = await apiClient.post("/auth/refresh");
      const { user, accessToken } = refreshRes.data.data;
      get().setAuth(user, accessToken);
    } catch {
      // No active refresh session
      get().clearAuth();
    } finally {
      set({ isInitializing: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      get().clearAuth();
    }
  },
}));
