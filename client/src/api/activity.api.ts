import { apiClient } from "./client";
import type { ActivityLog } from "../types/activity";

export const activityApi = {
  getFeed: async (params?: { projectId?: string; limit?: number }): Promise<ActivityLog[]> => {
    const res = await apiClient.get("/activity/feed", { params });
    return res.data.data;
  },
};
