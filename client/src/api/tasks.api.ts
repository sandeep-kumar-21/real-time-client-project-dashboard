import { apiClient } from "./client";
import type { Task, TaskStatus, TaskPriority } from "../types/task";

export interface TaskFilterParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  dueFrom?: string;
  dueTo?: string;
}

export const tasksApi = {
  list: async (params?: TaskFilterParams): Promise<Task[]> => {
    const res = await apiClient.get("/tasks", { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<Task> => {
    const res = await apiClient.get(`/tasks/${id}`);
    return res.data.data;
  },

  create: async (data: {
    title: string;
    description?: string;
    projectId: string;
    assignedToId?: string | null;
    priority: TaskPriority;
    dueDate?: string | null;
  }): Promise<Task> => {
    const res = await apiClient.post("/tasks", data);
    return res.data.data;
  },

  updateStatus: async (id: string, status: TaskStatus) => {
    const res = await apiClient.patch(`/tasks/${id}/status`, { status });
    return res.data.data;
  },

  update: async (id: string, data: Partial<Task>): Promise<Task> => {
    const res = await apiClient.patch(`/tasks/${id}`, data);
    return res.data.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/tasks/${id}`);
    return res.data;
  },
};
