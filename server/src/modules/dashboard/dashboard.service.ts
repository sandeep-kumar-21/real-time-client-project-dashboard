import { Role, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AuthenticatedUser } from "../../@types/express.js";
import { presenceTracker } from "../../sockets/presence.js";

export class DashboardService {
  async getMetrics(user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return this.getAdminMetrics();
    } else if (user.role === Role.PROJECT_MANAGER) {
      return this.getPmMetrics(user.id);
    } else {
      return this.getDeveloperMetrics(user.id);
    }
  }

  private async getAdminMetrics() {
    const [totalProjects, totalClients, totalUsers, overdueCount, taskStatusGroups] =
      await Promise.all([
        prisma.project.count(),
        prisma.client.count(),
        prisma.user.count(),
        prisma.task.count({ where: { isOverdue: true, status: { not: TaskStatus.DONE } } }),
        prisma.task.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      ]);

    const tasksByStatus: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    taskStatusGroups.forEach((group) => {
      tasksByStatus[group.status] = group._count._all;
    });

    const totalTasks = Object.values(tasksByStatus).reduce((a, b) => a + b, 0);

    return {
      role: Role.ADMIN,
      totalProjects,
      totalClients,
      totalUsers,
      totalTasks,
      overdueCount,
      tasksByStatus,
      activeUsersOnline: presenceTracker.getOnlineCount(),
    };
  }

  private async getPmMetrics(userId: string) {
    const now = new Date();
    const oneWeekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [totalProjects, taskPriorityGroups, taskStatusGroups, dueThisWeek, projects] =
      await Promise.all([
        prisma.project.count({ where: { createdById: userId } }),
        prisma.task.groupBy({
          by: ["priority"],
          where: { project: { createdById: userId } },
          _count: { _all: true },
        }),
        prisma.task.groupBy({
          by: ["status"],
          where: { project: { createdById: userId } },
          _count: { _all: true },
        }),
        prisma.task.findMany({
          where: {
            project: { createdById: userId },
            dueDate: { gte: now, lte: oneWeekLater },
            status: { not: TaskStatus.DONE },
          },
          orderBy: { dueDate: "asc" },
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            project: { select: { id: true, name: true } },
          },
        }),
        prisma.project.findMany({
          where: { createdById: userId },
          include: {
            client: { select: { id: true, name: true } },
            _count: { select: { tasks: true } },
          },
          take: 10,
        }),
      ]);

    const tasksByPriority: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    taskPriorityGroups.forEach((group) => {
      tasksByPriority[group.priority] = group._count._all;
    });

    const tasksByStatus: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    taskStatusGroups.forEach((group) => {
      tasksByStatus[group.status] = group._count._all;
    });

    return {
      role: Role.PROJECT_MANAGER,
      totalProjects,
      tasksByPriority,
      tasksByStatus,
      dueThisWeek,
      projects,
    };
  }

  private async getDeveloperMetrics(userId: string) {
    const [totalAssigned, taskStatusGroups, assignedTasks] = await Promise.all([
      prisma.task.count({ where: { assignedToId: userId } }),
      prisma.task.groupBy({
        by: ["status"],
        where: { assignedToId: userId },
        _count: { _all: true },
      }),
      prisma.task.findMany({
        where: { assignedToId: userId, status: { not: TaskStatus.DONE } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    const tasksByStatus: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };

    taskStatusGroups.forEach((group) => {
      tasksByStatus[group.status] = group._count._all;
    });

    // Sort assigned tasks with explicit severity order (CRITICAL -> HIGH -> MEDIUM -> LOW)
    const priorityWeight: Record<TaskPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    assignedTasks.sort((a, b) => {
      const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (weightDiff !== 0) return weightDiff;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return {
      role: Role.DEVELOPER,
      totalAssigned,
      tasksByStatus,
      assignedTasks,
    };
  }
}

export const dashboardService = new DashboardService();
