import type { TaskStatus, TaskPriority } from "./task";

export interface ActivityLog {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  fromStatus?: TaskStatus | null;
  toStatus?: TaskStatus | null;
  message: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  task: {
    id: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
  };
  project?: {
    id: string;
    name: string;
  };
}
