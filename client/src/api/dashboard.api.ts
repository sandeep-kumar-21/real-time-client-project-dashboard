import { apiClient } from "./client";
import type { DashboardMetrics } from "../types/dashboard";

export const dashboardApi = {
  getMetrics: async (): Promise<DashboardMetrics> => {
    const res = await apiClient.get("/dashboard/metrics");
    return res.data.data;
  },
};
