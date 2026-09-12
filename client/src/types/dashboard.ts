import type { Task, TaskPriority } from "./task";
import type { Project } from "./project";

export interface AdminDashboardMetrics {
  role: "ADMIN";
  totalProjects: number;
  totalClients: number;
  totalUsers: number;
  totalTasks: number;
  overdueCount: number;
  tasksByStatus: Record<string, number>;
  activeUsersOnline: number;
}

export interface PmDashboardMetrics {
  role: "PROJECT_MANAGER";
  totalProjects: number;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByStatus: Record<string, number>;
  dueThisWeek: Task[];
  projects: Project[];
}

export interface DeveloperDashboardMetrics {
  role: "DEVELOPER";
  totalAssigned: number;
  tasksByStatus: Record<string, number>;
  assignedTasks: Task[];
}

export type DashboardMetrics = AdminDashboardMetrics | PmDashboardMetrics | DeveloperDashboardMetrics;
