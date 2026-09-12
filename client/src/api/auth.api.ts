import { apiClient } from "./client";

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post("/auth/login", credentials);
    return res.data.data;
  },

  logout: async () => {
    const res = await apiClient.post("/auth/logout");
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get("/auth/me");
    return res.data.data;
  },

  listUsers: async (role?: string): Promise<{ id: string; name: string; email: string; role: string }[]> => {
    const res = await apiClient.get("/auth/users", { params: role ? { role } : undefined });
    return res.data.data;
  },
};
