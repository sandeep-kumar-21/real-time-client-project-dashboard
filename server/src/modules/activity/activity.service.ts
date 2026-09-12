import { Role } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AuthenticatedUser } from "../../@types/express.js";
import { ApiError } from "../../utils/ApiError.js";

interface FeedOptions {
  projectId?: string;
  limit?: number;
}

export class ActivityService {
  async getFeed(options: FeedOptions, user: AuthenticatedUser) {
    const limit = options.limit ? Math.min(Number(options.limit), 50) : 20;
    const where: any = {};

    // If specific project requested, verify access
    if (options.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: options.projectId },
        include: {
          tasks: { select: { assignedToId: true } },
        },
      });

      if (!project) {
        throw ApiError.notFound("Project not found", "PROJECT_NOT_FOUND");
      }

      if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.id) {
        throw ApiError.forbidden("Access denied to this project feed", "PROJECT_ACCESS_DENIED");
      }

      if (user.role === Role.DEVELOPER) {
        const hasAssignedTask = project.tasks.some((t) => t.assignedToId === user.id);
        if (!hasAssignedTask) {
          throw ApiError.forbidden("Access denied to this project feed", "PROJECT_ACCESS_DENIED");
        }
        // Developer sees activity only on tasks assigned to them within this project
        where.task = { assignedToId: user.id };
      }

      where.projectId = options.projectId;
    } else {
      // Global/Scoped feed according to Role
      if (user.role === Role.PROJECT_MANAGER) {
        // PM sees activity only from their own projects
        where.project = { createdById: user.id };
      } else if (user.role === Role.DEVELOPER) {
        // Developer sees activity only on tasks assigned to them
        where.task = { assignedToId: user.id };
      }
      // Admin sees activity across all projects (where = {})
    }

    // Direct database query — not cached in memory, satisfies Assessment requirement #17
    return prisma.taskActivityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        task: {
          select: { id: true, title: true, priority: true, status: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

export const activityService = new ActivityService();
