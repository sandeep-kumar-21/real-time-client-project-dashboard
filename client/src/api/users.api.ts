import { apiClient } from "./client";
import type { Role } from "../types/auth";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isOnline: boolean;
  createdAt: string;
  projectsCount: number;
  tasksCount: number;
}

export const usersApi = {
  list: async (): Promise<ManagedUser[]> => {
    const res = await apiClient.get("/users");
    return res.data.data;
  },

  getById: async (id: string): Promise<ManagedUser> => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data.data;
  },

  create: async (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<ManagedUser> => {
    const res = await apiClient.post("/users", data);
    return res.data.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      password?: string;
      role?: Role;
    }
  ): Promise<ManagedUser> => {
    const res = await apiClient.patch(`/users/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },
};
