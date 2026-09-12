import { Role, TaskStatus, NotificationType } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { AuthenticatedUser } from "../../@types/express.js";
import { formatActivityMessage } from "../../utils/formatActivityMessage.js";
import { emitActivity, emitTaskUpdated, emitNotification } from "../../sockets/emitter.js";
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterQuery,
} from "./tasks.validation.js";

export class TasksService {
  async create(input: CreateTaskInput, user: AuthenticatedUser) {
    if (user.role === Role.DEVELOPER) {
      throw ApiError.forbidden("Developers cannot create tasks", "DEVELOPER_CANNOT_CREATE_TASK");
    }

    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw ApiError.notFound("Project not found", "PROJECT_NOT_FOUND");
    }

    if (user.role === Role.PROJECT_MANAGER && project.createdById !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You can only add tasks to projects you created",
        "PROJECT_OWNERSHIP_REQUIRED"
      );
    }

    if (input.assignedToId) {
      const assignee = await prisma.user.findUnique({
        where: { id: input.assignedToId },
      });
      if (!assignee) {
        throw ApiError.notFound("Assigned user not found", "USER_NOT_FOUND");
      }
      if (assignee.role !== Role.DEVELOPER) {
        throw ApiError.badRequest(
          "Tasks can only be assigned to developers",
          "INVALID_ASSIGNEE_ROLE"
        );
      }
    }

    const parsedDueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (parsedDueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDateCalendar = new Date(parsedDueDate);
      dueDateCalendar.setHours(23, 59, 59, 999);
      if (dueDateCalendar < today) {
        throw ApiError.badRequest("Due date cannot be in the past", "INVALID_DUE_DATE");
      }
    }
    const isOverdue = parsedDueDate ? parsedDueDate < new Date() : false;

    // Create task, activity log, and optional notification atomically
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: input.title,
          description: input.description || null,
          projectId: input.projectId,
          assignedToId: input.assignedToId || null,
          priority: input.priority,
          dueDate: parsedDueDate,
          isOverdue,
          status: TaskStatus.TODO,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
        },
      });

      // Insert initial creation activity log
      const actor = await tx.user.findUnique({ where: { id: user.id } });
      const actorName = actor ? actor.name : user.email;

      const activityLog = await tx.taskActivityLog.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: user.id,
          fromStatus: null,
          toStatus: TaskStatus.TODO,
          message: formatActivityMessage(
            actorName,
            task.title,
            null,
            TaskStatus.TODO,
            task.assignedTo?.name
          ),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          task: {
            select: { id: true, title: true, priority: true, status: true, assignedToId: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
        },
      });

      // Notification if assigned to developer
      if (task.assignedToId) {
        await tx.notification.create({
          data: {
            userId: task.assignedToId,
            type: NotificationType.TASK_ASSIGNED,
            message: `You were assigned to task "${task.title}"`,
            relatedTaskId: task.id,
          },
        });
      }

      return { task, activityLog };
    });

    emitActivity(result.task.projectId, result.activityLog);

    if (result.task.assignedToId) {
      emitNotification(result.task.assignedToId, {
        userId: result.task.assignedToId,
        type: NotificationType.TASK_ASSIGNED,
        message: `You were assigned to task "${result.task.title}"`,
        relatedTaskId: result.task.id,
        createdAt: new Date(),
      });
    }

    return result.task;
  }

  async list(query: TaskFilterQuery, user: AuthenticatedUser) {
    const where: any = {};

    // 1. Role-based scoping
    if (user.role === Role.DEVELOPER) {
      // Assessment Requirement: Developer sees only assigned tasks
      where.assignedToId = user.id;
    } else if (user.role === Role.PROJECT_MANAGER) {
      // Assessment Requirement: PM sees tasks only from their own projects
      where.project = { createdById: user.id };
    }

    // 2. Query filters (shareable URLs)
    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.dueFrom || query.dueTo) {
      where.dueDate = {};
      if (query.dueFrom) {
        where.dueDate.gte = new Date(query.dueFrom);
      }
      if (query.dueTo) {
        where.dueDate.lte = new Date(query.dueTo);
      }
    }

    return prisma.task.findMany({
      where,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true, createdById: true },
        },
      },
    });
  }

  async getById(id: string, user: AuthenticatedUser) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true, createdById: true },
        },
        activityLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!task) {
      throw ApiError.notFound("Task not found", "TASK_NOT_FOUND");
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.createdById !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You can only view tasks from projects you created",
        "TASK_ACCESS_DENIED"
      );
    }

    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You can only view tasks assigned to you",
        "TASK_ACCESS_DENIED"
      );
    }

    return task;
  }

  async updateStatus(id: string, newStatus: TaskStatus, user: AuthenticatedUser) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, createdById: true, name: true } },
      },
    });

    if (!task) {
      throw ApiError.notFound("Task not found", "TASK_NOT_FOUND");
    }

    // Role & ownership check
    if (user.role === Role.PROJECT_MANAGER && task.project.createdById !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You cannot modify tasks on another Project Manager's project",
        "TASK_UPDATE_FORBIDDEN"
      );
    }

    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      throw ApiError.forbidden(
        "Access denied: Developers can only update status on tasks assigned to them",
        "TASK_UPDATE_FORBIDDEN"
      );
    }

    const oldStatus = task.status;
    if (oldStatus === newStatus) {
      return task;
    }

    // Interactive Transaction: Update status + Activity Log + Notification
    const result = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: {
          status: newStatus,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
        },
      });

      const actor = await tx.user.findUnique({ where: { id: user.id } });
      const actorName = actor ? actor.name : user.email;

      const message = formatActivityMessage(actorName, task.title, oldStatus, newStatus);

      const activityLog = await tx.taskActivityLog.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: user.id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          message,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          task: {
            select: { id: true, title: true, priority: true, status: true, assignedToId: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
        },
      });

      // Assessment Requirement #23: When task moved to In Review, PM receives notification
      let notification = null;
      if (newStatus === TaskStatus.IN_REVIEW && task.project.createdById !== user.id) {
        notification = await tx.notification.create({
          data: {
            userId: task.project.createdById,
            type: NotificationType.TASK_MOVED_TO_REVIEW,
            message: `Task "${task.title}" has been moved to In Review by ${actorName}`,
            relatedTaskId: task.id,
          },
        });
      }

      return { task: updatedTask, activityLog, notification };
    });

    // Broadcast live real-time WebSocket events
    emitActivity(result.task.projectId, result.activityLog);
    emitTaskUpdated(result.task.projectId, result.task);
    if (result.notification) {
      emitNotification(result.notification.userId, result.notification);
    }

    return result;
  }

  async update(id: string, input: UpdateTaskInput, user: AuthenticatedUser) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, createdById: true } },
      },
    });

    if (!task) {
      throw ApiError.notFound("Task not found", "TASK_NOT_FOUND");
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.createdById !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You cannot edit tasks on another Project Manager's project",
        "TASK_UPDATE_FORBIDDEN"
      );
    }

    if (user.role === Role.DEVELOPER) {
      throw ApiError.forbidden(
        "Access denied: Developers cannot edit task details",
        "DEVELOPER_TASK_EDIT_FORBIDDEN"
      );
    }

    if (input.assignedToId !== undefined && input.assignedToId !== null) {
      const assignee = await prisma.user.findUnique({
        where: { id: input.assignedToId },
      });
      if (!assignee) {
        throw ApiError.notFound("Assigned user not found", "USER_NOT_FOUND");
      }
      if (assignee.role !== Role.DEVELOPER) {
        throw ApiError.badRequest(
          "Tasks can only be assigned to developers",
          "INVALID_ASSIGNEE_ROLE"
        );
      }
    }

    const updateData: any = { ...input };
    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
      if (updateData.dueDate) {
        updateData.isOverdue = updateData.dueDate < new Date() && task.status !== TaskStatus.DONE;
      }
    }

    const isAssignmentChange =
      input.assignedToId !== undefined &&
      input.assignedToId !== task.assignedToId;

    const isNewAssignment =
      isAssignmentChange && input.assignedToId !== null;

    const actor = await prisma.user.findUnique({ where: { id: user.id } });
    const actorName = actor ? actor.name : user.email;

    let assignmentMessage = "";
    if (isAssignmentChange) {
      if (input.assignedToId) {
        const newAssignee = await prisma.user.findUnique({
          where: { id: input.assignedToId },
          select: { name: true },
        });
        const assigneeName = newAssignee ? newAssignee.name : "developer";
        assignmentMessage = task.assignedToId
          ? `${actorName} reassigned task "${task.title}" to ${assigneeName}`
          : `${actorName} assigned task "${task.title}" to ${assigneeName}`;
      } else {
        assignmentMessage = `${actorName} unassigned task "${task.title}"`;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true, createdById: true },
          },
        },
      });

      let notification = null;
      if (isNewAssignment) {
        notification = await tx.notification.create({
          data: {
            userId: input.assignedToId!,
            type: NotificationType.TASK_ASSIGNED,
            message: `You were assigned to task "${task.title}"`,
            relatedTaskId: task.id,
          },
        });
      }

      let activityLog = null;
      if (isAssignmentChange && assignmentMessage) {
        activityLog = await tx.taskActivityLog.create({
          data: {
            taskId: task.id,
            projectId: task.projectId,
            userId: user.id,
            fromStatus: null,
            toStatus: null,
            message: assignmentMessage,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
            task: {
              select: { id: true, title: true, priority: true, status: true, assignedToId: true },
            },
            project: {
              select: { id: true, name: true, createdById: true },
            },
          },
        });
      }

      return { task: updatedTask, notification, activityLog };
    });

    emitTaskUpdated(result.task.projectId, result.task);
    if (result.notification) {
      emitNotification(result.notification.userId, result.notification);
    }
    if (result.activityLog) {
      emitActivity(result.task.projectId, result.activityLog);
    }

    return result.task;
  }

  async delete(id: string, user: AuthenticatedUser) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { createdById: true } },
      },
    });

    if (!task) {
      throw ApiError.notFound("Task not found", "TASK_NOT_FOUND");
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.createdById !== user.id) {
      throw ApiError.forbidden(
        "Access denied: You cannot delete tasks on another Project Manager's project",
        "TASK_DELETE_FORBIDDEN"
      );
    }

    if (user.role === Role.DEVELOPER) {
      throw ApiError.forbidden("Developers cannot delete tasks");
    }

    await prisma.task.delete({ where: { id } });
    return { deleted: true };
  }
}

export const tasksService = new TasksService();
