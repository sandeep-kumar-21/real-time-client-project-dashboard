import { apiClient } from "./client";
import type { Client } from "../types/project";

export const clientsApi = {
  list: async (): Promise<Client[]> => {
    const res = await apiClient.get("/clients");
    return res.data.data;
  },

  getById: async (id: string): Promise<Client> => {
    const res = await apiClient.get(`/clients/${id}`);
    return res.data.data;
  },

  create: async (data: { name: string; email?: string; company?: string }): Promise<Client> => {
    const res = await apiClient.post("/clients", data);
    return res.data.data;
  },

  update: async (id: string, data: { name?: string; email?: string; company?: string }): Promise<Client> => {
    const res = await apiClient.put(`/clients/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string, cascade?: boolean) => {
    const res = await apiClient.delete(`/clients/${id}`, {
      params: cascade ? { cascade: true } : undefined,
    });
    return res.data;
  },
};
