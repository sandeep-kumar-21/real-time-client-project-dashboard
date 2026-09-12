import { apiClient } from "./client";
import type { Project } from "../types/project";

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const res = await apiClient.get("/projects");
    return res.data.data;
  },

  getById: async (id: string): Promise<Project> => {
    const res = await apiClient.get(`/projects/${id}`);
    return res.data.data;
  },

  create: async (data: { name: string; description?: string; clientId: string }): Promise<Project> => {
    const res = await apiClient.post("/projects", data);
    return res.data.data;
  },

  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.put(`/projects/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/projects/${id}`);
    return res.data;
  },
};
