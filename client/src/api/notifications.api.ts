import { apiClient } from "./client";
import type { Notification } from "../types/notification";

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const res = await apiClient.get("/notifications");
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get("/notifications/unread-count");
    return res.data.data.unreadCount;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.patch("/notifications/read-all");
    return res.data;
  },
};
