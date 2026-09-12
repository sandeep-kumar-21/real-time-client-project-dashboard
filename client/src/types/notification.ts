export type NotificationType = "TASK_ASSIGNED" | "TASK_MOVED_TO_REVIEW";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedTaskId?: string | null;
  relatedTask?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    projectId: string;
  } | null;
  isRead: boolean;
  createdAt: string;
}
